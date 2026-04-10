"use client";

import { useCallback, useEffect, useState } from "react";

type QuizQuestion = { id: string; text: string; type?: string };

type AppRow = {
  id: string;
  status: string;
  interviewAt: string | null;
  interviewProposalStatus: string | null;
  applicantName: string | null;
  applicantGender: string | null;
  applicantAge: number | null;
  applicantRegion: string | null;
  rejectionReason: string | null;
  worker: {
    name: string | null;
    email: string | null;
    image: string | null;
    bio: string | null;
    funFact: string | null;
  };
  quiz: {
    questions: unknown;
    answers: unknown;
    elaborations?: unknown;
  } | null;
};

function formatAnswer(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (typeof value === "number") return String(value);
  if (value === undefined || value === null) return "—";
  return String(value);
}

function canUseDecisionButtons(status: string) {
  return status === "PENDING" || status === "DRAFT";
}

function effectiveProposalStatus(a: AppRow): string {
  const p = a.interviewProposalStatus ?? "NONE";
  if (p !== "NONE") return p;
  if (a.status === "INTERVIEW" && a.interviewAt) return "AWAITING_WORKER";
  return "NONE";
}

function showSchedulingPanel(a: AppRow, sid: string | null) {
  if (sid !== a.id) return false;
  if (canUseDecisionButtons(a.status)) return true;
  if (
    a.status === "INTERVIEW" &&
    effectiveProposalStatus(a) === "WORKER_REQUESTED_CHANGE"
  )
    return true;
  return false;
}

