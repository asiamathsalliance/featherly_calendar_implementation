"use client";

import type { QuizQuestion } from "@/lib/quiz-schema";
import { AuLocationAutocomplete } from "@/components/au-location-autocomplete";
import { FloatingLoadingModal } from "@/components/floating-loading-modal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const MIN_SUBMIT_MS = 2500;

export function ApplyFlow({
  jobId,
  shiftRangeLabel,
}: {
  jobId: string;
  shiftRangeLabel: string;
}) {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, boolean | number | string>>({});
  const [elaborations, setElaborations] = useState<Record<string, string>>({});
  const [basicInfo, setBasicInfo] = useState({
    applicantName: "",
    applicantGender: "" as "" | "male" | "female",
    applicantAge: 25,
    applicantRegion: "",
  });
  const [availableForShift, setAvailableForShift] = useState<boolean | null>(
    null
  );
  const [phase, setPhase] = useState<"basic" | "quiz" | "rejected">("basic");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved">("idle");

  const bootstrap = useCallback(async () => {
    setQuestions([]);
    setAnswers({});
    setElaborations({});
    setApplicationId(null);
    setPhase("basic");
    setError(null);
  }, []);

  function applyQuestionsFromPayload(
    qs: QuizQuestion[],
    savedAnswers?: Record<string, unknown> | null
  ) {
    setQuestions(qs);
    const init: Record<string, boolean | number | string> = {};
    const elab: Record<string, string> = {};
    for (const q of qs) {
      if (q.type === "yes_no") {
        init[q.id] = false;
        elab[q.id] = "";
      } else if (q.type === "likert") init[q.id] = Math.ceil((q.scale ?? 5) / 2);
      else if (q.type === "multiple_choice") init[q.id] = q.options?.[0] ?? "";
      else init[q.id] = "";
    }
    if (savedAnswers && typeof savedAnswers === "object") {
      for (const q of qs) {
        const v = savedAnswers[q.id];
        if (q.type === "yes_no") {
          init[q.id] = v === true || v === "true";
        } else if (q.type === "likert") {
          const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
          init[q.id] = Number.isFinite(n) ? n : init[q.id];
        } else if (q.type === "multiple_choice") {
          init[q.id] = typeof v === "string" ? v : init[q.id];
        } else {
          init[q.id] = typeof v === "string" ? v : init[q.id];
        }
        const ev = savedAnswers[`${q.id}__elab`];
        if (typeof ev === "string") elab[q.id] = ev;
      }
    }
    setAnswers(init);
    setElaborations(elab);
    setPhase("quiz");
  }

  async function loadQuizFromJobTemplate(appId: string) {
    const res = await fetch("/api/quiz/attach-from-job", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: appId }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(
        typeof d.error === "string"
          ? d.error
          : "Could not load screening questions."
      );
      return false;
    }
    const data = await res.json();
    const saved = (data.quiz?.answers ?? null) as Record<string, unknown> | null;
    applyQuestionsFromPayload(data.questions as QuizQuestion[], saved);
    return true;
  }

  function buildPayload() {
    const elaborationPayload: Record<string, string> = {};
    const cleanAnswers: Record<string, boolean | number | string> = {};
    for (const q of questions) {
      if (q.type === "yes_no") {
        cleanAnswers[q.id] = answers[q.id] === true;
        if (answers[q.id] === true) {
          elaborationPayload[q.id] = (elaborations[q.id] ?? "").trim();
        }
      } else if (q.type === "likert") {
        const v = answers[q.id];
        cleanAnswers[q.id] =
          typeof v === "number" ? v : Number(v) || Math.ceil((q.scale ?? 5) / 2);
      } else {
        cleanAnswers[q.id] = String(answers[q.id] ?? "");
      }
    }
    return { cleanAnswers, elaborationPayload };
  }

  useEffect(() => {
    if (phase !== "quiz" || !applicationId || !questions.length || submitting) return;
    const timer = setTimeout(async () => {
      try {
        setAutosaveState("saving");
        const { cleanAnswers, elaborationPayload } = buildPayload();
        await fetch(`/api/applications/${applicationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: cleanAnswers,
            elaborations: elaborationPayload,
            submit: false,
          }),
        });
        setAutosaveState("saved");
      } catch {
        setAutosaveState("idle");
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [phase, applicationId, questions, answers, elaborations, submitting]);

  useEffect(() => {
    const t = setTimeout(() => {
      void bootstrap();
    }, 0);
    return () => clearTimeout(t);
  }, [bootstrap]);

  async function onBasicContinue(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    if (!basicInfo.applicantRegion.trim()) {
      setError("Choose your location from the Australian place suggestions.");
      setSubmitting(false);
      return;
    }
    if (availableForShift === null) {
      setError("Please answer whether you are available for this shift.");
      setSubmitting(false);
      return;
    }
    const create = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        ...basicInfo,
        availableForShift,
      }),
    });
    setSubmitting(false);
    if (!create.ok) {
      const d = await create.json().catch(() => ({}));
      setError(d.error ?? "Could not start application");
      return;
    }
    const data = await create.json();
    setApplicationId(data.application.id);
    if (data.preScreenRejected) {
      setRejectionReason(data.rejectionReason ?? "Basic requirements mismatch");
      setPhase("rejected");
      return;
    }

    setLoadingQuestions(true);
    const ok = await loadQuizFromJobTemplate(data.application.id);
    setLoadingQuestions(false);
    if (!ok) {
      setPhase("basic");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!applicationId) return;
    setSubmitting(true);
    setSubmitPhase("submitting");
    setError(null);
    const { cleanAnswers, elaborationPayload } = buildPayload();

    const started = Date.now();
    const res = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: cleanAnswers,
        elaborations: elaborationPayload,
        submit: true,
      }),
    });

    if (res.ok) {
      const elapsed = Date.now() - started;
      if (elapsed < MIN_SUBMIT_MS) {
        await new Promise((r) => setTimeout(r, MIN_SUBMIT_MS - elapsed));
      }
    }

    setSubmitting(false);
    if (!res.ok) {
      setSubmitPhase("idle");
      let msg = "Submission failed. Please try again.";
      try {
        const d = (await res.json()) as { error?: unknown; details?: unknown };
        if (typeof d.error === "string") msg = d.error;
        else if (d.details) msg = `Validation: ${JSON.stringify(d.details)}`;
      } catch {
        msg = `Request failed (${res.status}).`;
      }
      setError(msg);
      return;
    }
    setSubmitPhase("done");
    router.refresh();
  }

  if (submitPhase === "done") {
    return (
      <div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50/80 p-8 text-center dark:border-teal-900 dark:bg-teal-950/40">
        <h2 className="text-xl font-semibold text-teal-900 dark:text-teal-100">
          Application submitted
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Your responses were saved. The client will review your application.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <Link
            href="/dashboard/worker"
            className="font-medium text-teal-700 underline hover:text-teal-900 dark:text-teal-400"
          >
            Back to dashboard
          </Link>
          <Link
            href="/calendar"
            className="font-medium text-teal-700 underline hover:text-teal-900 dark:text-teal-400"
          >
            Job calendar
          </Link>
          <Link href="/" className="font-medium text-zinc-600 underline dark:text-zinc-400">
            Home
          </Link>
        </div>
      </div>
    );
  }

  if (loadingQuestions) {
    return (
      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-200 border-t-teal-600 dark:border-teal-900 dark:border-t-teal-400" />
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Loading screening questions...
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Preparing your application questions for this role.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "basic") {
    return (
      <form onSubmit={onBasicContinue} className="mt-8 space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Basic screening</h2>
        <p className="text-sm text-zinc-500">
          Enter your details, then continue to the tailored questions for this role.
        </p>
        <label className="block text-sm">
          <span className="font-medium">Name</span>
          <input
            required
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={basicInfo.applicantName}
            onChange={(e) =>
              setBasicInfo((b) => ({ ...b, applicantName: e.target.value }))
            }
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Gender</span>
            <select
              required
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-normal dark:border-zinc-700 dark:bg-zinc-900"
              value={basicInfo.applicantGender}
              onChange={(e) =>
                setBasicInfo((b) => ({
                  ...b,
                  applicantGender: e.target.value as "male" | "female" | "",
                }))
              }
            >
              <option value="" disabled>
                Select…
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Age</span>
            <input
              required
              type="number"
              min={16}
              max={100}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={basicInfo.applicantAge}
              onChange={(e) =>
                setBasicInfo((b) => ({ ...b, applicantAge: Number(e.target.value) }))
              }
            />
          </label>
        </div>
        <fieldset className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-900/30">
          <legend className="px-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Availability
          </legend>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Are you available to work this shift from{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {shiftRangeLabel}
            </span>
            ?
          </p>
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="shiftAvail"
                checked={availableForShift === true}
                onChange={() => setAvailableForShift(true)}
              />
              Yes
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="shiftAvail"
                checked={availableForShift === false}
                onChange={() => setAvailableForShift(false)}
              />
              No
            </label>
          </div>
        </fieldset>

        <div className="block text-sm">
          <span className="font-medium">Location (Australia)</span>
          <AuLocationAutocomplete
            value={basicInfo.applicantRegion}
            onChange={(displayLine) =>
              setBasicInfo((b) => ({ ...b, applicantRegion: displayLine }))
            }
            required
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="cursor-pointer rounded-full bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Checking…" : "Continue"}
        </button>
      </form>
    );
  }

  if (phase === "rejected") {
    return (
      <div className="mt-8 rounded-xl border-2 border-red-500 bg-red-50 p-5 dark:bg-red-950/30">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
          Rejected at basic screening
        </h2>
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
          {rejectionReason ?? "Your profile does not match required age/gender filters."}
        </p>
      </div>
    );
  }

  if (error && !questions.length) {
    return (
      <div className="mt-8 space-y-3">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => void bootstrap()}
          className="text-sm text-teal-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {submitPhase === "submitting" && (
        <FloatingLoadingModal
          message="Submitting application…"
          submessage="Please wait a moment."
        />
      )}
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <p className="text-xs text-zinc-500">
          {autosaveState === "saving"
            ? "Saving draft..."
            : autosaveState === "saved"
              ? "Draft saved"
              : ""}
        </p>
        {questions.map((q) => (
          <div
            key={q.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="font-medium">{q.text}</p>
            {q.type === "yes_no" && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === true}
                      onChange={() =>
                        setAnswers((a) => ({ ...a, [q.id]: true }))
                      }
                    />
                    Yes
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === false}
                      onChange={() => {
                        setAnswers((a) => ({ ...a, [q.id]: false }));
                        setElaborations((prev) => {
                          const next = { ...prev };
                          delete next[q.id];
                          return next;
                        });
                      }}
                    />
                    No
                  </label>
                </div>
                {answers[q.id] === true && (
                  <label className="block text-sm">
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">
                      If yes, elaborate.
                    </span>
                    <textarea
                      required
                      rows={3}
                      className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm placeholder:font-normal dark:border-zinc-700 dark:bg-zinc-900"
                      placeholder="e.g. two years supporting mobility-impaired clients, meal prep, community outings…"
                      value={elaborations[q.id] ?? ""}
                      onChange={(e) =>
                        setElaborations((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                    />
                  </label>
                )}
              </div>
            )}
            {q.type === "likert" && (
              <div className="mt-3">
                <input
                  type="range"
                  min={1}
                  max={q.scale ?? 5}
                  value={Number(answers[q.id] ?? 1)}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      [q.id]: Number(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <div className="mt-1 text-xs text-zinc-500">
                  Value: {String(answers[q.id] ?? 1)} / {q.scale ?? 5}
                </div>
              </div>
            )}
            {q.type === "open_text" && (
              <textarea
                className="mt-3 w-full rounded border border-zinc-300 px-3 py-2 text-sm placeholder:font-normal dark:border-zinc-700 dark:bg-zinc-900"
                placeholder={q.optional ? "Optional response" : "Your response"}
                value={String(answers[q.id] ?? "")}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                }
              />
            )}
            {q.type === "multiple_choice" && (
              <div className="mt-3 space-y-2">
                {(q.options ?? []).map((opt) => {
                  const selectedValue = String(answers[q.id] ?? "");
                  const isSelected =
                    selectedValue === opt ||
                    (opt === "Other" && selectedValue.startsWith("Other:"));
                  return (
                    <label key={`${q.id}-${opt}`} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={q.id}
                        checked={isSelected}
                        onChange={() =>
                          setAnswers((a) => ({
                            ...a,
                            [q.id]: opt === "Other" ? "Other:" : opt,
                          }))
                        }
                      />
                      {opt}
                    </label>
                  );
                })}
                {String(answers[q.id] ?? "").startsWith("Other:") && (
                  <input
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm placeholder:font-normal dark:border-zinc-700 dark:bg-zinc-900"
                    placeholder="Other:..."
                    value={String(answers[q.id] ?? "").replace(/^Other:\s*/, "")}
                    onChange={(e) =>
                      setAnswers((a) => ({
                        ...a,
                        [q.id]: `Other: ${e.target.value}`,
                      }))
                    }
                  />
                )}
              </div>
            )}
          </div>
        ))}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !applicationId}
          className="cursor-pointer rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </>
  );
}
