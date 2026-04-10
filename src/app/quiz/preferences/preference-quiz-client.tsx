"use client";

import { FloatingLoadingModal } from "@/components/floating-loading-modal";
import {
  PREFERENCE_QUIZ_SECTIONS,
  PREFERENCE_QUIZ_QUESTION_IDS,
} from "@/lib/worker-preference-quiz-data";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

function initialAnswers(): Record<string, number> {
  const o: Record<string, number> = {};
  for (const id of PREFERENCE_QUIZ_QUESTION_IDS) o[id] = 5;
  return o;
}

/** Ten dots on one line — click or drag along the track to set 1–10. */
function PreferenceTenDotSlider({
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const setFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const w = rect.width;
      if (w <= 0) return;
      const n = Math.min(10, Math.max(1, Math.floor((x / w) * 10) + 1));
      onChange(n);
    },
    [onChange]
  );

  return (
    <div className="mt-4">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={value}
        className="relative h-12 w-full cursor-pointer touch-none select-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          setFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (!trackRef.current?.hasPointerCapture(e.pointerId)) return;
          setFromClientX(e.clientX);
        }}
        onPointerUp={(e) => {
          try {
            trackRef.current?.releasePointerCapture(e.pointerId);
          } catch {
            /* already released */
          }
        }}
        onPointerCancel={(e) => {
          try {
            trackRef.current?.releasePointerCapture(e.pointerId);
          } catch {
            /* already released */
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(Math.max(1, value - 1));
          } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(Math.min(10, value + 1));
          }
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-zinc-200 dark:bg-zinc-600" />
        <div className="pointer-events-none grid h-full grid-cols-10 place-items-center">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              className={`h-3.5 w-3.5 rounded-full border-2 ring-2 ring-white transition-transform dark:ring-zinc-950 ${
                value === n
                  ? "scale-110 border-teal-600 bg-teal-600 ring-white dark:ring-zinc-950"
                  : "border-zinc-300 bg-white dark:border-zinc-500 dark:bg-zinc-800"
              }`}
              aria-hidden
            />
          ))}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function QuizBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(45,212,191,0.1),transparent_60%),radial-gradient(ellipse_50%_40%_at_95%_40%,rgba(167,139,250,0.07),transparent_55%),radial-gradient(ellipse_50%_40%_at_5%_42%,rgba(45,212,191,0.06),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(13,148,136,0.14),transparent_60%),radial-gradient(ellipse_50%_40%_at_95%_40%,rgba(99,102,241,0.08),transparent_55%)]" />
      <div className="absolute inset-y-0 left-0 w-[min(28vw,12rem)] bg-gradient-to-r from-white to-transparent dark:from-zinc-950" />
      <div className="absolute inset-y-0 right-0 w-[min(28vw,12rem)] bg-gradient-to-l from-white to-transparent dark:from-zinc-950" />
    </div>
  );
}

export function PreferenceQuizClient() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string[] | null>(null);

  const totalQs = PREFERENCE_QUIZ_QUESTION_IDS.length;
  const answeredDist = useMemo(() => {
    let sum = 0;
    for (const id of PREFERENCE_QUIZ_QUESTION_IDS) {
      const v = answers[id];
      if (v !== 5) sum += 1;
    }
    return sum;
  }, [answers]);

  const progressPct = Math.round((answeredDist / totalQs) * 100);

  const setValue = useCallback((id: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/worker/preference-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const data = (await res.json()) as {
        topCategories?: string[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not save quiz.");
        return;
      }
      if (!data.topCategories || data.topCategories.length !== 3) {
        setError("Unexpected response from server.");
        return;
      }
      setResult(data.topCategories);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="relative min-h-screen bg-white dark:bg-zinc-950">
        <QuizBackground />
        <Link
          href="/dashboard/worker"
          className="absolute left-8 top-8 z-20 text-sm font-medium text-teal-700 underline decoration-teal-700/30 underline-offset-4 transition hover:decoration-teal-700 sm:left-10 sm:top-10 dark:text-teal-400"
        >
          ← Back to dashboard
        </Link>
        <div className="mx-auto max-w-lg px-4 pb-16 pt-20 text-center sm:pt-24">
          <div className="rounded-3xl border border-teal-200/80 bg-white/90 p-10 shadow-xl dark:border-teal-900/50 dark:bg-zinc-900/90">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 text-2xl text-white shadow-lg">
              ✓
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Your top categories
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Based on your answers, here are the three best-fit support areas for
              you right now.
            </p>
            <ol className="mt-8 space-y-3 text-left">
              {result.map((cat, i) => (
                <li
                  key={cat}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3.5 dark:border-zinc-700 dark:bg-zinc-800/50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {cat}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/dashboard/worker"
                className="inline-flex justify-center rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700"
              >
                Back to dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setAnswers(initialAnswers());
                }}
                className="inline-flex justify-center rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Retake quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {loading && (
        <FloatingLoadingModal
          message="Analyzing your preferences…"
          submessage="Matching you to the strongest support categories."
        />
      )}
      <div className="relative min-h-screen bg-white dark:bg-zinc-950">
        <QuizBackground />
        <Link
          href="/dashboard/worker"
          className="absolute left-8 top-8 z-20 text-sm font-medium text-teal-700 underline decoration-teal-700/30 underline-offset-4 transition hover:decoration-teal-700 sm:left-10 sm:top-10 dark:text-teal-400"
        >
          ← Back to dashboard
        </Link>

        <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-20 sm:pt-24">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
              Support worker
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
              Preference & comfort quiz
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-[17px] text-zinc-600 dark:text-zinc-400">
              Tap or drag along the dotted line—there are no wrong answers. We use
              this
              to surface your best-fit categories.
            </p>
          </div>

          <div className="mb-10 flex justify-center">
            <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-[width] duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-12">
            {PREFERENCE_QUIZ_SECTIONS.map((section) => (
              <section
                key={section.id}
                className="rounded-3xl border border-zinc-200/90 bg-white/85 p-6 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] backdrop-blur-sm dark:border-zinc-700/80 dark:bg-zinc-900/75 dark:shadow-black/30 sm:p-8"
              >
                <header className="mb-8 border-b border-zinc-100 pb-6 dark:border-zinc-800">
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {section.blurb}
                  </p>
                </header>
                <div className="space-y-10">
                  {section.questions.map((q) => {
                    const v = answers[q.id] ?? 5;
                    return (
                      <div key={q.id} className="group">
                        <p className="text-[15px] font-medium leading-snug text-zinc-800 dark:text-zinc-200">
                          {q.text}
                        </p>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-6">
                          <div className="min-w-0 flex-1">
                            <PreferenceTenDotSlider
                              value={v}
                              onChange={(n) => setValue(q.id, n)}
                              lowLabel={q.lowLabel}
                              highLabel={q.highLabel}
                            />
                          </div>
                          <div className="flex shrink-0 items-center justify-center rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white px-5 py-3 text-center dark:border-teal-900 dark:from-teal-950/50 dark:to-zinc-900">
                            <span className="text-3xl font-bold tabular-nums text-teal-800 dark:text-teal-300">
                              {v}
                            </span>
                            <span className="ml-1 self-end pb-1 text-sm text-zinc-500">
                              /10
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {error && (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="sticky bottom-4 z-10 flex justify-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-teal-600/25 transition hover:from-teal-700 hover:to-emerald-700 hover:shadow-xl disabled:opacity-60"
              >
                See my top categories
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
