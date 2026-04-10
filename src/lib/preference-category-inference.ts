import { z } from "zod";
import {
  formatQuizAnswersForPrompt,
  PREFERENCE_QUIZ_QUESTION_IDS,
  WORKER_CATEGORY_LABELS,
  type WorkerCategoryLabel,
} from "@/lib/worker-preference-quiz-data";

const DEFAULT_HOST = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "llama3.2";

const topCategoriesResponseSchema = z.object({
  topCategories: z.array(z.string()).min(3).max(3),
});

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

/** Deterministic top-3 from slider scores when LLM is off or invalid. */
export function computeFallbackTopCategories(
  answers: Record<string, number>
): [WorkerCategoryLabel, WorkerCategoryLabel, WorkerCategoryLabel] {
  const v = (id: string) => answers[id] ?? 5;
  const s = [0, 0, 0, 0, 0, 0, 0, 0];

  s[0] += v("pref-q1");
  s[1] += v("pref-q2");
  s[5] += v("pref-q3");
  {
    const x = v("pref-q4");
    s[2] += 11 - x;
    s[5] += x;
  }
  s[3] += v("pref-q5");
  {
    const x = v("pref-q6");
    s[3] += x * 0.45;
    s[5] += x * 0.55;
  }
  s[6] += v("pref-q7");
  s[7] += v("pref-q8");
  {
    const x = v("pref-q9");
    s[2] += 11 - x;
    s[1] += x;
  }
  s[4] += v("pref-q10");
  {
    const x = v("pref-q11");
    s[5] += x * 0.45;
    s[7] += x * 0.3;
    s[4] += x * 0.25;
  }
  s[6] += v("pref-q12");
  {
    const x = v("pref-q13");
    s[7] += 11 - x;
    s[5] += x;
  }
  s[5] += v("pref-q14");
  s[5] += v("pref-q15");
  {
    const x = v("pref-q16");
    s[5] += x * 0.55;
    s[6] += x * 0.45;
  }
  {
    const x = v("pref-q17");
    s[5] += x * 0.55;
    s[4] += x * 0.45;
  }
  {
    const x = v("pref-q18");
    s[3] += x * 0.5;
    s[7] += x * 0.5;
  }
  {
    const x = v("pref-q19");
    s[2] += x * 0.45;
    s[6] += x * 0.55;
  }
  {
    const x = v("pref-q20");
    s[7] += x * 0.4;
    s[2] += x * 0.3;
    s[4] += x * 0.3;
  }

  const ranked = WORKER_CATEGORY_LABELS.map((label, i) => ({
    label,
    score: s[i],
  }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.label);

  const out: WorkerCategoryLabel[] = [];
  for (const label of ranked) {
    if (!out.includes(label)) out.push(label);
    if (out.length === 3) break;
  }
  return [out[0]!, out[1]!, out[2]!];
}

function normalizeCategoryName(raw: string): WorkerCategoryLabel | null {
  const t = raw.trim();
  const allowed = [...WORKER_CATEGORY_LABELS];
  const exact = allowed.find((a) => a === t);
  if (exact) return exact;
  const ti = t.toLowerCase();
  const ci = allowed.find((a) => a.toLowerCase() === ti);
  if (ci) return ci;
  for (const a of allowed) {
    if (ti.length >= 8 && (a.toLowerCase().includes(ti) || ti.includes(a.toLowerCase()))) {
      return a;
    }
  }
  const keywords: [string, WorkerCategoryLabel][] = [
    ["personal care", "Personal Care Support"],
    ["mobility", "Mobility & Physical Assistance"],
    ["physical assistance", "Mobility & Physical Assistance"],
    ["household", "Household & Domestic Support"],
    ["domestic", "Household & Domestic Support"],
    ["medical", "Medical & Health Support"],
    ["health support", "Medical & Health Support"],
    ["transport", "Transport & Errands"],
    ["errands", "Transport & Errands"],
    ["emotional", "Emotional & Companionship Support"],
    ["companionship", "Emotional & Companionship Support"],
    ["skill development", "Skill Development & Independence Training"],
    ["independence", "Skill Development & Independence Training"],
    ["administrative", "Administrative & Care Coordination"],
    ["care coordination", "Administrative & Care Coordination"],
  ];
  for (const [kw, label] of keywords) {
    if (ti.includes(kw)) return label;
  }
  return null;
}

function parseLlmTopCategories(jsonStr: string): [WorkerCategoryLabel, WorkerCategoryLabel, WorkerCategoryLabel] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return null;
  }
  const safe = topCategoriesResponseSchema.safeParse(parsed);
  if (!safe.success) return null;
  const mapped = safe.data.topCategories.map(normalizeCategoryName);
  if (mapped.some((x) => x === null)) return null;
  const labels = mapped as WorkerCategoryLabel[];
  const unique = [...new Set(labels)];
  if (unique.length < 3) return null;
  return [unique[0]!, unique[1]!, unique[2]!];
}

