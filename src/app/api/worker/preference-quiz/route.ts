import { DEMO_WORKER_ID, ensureDemoUsers } from "@/lib/demo-users";
import {
  inferTopThreeCategories,
  validateAllAnswersPresent,
} from "@/lib/preference-category-inference";
import { PREFERENCE_QUIZ_QUESTION_IDS } from "@/lib/worker-preference-quiz-data";
import { prisma } from "@/lib/prisma";
import {
  getUserPreferenceQuizFields,
  saveUserPreferenceQuiz,
} from "@/lib/worker-preference-quiz-persistence";
import { NextResponse } from "next/server";
import { z } from "zod";

const answersShape = Object.fromEntries(
  PREFERENCE_QUIZ_QUESTION_IDS.map((id) => [
    id,
    z.number().int().min(1).max(10),
  ])
) as Record<string, z.ZodNumber>;

const answersSchema = z.object(answersShape).strict();

export async function GET() {
  try {
    await ensureDemoUsers();
    const user = await prisma.user.findUnique({
      where: { id: DEMO_WORKER_ID },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const { preferenceQuizCompletedAt, topCategories } =
      await getUserPreferenceQuizFields(DEMO_WORKER_ID);
    return NextResponse.json({
      completed: Boolean(preferenceQuizCompletedAt),
      completedAt: preferenceQuizCompletedAt?.toISOString() ?? null,
      topCategories,
    });
  } catch (e) {
    console.error("[preference-quiz GET]", e);
    return NextResponse.json(
      { error: "Could not load quiz status." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureDemoUsers();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = answersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Send only pref-q1 … pref-q20 as keys, each an integer from 1–10.",
          details: parsed.error.flatten(),
        },
        { status: 422 }
      );
    }

    const answers = parsed.data;

    const check = validateAllAnswersPresent(answers);
    if (!check.ok) {
      return NextResponse.json(
        { error: "Invalid or missing values", missing: check.missing },
        { status: 422 }
      );
    }

    const { topCategories, source } = await inferTopThreeCategories(answers);

    await saveUserPreferenceQuiz(DEMO_WORKER_ID, answers, topCategories);
    const completedAt = new Date();

    return NextResponse.json({
      topCategories: [...topCategories],
      completedAt: completedAt.toISOString(),
      inferenceSource: source,
    });
  } catch (e) {
    console.error("[preference-quiz POST]", e);
    return NextResponse.json(
      { error: "Could not save quiz. Try again later." },
      { status: 500 }
    );
  }
}
