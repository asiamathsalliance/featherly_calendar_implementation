import {
  SUPPORT_JOB_CATEGORY_TAGS,
  type SupportJobCategoryTag,
} from "@/lib/support-job-categories";

/** Same as job tags / calendar filters — LLM must use exact strings. */
export const WORKER_CATEGORY_LABELS = SUPPORT_JOB_CATEGORY_TAGS;

export type WorkerCategoryLabel = SupportJobCategoryTag;

export type PreferenceQuizQuestion = {
  id: string;
  text: string;
  /** Shown under slider: low end = 1, high end = 10 */
  lowLabel: string;
  highLabel: string;
};

export type PreferenceQuizSection = {
  id: string;
  title: string;
  blurb: string;
  questions: PreferenceQuizQuestion[];
};

export const PREFERENCE_QUIZ_SECTIONS: PreferenceQuizSection[] = [
  {
    id: "core",
    title: "Core preference & comfort",
    blurb: "How you feel about day-to-day support tasks and interaction style.",
    questions: [
      {
        id: "pref-q1",
        text: "How comfortable are you assisting with personal hygiene (bathing, dressing, toileting)?",
        lowLabel: "Not comfortable",
        highLabel: "Very comfortable",
      },
      {
        id: "pref-q2",
        text: "How confident are you helping someone move physically (transfers, wheelchair, mobility aids)?",
        lowLabel: "Not confident",
        highLabel: "Very confident",
      },
      {
        id: "pref-q3",
        text: "How much do you enjoy extended conversation and companionship?",
        lowLabel: "Prefer minimal chat",
        highLabel: "Love long chats",
      },
      {
        id: "pref-q4",
        text: "Do you lean more toward structured hands-on tasks—or toward people-focused interaction?",
        lowLabel: "Structured tasks",
        highLabel: "People-focused",
      },
    ],
  },
  {
    id: "experience",
    title: "Experience & skills",
    blurb: "Background that maps to different types of support.",
    questions: [
      {
        id: "pref-q5",
        text: "How much experience do you have with medical-adjacent support (medication reminders, monitoring symptoms)?",
        lowLabel: "Little or none",
        highLabel: "Very experienced",
      },
      {
        id: "pref-q6",
        text: "How confident are you when someone shows challenging behavior or emotional distress?",
        lowLabel: "Not confident",
        highLabel: "Very confident",
      },
      {
        id: "pref-q7",
        text: "How much experience do you have teaching or mentoring daily-life skills?",
        lowLabel: "Little or none",
        highLabel: "A lot",
      },
      {
        id: "pref-q8",
        text: "How comfortable are you with scheduling, documentation, and care coordination?",
        lowLabel: "Avoid it",
        highLabel: "Very comfortable",
      },
    ],
  },
  {
    id: "workstyle",
    title: "Work style & environment",
    blurb: "Pace, movement, and how you handle change.",
    questions: [
      {
        id: "pref-q9",
        text: "Do you prefer active, on-your-feet work—or calmer, routine household tasks?",
        lowLabel: "Routine household",
        highLabel: "Active / on the go",
      },
      {
        id: "pref-q10",
        text: "How comfortable are you driving clients or traveling often during shifts?",
        lowLabel: "Not comfortable",
        highLabel: "Very comfortable",
      },
      {
        id: "pref-q11",
        text: "How well do you adapt when plans change at the last minute?",
        lowLabel: "Struggle with changes",
        highLabel: "Adapt easily",
      },
      {
        id: "pref-q12",
        text: "How motivated are you to help clients build independence over time?",
        lowLabel: "Low priority",
        highLabel: "Top priority",
      },
    ],
  },
  {
    id: "personality",
    title: "Personality & strengths",
    blurb: "How others experience working with you.",
    questions: [
      {
        id: "pref-q13",
        text: "Would people describe you as more task-focused—or more empathetic?",
        lowLabel: "Task-focused",
        highLabel: "Empathetic",
      },
      {
        id: "pref-q14",
        text: "When someone is anxious or upset, how steady and supportive do you stay?",
        lowLabel: "I get unsettled",
        highLabel: "Very steady",
      },
      {
        id: "pref-q15",
        text: "How much do you value long-term relationships with clients?",
        lowLabel: "Prefer short-term",
        highLabel: "Deep relationships",
      },
    ],
  },
  {
    id: "scenarios",
    title: "Scenario-based",
    blurb: "How you’d respond in typical situations (rate your confidence or fit).",
    questions: [
      {
        id: "pref-q16",
        text: "A client resists a routine. How confident are you responding calmly and constructively?",
        lowLabel: "Not confident",
        highLabel: "Very confident",
      },
      {
        id: "pref-q17",
        text: "A client wants frequent outings and social activity. How energized would you be supporting that?",
        lowLabel: "Draining",
        highLabel: "Energizing",
      },
      {
        id: "pref-q18",
        text: "You suspect a missed medication. How systematic would you be (observe, communicate, escalate appropriately)?",
        lowLabel: "Unsure",
        highLabel: "Very systematic",
      },
      {
        id: "pref-q19",
        text: "A client wants to learn to cook independently. How confident are you coaching step-by-step, safety-first?",
        lowLabel: "Not confident",
        highLabel: "Very confident",
      },
      {
        id: "pref-q20",
        text: "You have cleaning, scheduling, and errands at once. How comfortable are you prioritizing under pressure?",
        lowLabel: "Overwhelmed",
        highLabel: "Very comfortable",
      },
    ],
  },
];

export const PREFERENCE_QUIZ_QUESTION_IDS: string[] =
  PREFERENCE_QUIZ_SECTIONS.flatMap((s) => s.questions.map((q) => q.id));

export function formatQuizAnswersForPrompt(
  answers: Record<string, number>
): string {
  const lines: string[] = [];
  for (const section of PREFERENCE_QUIZ_SECTIONS) {
    lines.push(`### ${section.title}`);
    for (const q of section.questions) {
      const v = answers[q.id];
      lines.push(`- (${q.id}) ${q.text} → **${v}/10**`);
    }
  }
  return lines.join("\n");
}
