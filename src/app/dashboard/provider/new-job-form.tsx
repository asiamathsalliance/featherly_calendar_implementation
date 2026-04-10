"use client";

import { AuLocationAutocomplete } from "@/components/au-location-autocomplete";
import { JOB_TAG_OPTIONS } from "@/lib/job-tags";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const MIN_POST_LOADING_MS = 3000;

function toLocalDateTimeInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

export function NewJobForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [jobRegion, setJobRegion] = useState("");

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!jobRegion.trim()) {
      setError("Choose the job location from the Australian place suggestions.");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);

    const startAt = String(fd.get("startAt") ?? "");
    const endAt = String(fd.get("endAt") ?? "");

    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
      setError("Please enter valid start and end times.");
      return;
    }
    const normalizedEndAt =
      endMs <= startMs
        ? toLocalDateTimeInputValue(new Date(startMs + 60 * 60 * 1000))
        : endAt;
    const startAtIso = new Date(startAt).toISOString();
    const endAtIso = new Date(normalizedEndAt).toISOString();

    const pricePerHourAud = Number(fd.get("pricePerHourAud"));
    if (
      !Number.isFinite(pricePerHourAud) ||
      !Number.isInteger(pricePerHourAud) ||
      pricePerHourAud < 18 ||
      pricePerHourAud > 250
    ) {
      setError("Enter a whole-dollar price per hour between $18 and $250 AUD.");
      return;
    }

    setLoading(true);
    const startedAt = Date.now();
    let postedOk = false;

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(fd.get("title") ?? ""),
          startAt: startAtIso,
          endAt: endAtIso,
          tags,
          region: jobRegion.trim(),
          clientName: String(fd.get("clientName") ?? ""),
          personality: String(fd.get("personality") ?? "") || undefined,
          reqAgeMin: fd.get("reqAgeMin")
            ? Number(fd.get("reqAgeMin"))
            : undefined,
          reqAgeMax: fd.get("reqAgeMax")
            ? Number(fd.get("reqAgeMax"))
            : undefined,
          reqGender: String(fd.get("reqGender") ?? "") || undefined,
          reqPhysicalAbility:
            String(fd.get("reqPhysicalAbility") ?? "") || undefined,
          description: String(fd.get("description") ?? ""),
          pricePerHourAud,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          typeof data.error === "string"
            ? data.error
            : "Could not create job"
        );
        return;
      }
      form.reset();
      setTags([]);
      setJobRegion("");
      postedOk = true;
      router.refresh();
    } catch {
      setError("Could not create job. Check your connection and try again.");
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_POST_LOADING_MS) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_POST_LOADING_MS - elapsed)
        );
      }
      setLoading(false);
      if (postedOk) {
        setShowForm(false);
        setPosted(true);
      }
    }
  }

  return (
    <>
      {!showForm && !posted && !loading ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <span aria-hidden>+</span>
          <span>Post new job</span>
        </button>
      ) : null}

      {(showForm || posted) && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-zinc-900/55 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => {
            if (loading) return;
            setShowForm(false);
            setPosted(false);
            setError(null);
            setJobRegion("");
          }}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            role="dialog"
            aria-modal="true"
            aria-label={
              loading
                ? "Posting job"
                : posted
                  ? "Job listing posted"
                  : "Post a new job"
            }
            onClick={(e) => e.stopPropagation()}
          >
            {loading ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-10 text-center">
                <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-teal-200 border-t-teal-600 dark:border-teal-900 dark:border-t-teal-400" />
                <p className="mt-6 text-[17px] font-semibold text-zinc-900 dark:text-zinc-100">
                  Posting your job to the calendar…
                </p>
              </div>
            ) : posted ? (
              <div className="flex min-h-[320px] flex-col">
                <div className="border-b border-zinc-200 px-6 pb-4 pt-6 dark:border-zinc-700">
                  <h3 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Job listing posted
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Your shift is live and visible on the calendar.
                  </p>
                </div>
                <div className="px-6 pb-6 pt-5">
                  <div className="rounded-xl border border-teal-200/90 bg-teal-50/70 px-4 py-4 dark:border-teal-800/80 dark:bg-teal-950/35">
                    <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                      Workers can open the listing from the calendar or job pages to apply.
                    </p>
                    <nav className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
                      <Link
                        href="/dashboard/client"
                        className="cursor-pointer font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-400"
                      >
                        Client dashboard
                      </Link>
                      <Link
                        href="/calendar"
                        className="cursor-pointer font-medium text-teal-700 underline-offset-2 hover:underline dark:text-teal-400"
                      >
                        View calendar
                      </Link>
                      <Link
                        href="/"
                        className="cursor-pointer font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
                      >
                        Home
                      </Link>
                    </nav>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPosted(false);
                        setShowForm(true);
                      }}
                      className="cursor-pointer rounded-full bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                    >
                      Post another listing
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPosted(false);
                        setShowForm(false);
                      }}
                      className="cursor-pointer rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                className="grid max-h-[80vh] gap-5 overflow-y-auto p-6"
              >
                <h3 className="text-xl font-semibold">Post a new job</h3>
                <label className="text-sm">
                  <span className="font-bold">Title</span>
                  <input
                    name="title"
                    required
                    placeholder="e.g. Community support shift"
                    className="mt-2 w-full rounded border border-zinc-300 px-3 py-2 placeholder:font-normal dark:border-zinc-600 dark:bg-zinc-950"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="font-bold">Start</span>
                    <input
                      name="startAt"
                      type="datetime-local"
                      required
                      className="mt-2 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="font-bold">End</span>
                    <input
                      name="endAt"
                      type="datetime-local"
                      required
                      className="mt-2 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-bold">Tags</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {JOB_TAG_OPTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        className={`max-w-full cursor-pointer rounded-2xl border px-3 py-2 text-left text-[11px] font-medium leading-snug sm:text-xs ${
                          tags.includes(t)
                            ? "border-teal-600 bg-teal-50 text-teal-950 dark:bg-teal-950 dark:text-teal-100"
                            : "border-zinc-300 dark:border-zinc-600"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="font-bold">Location (Australia)</span>
                  <AuLocationAutocomplete
                    value={jobRegion}
                    onChange={setJobRegion}
                    required
                  />
                </div>
                <label className="text-sm">
                  <span className="font-bold">Price per hour (AUD)</span>
                  <input
                    name="pricePerHourAud"
                    type="number"
                    required
                    min={18}
                    max={250}
                    step={1}
                    placeholder="e.g. 45"
                    className="mt-2 w-full rounded border border-zinc-300 px-3 py-2 placeholder:font-normal dark:border-zinc-600 dark:bg-zinc-950"
                  />
                  <span className="mt-1 block text-xs text-zinc-500">
                    Whole dollars per hour (gross rate shown to workers).
                  </span>
                </label>
                <label className="text-sm">
                  <span className="font-bold">Client name</span>
                  <input
                    name="clientName"
                    required
                    placeholder="e.g. Alex M."
                    className="mt-2 w-full rounded border border-zinc-300 px-3 py-2 placeholder:font-normal dark:border-zinc-600 dark:bg-zinc-950"
                  />
                </label>
                <label className="text-sm">
                  <span className="font-bold">Personality</span>
                  <textarea
                    name="personality"
                    rows={2}
                    placeholder="Short personality notes"
                    className="mt-2 w-full rounded border border-zinc-300 px-3 py-2 placeholder:font-normal dark:border-zinc-600 dark:bg-zinc-950"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="font-bold">Min age</span>
                    <input
                      name="reqAgeMin"
                      type="number"
                      min={0}
                      className="mt-2 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="font-bold">Max age</span>
                    <input
                      name="reqAgeMax"
                      type="number"
                      min={0}
                      className="mt-2 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                    />
                  </label>
                </div>
                <label className="text-sm">
                  <span className="font-bold">Gender preference</span>
                  <select
                    name="reqGender"
                    defaultValue=""
                    className="mt-2 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
                  >
                    <option value="">No preference</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="both">Both</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="font-bold">Preference notes</span>
                  <textarea
                    name="reqPhysicalAbility"
                    rows={2}
                    placeholder="Any special requirements"
                    className="mt-2 w-full rounded border border-zinc-300 px-3 py-2 placeholder:font-normal dark:border-zinc-600 dark:bg-zinc-950"
                  />
                </label>
                <label className="text-sm">
                  <span className="font-bold">Role description</span>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    placeholder="Describe tasks, expectations, and context"
                    className="mt-2 w-full rounded border border-zinc-300 px-3 py-2 placeholder:font-normal dark:border-zinc-600 dark:bg-zinc-950"
                  />
                </label>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="cursor-pointer rounded-full bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700"
                  >
                    Post job
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setError(null);
                      setJobRegion("");
                    }}
                    className="cursor-pointer rounded-full border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
