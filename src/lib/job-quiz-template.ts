import type { Job } from "@/generated/prisma";
import type { QuizQuestion } from "@/lib/quiz-schema";
import { prisma } from "@/lib/prisma";
import { generateQuizJson } from "@/lib/ollama";
import { buildQuizPrompt } from "@/lib/quiz-prompt";

function buildPrefixedQuestions(): QuizQuestion[] {
  return [
    {
      id: "travel_plan",
      type: "multiple_choice",
      text: "How are you planning to travel there?",
      options: ["Car", "Public Transport", "Other"],
    },
  ];
}

function mergeQuestions(job: Job, modelQuestions: QuizQuestion[]): QuizQuestion[] {
  const prefixed = buildPrefixedQuestions();
  const used = new Set(prefixed.map((q) => q.id));
  const normalizedTail: QuizQuestion[] = [];
  for (const q of modelQuestions) {
    if (used.has(q.id)) continue;
    used.add(q.id);
    normalizedTail.push(q);
    if (normalizedTail.length >= 6) break;
  }
  return [...prefixed, ...normalizedTail];
}

export async function upsertJobQuizTemplate(job: Job) {
  const prompt = buildQuizPrompt(job);
  const payload = await generateQuizJson(prompt);
  const questions = mergeQuestions(job, payload.questions);
  return prisma.jobQuizTemplate.upsert({
    where: { jobId: job.id },
    create: {
      jobId: job.id,
      questions,
    },
    update: {
      questions,
    },
  });
}

export async function getOrCreateJobQuizTemplate(job: Job) {
  const existing = await prisma.jobQuizTemplate.findUnique({
    where: { jobId: job.id },
  });
  if (existing) return existing;
  return upsertJobQuizTemplate(job);
}
