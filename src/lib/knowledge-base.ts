/**
 * Static knowledge snippets for quiz generation (MVP RAG substitute).
 */
export const FEATHERLY_KB = `
Featherly connects verified support workers with clients who need assistance.
Safety: workers must honestly disclose limitations; mobility and hearing support require appropriate competence.
Physical support outdoors may involve uneven terrain and transfers; hearing support may involve assistive devices or quiet environments.
Always respect client preferences for gender of worker when stated.
`.trim();

export const FALLBACK_QUIZ_QUESTIONS = [
  {
    id: "q1",
    text: "The client has motor limitations in their arms. Are you willing and able to assist with hands-on daily tasks such as cooking or cleaning?",
    type: "yes_no" as const,
  },
  {
    id: "q2",
    text: "The client needs mobility support for stairs. Are you willing and able to assist safely when walking upstairs?",
    type: "yes_no" as const,
  },
  {
    id: "q3",
    text: "The client needs someone who can support road crossing safely. How confident are you in guiding an elderly person through traffic?",
    type: "likert" as const,
    scale: 5,
  },
  {
    id: "q4",
    text: "The client needs someone who can listen to difficult mental health concerns. Are you willing to provide calm and non-judgmental support?",
    type: "yes_no" as const,
  },
  {
    id: "q5",
    text: "The client needs someone who can adapt to neurodivergent communication styles. Are you willing to follow structured routines and sensory preferences?",
    type: "yes_no" as const,
  },
  {
    id: "q6",
    text: "The client needs someone who can follow safety escalation protocols. Are you willing to alert the provider immediately if you cannot safely meet a requirement?",
    type: "yes_no" as const,
  },
  {
    id: "q7",
    text: "The client needs someone who can match the required cultural background when applicable. If the listing asks for region/cultural fit, are you comfortable confirming that information?",
    type: "yes_no" as const,
  },
  {
    id: "q8",
    text: "Describe any experience supporting autistic people (optional).",
    type: "open_text" as const,
    optional: true,
  },
];
