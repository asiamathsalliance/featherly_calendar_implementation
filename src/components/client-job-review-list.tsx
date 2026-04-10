"use client";

import { useState } from "react";
import { ProviderApplications } from "@/app/dashboard/provider/provider-applications";

export type ClientJobRow = {
  id: string;
  title: string;
  startAt: string;
  pricePerHourAud: number;
  applicantCount: number;
};

export function ClientJobReviewList({ jobs }: { jobs: ClientJobRow[] }) {
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const visibleJobs = showAll ? jobs : jobs.slice(0, 5);

  return (
    <div className="relative">
      <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
      {visibleJobs.length === 0 && (
        <li className="py-3 text-sm text-zinc-500">No jobs posted yet.</li>
      )}
      {visibleJobs.map((j) => {
        const isOpen = openJobId === j.id;
        return (
          <li key={j.id} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{j.title}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(j.startAt).toLocaleString()} · ${j.pricePerHourAud}
                  /hr · {j.applicantCount} applicant(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenJobId(isOpen ? null : j.id)}
                className="cursor-pointer text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
              >
                {isOpen ? "Hide" : "Review"}
              </button>
            </div>
            {isOpen && (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/40">
                <ProviderApplications jobId={j.id} />
              </div>
            )}
          </li>
        );
      })}
      </ul>
      {!showAll && jobs.length > 5 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-10 h-7 bg-gradient-to-t from-white to-transparent dark:from-zinc-900" />
      )}
      {jobs.length > 5 && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="mt-3 cursor-pointer text-sm font-medium text-teal-700 underline hover:text-teal-900 dark:text-teal-400"
        >
          {showAll ? "Show less jobs listed" : "View more jobs listed"}
        </button>
      )}
    </div>
  );
}