function buildLlmPrompt(answers: Record<string, number>, repairHint?: string): string {
  const list = WORKER_CATEGORY_LABELS.map((c) => `- "${c}"`).join("\n");
  const body = formatQuizAnswersForPrompt(answers);
  const repair = repairHint
    ? `\n\nIMPORTANT: Your previous output was invalid. ${repairHint}\n`
    : "";
  return `You match support workers to job categories using ONLY these exact category names (copy spelling and "&" characters exactly):

${list}

The worker answered each question on a scale of 1 (low / left label) to 10 (high / right label).

${body}
${repair}

Return ONLY valid JSON with this exact shape (no markdown, no commentary):
{"topCategories":["<first best>","<second best>","<third best>"]}

Rules:
- topCategories must contain exactly 3 strings.
- Each string must be copied EXACTLY from the list above (character-for-character).
- Order from strongest fit to third-strongest fit.
- Use three DIFFERENT category names.`;
}

async function callOllamaJson(prompt: string): Promise<string> {
  const host = process.env.OLLAMA_HOST ?? DEFAULT_HOST;
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;
  const res = await fetch(`${host.replace(/\/$/, "")}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      format: "json",
      stream: false,
      options: { temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    throw new Error(`Ollama HTTP ${res.status}`);
  }
  const data = (await res.json()) as { response?: string };
  return data.response ?? "";
}

/**
 * Returns validated top 3 categories. Uses Ollama when enabled; always validates shape;
 * falls back to deterministic scoring if the model is off or output is invalid after retry.
 */
export async function inferTopThreeCategories(
  answers: Record<string, number>
): Promise<{
  topCategories: [WorkerCategoryLabel, WorkerCategoryLabel, WorkerCategoryLabel];
  source: "llm" | "fallback";
}> {
  const ollamaOff = process.env.OLLAMA_ENABLED === "false";

  if (ollamaOff) {
    return {
      topCategories: computeFallbackTopCategories(answers),
      source: "fallback",
    };
  }

  let repairHint: string | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const prompt = buildLlmPrompt(answers, repairHint);
      const raw = await callOllamaJson(prompt);
      const jsonStr = extractJsonObject(raw);
      if (!jsonStr) {
        repairHint =
          "Output must be a single JSON object with key topCategories (array of 3 exact strings from the list).";
        continue;
      }
      const triple = parseLlmTopCategories(jsonStr);
      if (triple) {
        return { topCategories: triple, source: "llm" };
      }
      repairHint =
        "Each of topCategories[0], topCategories[1], topCategories[2] must be one of the eight strings listed above, spelled identically, and all three must differ.";
    } catch (e) {
      console.warn("[preference-quiz] LLM attempt failed", e);
      repairHint = "Respond with only valid JSON: {\"topCategories\":[\"...\",\"...\",\"...\"]} using exact category strings from the list.";
    }
  }

  return {
    topCategories: computeFallbackTopCategories(answers),
    source: "fallback",
  };
}

export function validateAllAnswersPresent(
  answers: Record<string, number>
): { ok: true } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  for (const id of PREFERENCE_QUIZ_QUESTION_IDS) {
    const v = answers[id];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 10) {
      missing.push(id);
    }
  }
  if (missing.length) return { ok: false, missing };
  return { ok: true };
}
