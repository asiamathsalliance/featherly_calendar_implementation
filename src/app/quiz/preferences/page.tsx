import { PreferenceQuizClient } from "./preference-quiz-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preference quiz — Featherly",
  description:
    "Rate your comfort and fit across support scenarios to see your top three categories.",
};

export default function PreferenceQuizPage() {
  return <PreferenceQuizClient />;
}
