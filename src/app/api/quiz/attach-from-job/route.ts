import { DEMO_WORKER_ID, ensureDemoUsers } from "@/lib/demo-users";
import { getOrCreateJobQuizTemplate } from "@/lib/job-quiz-template";
import { prisma } from "@/lib/prisma";
import { quizPayloadSchema } from "@/lib/quiz-schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  applicationId: z.string().min(1),
});

/**
 * Creates/updates QuizAttempt from the job's template.
 * If no template exists yet, one is generated at apply time.
 */
export async function POST(req: Request) {
  await ensureDemoUsers();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const application = await prisma.application.findUnique({
    where: { id: parsed.data.applicationId },
    include: { job: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (application.workerId !== DEMO_WORKER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const template = await getOrCreateJobQuizTemplate(application.job);
  const raw = template.questions;
  const prelim = quizPayloadSchema.parse({
    questions: Array.isArray(raw) ? raw : [],
  });
  const payload = quizPayloadSchema.parse({
    questions: prelim.questions.filter((q) => q.id !== "availability_time"),
  });

  const quiz = await prisma.quizAttempt.upsert({
    where: { applicationId: application.id },
    create: {
      applicationId: application.id,
      questions: payload.questions,
    },
    update: {
      questions: payload.questions,
    },
  });

  return NextResponse.json({ quiz, questions: payload.questions });
}
