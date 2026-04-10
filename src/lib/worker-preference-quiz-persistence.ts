import { prisma } from "@/lib/prisma";
import { parseStoredTopCategories } from "@/lib/preference-quiz-storage";

type PreferenceQuizRow = {
  preferenceQuizCompletedAt: Date | null;
  preferenceQuizTopCategories: unknown;
};

/**
 * Reads quiz columns via raw SQL so this works even when the checked-in Prisma
 * client was generated before `preferenceQuiz*` fields existed (avoids
 * PrismaClientValidationError on `select` / `update`).
 */
export async function getUserPreferenceQuizFields(
  userId: string
): Promise<{
  preferenceQuizCompletedAt: Date | null;
  topCategories: string[];
}> {
  const rows = await prisma.$queryRawUnsafe<PreferenceQuizRow[]>(
    `SELECT "preferenceQuizCompletedAt", "preferenceQuizTopCategories" FROM "User" WHERE id = $1`,
    userId
  );
  const row = rows[0];
  if (!row) {
    return { preferenceQuizCompletedAt: null, topCategories: [] };
  }
  return {
    preferenceQuizCompletedAt: row.preferenceQuizCompletedAt,
    topCategories: parseStoredTopCategories(row.preferenceQuizTopCategories),
  };
}

export async function saveUserPreferenceQuiz(
  userId: string,
  answers: Record<string, number>,
  topCategories: readonly string[]
): Promise<void> {
  if (topCategories.length !== 3) {
    throw new Error("saveUserPreferenceQuiz requires exactly 3 categories");
  }
  await prisma.$executeRawUnsafe(
    `UPDATE "User" SET "preferenceQuizAnswers" = $1::jsonb, "preferenceQuizCompletedAt" = $2, "preferenceQuizTopCategories" = $3::jsonb WHERE id = $4`,
    JSON.stringify(answers),
    new Date(),
    JSON.stringify([...topCategories]),
    userId
  );
}
