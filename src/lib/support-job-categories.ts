/**
 * Canonical job / calendar filter tags and worker preference quiz categories.
 * Keep spelling identical everywhere (DB tags, LLM prompts, UI).
 */
export const SUPPORT_JOB_CATEGORY_TAGS = [
  "Personal Care Support",
  "Mobility & Physical Assistance",
  "Household & Domestic Support",
  "Medical & Health Support",
  "Transport & Errands",
  "Emotional & Companionship Support",
  "Skill Development & Independence Training",
  "Administrative & Care Coordination",
] as const;

export type SupportJobCategoryTag = (typeof SUPPORT_JOB_CATEGORY_TAGS)[number];
