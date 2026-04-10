import { FALLBACK_QUIZ_QUESTIONS } from "@/lib/knowledge-base";
import { quizPayloadSchema, type QuizPayload } from "@/lib/quiz-schema";

const DEFAULT_HOST = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "llama3.2";

function templateQuiz(): QuizPayload {
  return {
    questions: FALLBACK_QUIZ_QUESTIONS.map((q, i) => ({
      ...q,
      id: q.id || `fb-${i}`,
      scale: q.type === "likert" ? (q.scale ?? 5) : undefined,
    })),
  };
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function normalizeModelPayload(input: unknown): QuizPayload | null {
  if (!input || typeof input !== "object") return null;
  const root = input as { questions?: unknown };
  if (!Array.isArray(root.questions)) return null;

  const normalized = root.questions.slice(0, 12).map((item, idx) => {
    const q = (item ?? {}) as {
      id?: unknown;
      text?: unknown;
      type?: unknown;
      scale?: unknown;
      optional?: unknown;
    };
    const type =
      q.type === "yes_no" ||
      q.type === "likert" ||
      q.type === "open_text" ||
      q.type === "multiple_choice"
        ? q.type
        : "yes_no";

    let text =
      typeof q.text === "string" ? q.text.trim() : "";
    if (!text && type === "open_text") {
      text = "Please share relevant experience for this role (optional).";
    }
    if (!text) {
      text = "The client needs someone who can follow listed requirements. Are you willing and able to perform this task?";
    }

    const base = {
      id: typeof q.id === "string" && q.id.trim() ? q.id : `q${idx + 1}`,
      text,
      type,
      optional: Boolean(q.optional),
    };
    if (type === "likert") {
      const scale =
        typeof q.scale === "number" && Number.isFinite(q.scale)
          ? Math.min(7, Math.max(3, Math.round(q.scale)))
          : 5;
      return { ...base, scale };
    }
    if (type === "multiple_choice") {
      const rawOptions = Array.isArray((q as { options?: unknown }).options)
        ? ((q as { options?: unknown }).options as unknown[])
        : [];
      const options = rawOptions
        .map((x) => (typeof x === "string" ? x.trim() : ""))
        .filter(Boolean)
        .slice(0, 8);
      return {
        ...base,
        options: options.length >= 2 ? options : ["Car", "Public Transport", "Other"],
      };
    }
    return base;
  });

  const parsed = quizPayloadSchema.safeParse({ questions: normalized });
  if (!parsed.success) return null;
  return parsed.data;
}

export async function generateQuizJson(prompt: string): Promise<QuizPayload> {
  if (process.env.OLLAMA_ENABLED === "false") {
    console.warn("[quiz] OLLAMA_ENABLED=false, using template questions.");
    return templateQuiz();
  }

  const host = process.env.OLLAMA_HOST ?? DEFAULT_HOST;
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;

  try {
    const res = await fetch(`${host.replace(/\/$/, "")}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        format: "json",
        stream: false,
        options: { temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      throw new Error(`Ollama HTTP ${res.status}`);
    }

    const data = (await res.json()) as { response?: string };
    const raw = data.response ?? "";
    const jsonStr = extractJsonObject(raw);
    if (!jsonStr) {
      throw new Error("No JSON object in model output");
    }
    const parsed = JSON.parse(jsonStr) as unknown;
    const strict = quizPayloadSchema.safeParse(parsed);
    if (strict.success) {
      return strict.data;
    }
    const normalized = normalizeModelPayload(parsed);
    if (normalized) {
      return normalized;
    }
    return templateQuiz();
  } catch (error) {
    console.warn("[quiz] Falling back to template questions.", error);
    return templateQuiz();
  }
}