export function ProviderApplications({ jobId }: { jobId: string }) {
  const [rows, setRows] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewApp, setReviewApp] = useState<AppRow | null>(null);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [interviewSlot, setInterviewSlot] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/applications?jobId=${encodeURIComponent(jobId)}`);
    if (!res.ok) {
      setError("Could not load applicants");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setRows(data.applications ?? []);
    setLoading(false);
    setError(null);
  }, [jobId]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (!schedulingId) return;
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setInterviewSlot(d.toISOString().slice(0, 16));
  }, [schedulingId]);

  useEffect(() => {
    if (!reviewApp) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReviewApp(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [reviewApp]);

  async function decide(
    id: string,
    status: "ACCEPTED" | "REJECTED" | "INTERVIEW",
    interviewAtIso?: string
  ) {
    const body: { status: string; interviewAt?: string } = { status };
    if (status === "INTERVIEW" && interviewAtIso) {
      body.interviewAt = interviewAtIso;
    }
    const res = await fetch(`/api/applications/${id}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    setSchedulingId(null);
    void load();
    setReviewApp((cur) => (cur?.id === id ? null : cur));
  }

  async function sendInterviewRequest(id: string) {
    const iso = new Date(interviewSlot).toISOString();
    if (Number.isNaN(new Date(interviewSlot).getTime())) return;
    await decide(id, "INTERVIEW", iso);
  }

  function openScheduleFromModal(app: AppRow) {
    setReviewApp(null);
    setSchedulingId(app.id);
  }

  if (loading) {
    return <p className="mt-4 text-sm text-zinc-500">Loading…</p>;
  }
  if (error) {
    return <p className="mt-4 text-sm text-red-600">{error}</p>;
  }

  return (
    <>
      <ul className="mt-4 space-y-4">
        {rows.length === 0 && (
          <li className="text-sm text-zinc-500">No applicants yet.</li>
        )}
        {rows.map((a) => (
          <li
            key={a.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-stretch justify-between gap-4">
              <div className="flex min-w-0 flex-1 gap-4">
                {a.worker.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.worker.image}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm dark:bg-zinc-800">
                    ?
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{a.worker.name}</p>
                  <p className="text-xs text-zinc-500">{a.worker.email}</p>
                  <p className="mt-2 text-xs text-zinc-500">Status: {a.status}</p>

                  {showSchedulingPanel(a, schedulingId) && (
                    <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/80 p-4 dark:border-violet-900 dark:bg-violet-950/30">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {effectiveProposalStatus(a) === "WORKER_REQUESTED_CHANGE"
                          ? "Propose a new interview time"
                          : "Pick an interview time"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Choose a slot, then post the interview request to the worker.
                      </p>
                      <input
                        type="datetime-local"
                        value={interviewSlot}
                        onChange={(e) => setInterviewSlot(e.target.value)}
                        className="mt-3 w-full max-w-xs rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void sendInterviewRequest(a.id)}
                          className="cursor-pointer rounded-full bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
                        >
                          Send interview request
                        </button>
                        <button
                          type="button"
                          onClick={() => setSchedulingId(null)}
                          className="cursor-pointer rounded-full border border-zinc-300 px-4 py-1.5 text-xs dark:border-zinc-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {(canUseDecisionButtons(a.status) ||
                    (a.status === "INTERVIEW" &&
                      effectiveProposalStatus(a) === "WORKER_REQUESTED_CHANGE")) &&
                    schedulingId !== a.id && (
                    <div className="mt-3 flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto pb-0.5">
                      <button
                        type="button"
                        onClick={() => setReviewApp(a)}
                        className="shrink-0 cursor-pointer rounded-full bg-gradient-to-r from-teal-600 to-violet-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:opacity-95"
                      >
                        Review
                      </button>
                      {canUseDecisionButtons(a.status) && (
                        <>
                          <button
                            type="button"
                            onClick={() => void decide(a.id, "ACCEPTED")}
                            className="shrink-0 cursor-pointer rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => void decide(a.id, "REJECTED")}
                            className="shrink-0 cursor-pointer rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => setSchedulingId(a.id)}
                            className="shrink-0 cursor-pointer rounded-full border-2 border-amber-500 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/40"
                          >
                            Request interview
                          </button>
                        </>
                      )}
                      {a.status === "INTERVIEW" &&
                        effectiveProposalStatus(a) === "WORKER_REQUESTED_CHANGE" && (
                          <button
                            type="button"
                            onClick={() => setSchedulingId(a.id)}
                            className="shrink-0 cursor-pointer rounded-full border-2 border-violet-500 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-900 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-100"
                          >
                            Propose time
                          </button>
                        )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex min-w-[9rem] shrink-0 flex-col items-end gap-2 text-right">
                {a.status === "ACCEPTED" && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100">
                    Awaiting response
                  </div>
                )}
                {a.status === "INTERVIEW" &&
                  effectiveProposalStatus(a) === "AWAITING_WORKER" &&
                  a.interviewAt && (
                    <div className="max-w-[14rem] rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-100">
                      <p className="font-medium">Sent to worker</p>
                      <p className="mt-1 text-zinc-600 dark:text-zinc-300">
                        Awaiting their reply
                      </p>
                      <p className="mt-2 font-medium text-zinc-800 dark:text-zinc-100">
                        {new Date(a.interviewAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                {a.status === "INTERVIEW" &&
                  effectiveProposalStatus(a) === "WORKER_ACCEPTED" &&
                  a.interviewAt && (
                    <div className="max-w-[14rem] rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
                      <p className="font-medium">Interview confirmed</p>
                      <p className="mt-2 font-medium text-zinc-800 dark:text-zinc-100">
                        {new Date(a.interviewAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                {a.status === "INTERVIEW" &&
                  effectiveProposalStatus(a) === "WORKER_REQUESTED_CHANGE" && (
                    <div className="max-w-[14rem] rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
                      Worker asked for another time — post a new slot using the
                      button on the left.
                    </div>
                  )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {reviewApp && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-zinc-900/50 backdrop-blur-[2px]"
            aria-label="Close"
            onClick={() => setReviewApp(null)}
          />
          <div
            className="relative max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/40 bg-gradient-to-br from-teal-50 via-white to-violet-100 p-6 shadow-2xl dark:from-teal-950/80 dark:via-zinc-900 dark:to-violet-950/80 dark:border-zinc-700"
          >
            <div className="flex items-start justify-between gap-3">
              <h3
                id="review-modal-title"
                className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
              >
                Application details
              </h3>
              <button
                type="button"
                onClick={() => setReviewApp(null)}
                className="cursor-pointer rounded-full p-1 text-zinc-500 hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <section className="mt-5 space-y-3">
              <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                General information
              </h4>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-zinc-500">Name</dt>
                  <dd className="mt-1 rounded-lg border border-zinc-200/80 bg-white/80 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950/50">
                    {reviewApp.applicantName ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Gender</dt>
                  <dd className="mt-1 rounded-lg border border-zinc-200/80 bg-white/80 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950/50">
                    {reviewApp.applicantGender ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Age</dt>
                  <dd className="mt-1 rounded-lg border border-zinc-200/80 bg-white/80 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950/50">
                    {reviewApp.applicantAge != null ? String(reviewApp.applicantAge) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Region</dt>
                  <dd className="mt-1 rounded-lg border border-zinc-200/80 bg-white/80 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950/50">
                    {reviewApp.applicantRegion ?? "—"}
                  </dd>
                </div>
                {reviewApp.rejectionReason && (
                  <div>
                    <dt className="text-zinc-500">Screening note</dt>
                    <dd className="mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                      {reviewApp.rejectionReason}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {reviewApp.quiz?.questions != null &&
              Array.isArray(reviewApp.quiz.questions) && (
                <section className="mt-8 space-y-6">
                  <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Screening responses
                  </h4>
                  {(reviewApp.quiz.questions as QuizQuestion[]).map((q) => {
                    const answers = (reviewApp.quiz!.answers ?? {}) as Record<
                      string,
                      boolean | number | string
                    >;
                    const ansRaw = reviewApp.quiz!.answers as
                      | Record<string, unknown>
                      | null
                      | undefined;
                    const elabor =
                      (reviewApp.quiz?.elaborations as Record<string, string> | null | undefined)?.[
                        q.id
                      ] ??
                      (typeof ansRaw?.[`${q.id}__elab`] === "string"
                        ? (ansRaw[`${q.id}__elab`] as string)
                        : undefined);
                    return (
                      <div key={q.id}>
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                          {q.text}
                        </p>
                        <div className="mt-2 rounded-lg border border-zinc-200/90 bg-white/90 px-3 py-2.5 text-sm text-zinc-800 shadow-inner dark:border-zinc-600 dark:bg-zinc-950/60 dark:text-zinc-100">
                          {formatAnswer(answers[q.id])}
                        </div>
                        {elabor && (
                          <div className="mt-2 rounded-lg border border-teal-200/80 bg-teal-50/90 px-3 py-2.5 text-sm text-zinc-800 dark:border-teal-900 dark:bg-teal-950/40 dark:text-zinc-100">
                            <span className="text-xs font-medium text-teal-800 dark:text-teal-200">
                              Experience (Yes):
                            </span>
                            <p className="mt-1 whitespace-pre-wrap">{elabor}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
              )}

            {(canUseDecisionButtons(reviewApp.status) ||
              effectiveProposalStatus(reviewApp) === "WORKER_REQUESTED_CHANGE") && (
              <div className="mt-8 flex max-w-full flex-nowrap items-center gap-2 overflow-x-auto border-t border-zinc-200/60 pt-4 dark:border-zinc-700">
                {canUseDecisionButtons(reviewApp.status) && (
                  <>
                    <button
                      type="button"
                      onClick={() => void decide(reviewApp.id, "ACCEPTED")}
                      className="shrink-0 cursor-pointer rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => void decide(reviewApp.id, "REJECTED")}
                      className="shrink-0 cursor-pointer rounded-full bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => openScheduleFromModal(reviewApp)}
                      className="shrink-0 cursor-pointer rounded-full border-2 border-amber-500 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-100"
                    >
                      Request interview
                    </button>
                  </>
                )}
                {effectiveProposalStatus(reviewApp) === "WORKER_REQUESTED_CHANGE" && (
                  <button
                    type="button"
                    onClick={() => openScheduleFromModal(reviewApp)}
                    className="shrink-0 cursor-pointer rounded-full border-2 border-violet-500 bg-violet-50 px-4 py-2 text-xs font-medium text-violet-900 hover:bg-violet-100 dark:bg-violet-950/50 dark:text-violet-100"
                  >
                    Propose time
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
