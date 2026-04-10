import type { Job } from "@/generated/prisma";
import { FEATHERLY_KB } from "@/lib/knowledge-base";

export function buildQuizPrompt(job: Job): string {
  const tags = job.tags.join(", ") || "general support";
  const startAt = new Date(job.startAt).toLocaleString();
  const endAt = new Date(job.endAt).toLocaleString();
  return `You are generating a screening quiz for a support worker role. Output ONLY valid JSON, no markdown, no explanation.

JSON shape:
{"questions":[{"id":"q1","text":"...","type":"yes_no"},{"id":"q2","text":"...","type":"likert","scale":5},{"id":"q8","text":"...","type":"open_text","optional":true}]}

Rules:
- Generate exactly 6 questions.
- Include 4 yes/no questions, 1 likert question, and 1 optional open_text question.
- For yes/no questions, use this pattern:
  "The client needs someone who can <task>. Are you willing and able to perform this task?"
- Questions must be concrete and based on the listing details.
- Questions must be tightly tailored to this exact role. Example: if the listing requires heavy lifting, include direct checks like ability to lift heavy weights safely.
- Questions must be specific to this job and tags; safety-aware; plain English.
- ids must be unique slugs like q1, q2.
- If listing includes age/gender/cultural requirements, include one direct fit-check question.
- Keep each question one sentence whenever possible.

Featherly context:
${FEATHERLY_KB}

Job title: ${job.title}
Summary: ${job.summary}
Tags: ${tags}
Scheduled time: ${startAt} to ${endAt}
Client requirements — age: ${job.reqAgeMin ?? "?"}-${job.reqAgeMax ?? "?"}, gender preference: ${job.reqGender ?? "any"}, physical ability notes: ${job.reqPhysicalAbility ?? "n/a"}
Role description: ${job.description}
Preferences: ${job.preferences ?? "n/a"}
`.trim();
}
