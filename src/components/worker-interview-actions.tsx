"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function WorkerInterviewActions({
  items,
}: {
  items: {
    id: string;
    jobId: string;
    jobTitle: string;
    interviewAt: string;
  }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function respond(
    applicationId: string,
    action: "accept" | "request_change"
  ) {
    setBusy(applicationId);
    try {
      const res = await fetch(
        `/api/applications/${applicationId}/interview-worker`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-violet-200 bg-violet-50/60 p-6 dark:border-violet-900 dark:bg-violet-950/30">
      <h2 className="text-lg font-medium text-violet-900 dark:text-violet-100">
        Interview proposals
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        The client proposed a time. Accept it or ask them to suggest another slot.
      </p>
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-violet-200 bg-white p-4 dark:border-violet-800 dark:bg-zinc-900"
          >
            <Link
              href={`/jobs/${item.jobId}`}
              className="font-medium text-violet-900 hover:underline dark:text-violet-200"
            >
              {item.jobTitle}
            </Link>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
              Proposed time:{" "}
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {new Date(item.interviewAt).toLocaleString()}
              </span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === item.id}
                onClick={() => void respond(item.id, "accept")}
                className="cursor-pointer rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy === item.id ? "…" : "Accept interview date"}
              </button>
              <button
                type="button"
                disabled={busy === item.id}
                onClick={() => void respond(item.id, "request_change")}
                className="cursor-pointer rounded-full border border-amber-600 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-50"
              >
                Request other date
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
