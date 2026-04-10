/** Normalize `User.preferenceQuizTopCategories` (Json) to a string list. */
export function parseStoredTopCategories(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}
