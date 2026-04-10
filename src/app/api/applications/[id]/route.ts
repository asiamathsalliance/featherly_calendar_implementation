import { DEMO_WORKER_ID, ensureDemoUsers } from "@/lib/demo-users";
import { prisma } from "@/lib/prisma";
import {
  answersSchema,
  elaborationsSchema,
  type QuizQuestion,
} from "@/lib/quiz-schema";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  answers: answersSchema,
  elaborations: elaborationsSchema.optional(),
  submit: z.boolean().optional(),
});

export async function GET(_req: Request, context: Params) {
  await ensureDemoUsers();

  const { id } = await context.params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: { job: true, quiz: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ application });
}

export async function PATCH(req: Request, context: Params) {
  await ensureDemoUsers();

  const { id } = await context.params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: { job: true, quiz: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (application.workerId !== DEMO_WORKER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const isFinalSubmit = parsed.data.submit !== false;

  if (!application.quiz) {
    return NextResponse.json(
      { error: "Quiz not generated yet" },
      { status: 400 }
    );
  }

  const questions = application.quiz.questions as QuizQuestion[];
  const ids = new Set(questions.map((q) => q.id));
  for (const key of Object.keys(parsed.data.answers)) {
    if (!ids.has(key)) {
      return NextResponse.json(
        { error: `Unknown question id: ${key}` },
        { status: 422 }
      );
    }
  }

  const rawAnswers = parsed.data.answers;
  const mergedAnswers: Record<string, boolean | number | string> = {};
  for (const q of questions) {
    const raw = rawAnswers[q.id];
    if (q.type === "yes_no") {
      mergedAnswers[q.id] = raw === true || raw === "true";
    } else if (q.type === "likert") {
      const n =
        typeof raw === "number"
          ? raw
          : typeof raw === "string"
            ? Number(raw)
            : NaN;
      const scale = q.scale ?? 5;
      mergedAnswers[q.id] = Number.isFinite(n)
        ? Math.min(scale, Math.max(1, Math.round(n)))
        : Math.ceil(scale / 2);
    } else {
      mergedAnswers[q.id] =
        typeof raw === "string" ? raw : String(raw ?? "");
    }
  }

  const elaborations = parsed.data.elaborations ?? {};
  for (const key of Object.keys(elaborations)) {
    if (!ids.has(key)) {
      return NextResponse.json(
        { error: `Unknown elaboration id: ${key}` },
        { status: 422 }
      );
    }
    const q = questions.find((x) => x.id === key);
    if (!q || q.type !== "yes_no") {
      return NextResponse.json(
        { error: "Elaborations are only for yes/no questions" },
        { status: 422 }
      );
    }
  }

  if (isFinalSubmit) {
    for (const q of questions) {
      if (q.type !== "yes_no") continue;
      if (mergedAnswers[q.id] === true) {
        const text = (elaborations[q.id] ?? "").trim();
        if (text.length < 1) {
          return NextResponse.json(
            {
              error: "For each Yes answer, add a short note listing relevant experience.",
            },
            { status: 422 }
          );
        }
      }
    }
  }

  const elaborationsToStore: Record<string, string> = {};
  for (const q of questions) {
    if (q.type === "yes_no" && mergedAnswers[q.id] === true) {
      elaborationsToStore[q.id] = (elaborations[q.id] ?? "").trim();
    }
  }

  // Store elaborations inside `answers` JSON (suffixed keys) so we only touch the
  // `answers` column — avoids Prisma/DB issues with a separate `elaborations` field.
  const answersForDb: Record<string, boolean | number | string> = {
    ...mergedAnswers,
  };
  for (const [id, text] of Object.entries(elaborationsToStore)) {
    answersForDb[`${id}__elab`] = text;
  }

  await prisma.$transaction(async (tx) => {
    await tx.quizAttempt.update({
      where: { applicationId: application.id },
      data: {
        answers: answersForDb,
      },
    });
    if (isFinalSubmit) {
      await tx.application.update({
        where: { id: application.id },
        data: { status: "PENDING" },
      });
    }
  });

  const updated = await prisma.application.findUnique({
    where: { id: application.id },
    include: { job: true, quiz: true },
  });

  return NextResponse.json({ application: updated });
}
