"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { SUPPORT_JOB_CATEGORY_TAGS } from "@/lib/support-job-categories";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type JobEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    tags: string[];
    summary: string;
    clientName: string;
  };
};

const EVENT_PALETTE = [
  { bg: "#0d9488", border: "#0f766e" },
  { bg: "#2563eb", border: "#1d4ed8" },
  { bg: "#c2410c", border: "#9a3412" },
  { bg: "#7c3aed", border: "#6d28d9" },
  { bg: "#db2777", border: "#be185d" },
] as const;
const OVERLAP_GREEN = { bg: "#059669", border: "#047857" };

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
  return Math.abs(h);
}

function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}

function assignEventColors(mapped: JobEvent[]): JobEvent[] {
  const sorted = [...mapped].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  return mapped.map((e) => {
    const startMs = new Date(e.start).getTime();
    const endMs = new Date(e.end).getTime();
    const idx = sorted.findIndex((x) => x.id === e.id);
    let overlapsEarlier = false;
    for (let i = 0; i < idx; i++) {
      const o = sorted[i];
      const os = new Date(o.start).getTime();
      const oe = new Date(o.end).getTime();
      if (intervalsOverlap(startMs, endMs, os, oe)) {
        overlapsEarlier = true;
        break;
      }
    }
    const colors = overlapsEarlier
      ? OVERLAP_GREEN
      : EVENT_PALETTE[hashId(e.id) % EVENT_PALETTE.length];
    return {
      ...e,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: "#ffffff",
    };
  });
}

export function JobCalendar({
  initialTags,
}: {
  initialTags: string[];
}) {
  const router = useRouter();
  const [events, setEvents] = useState<JobEvent[]>([]);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [loading, setLoading] = useState(true);
  /** After first fetch completes, keep FullCalendar mounted so prev/next/view nav is not reset on refetch. */
  const [calendarReady, setCalendarReady] = useState(false);
  const hasCompletedFetchRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleRange, setVisibleRange] = useState<{ from: string; to: string } | null>(null);

  /** Seed jobs are scheduled Apr–May 2026 (weekdays from 6 Apr); keep fetch window aligned. */
  const initialRange = useMemo(() => {
    const start = new Date(2026, 3, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(2026, 5, 15);
    end.setHours(23, 59, 59, 999);
    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  }, []);

  const load = useCallback(async () => {
    setError(null);
    if (!hasCompletedFetchRef.current) {
      setLoading(true);
    }
    const range = visibleRange ?? initialRange;
    const params = new URLSearchParams({
      from: range.from,
      to: range.to,
    });
    if (tags.length) {
      params.set("tags", tags.join(","));
    }
    try {
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) {
        setError("Could not load jobs");
        hasCompletedFetchRef.current = true;
        setCalendarReady(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const mapped: JobEvent[] = (data.jobs as Record<string, unknown>[]).map(
        (j) => {
          const job = j as {
            id: string;
            title: string;
            startAt: string;
            endAt: string;
            tags: string[];
            summary: string;
            clientName: string;
          };
          return {
            id: job.id,
            title: job.title,
            start: job.startAt,
            end: job.endAt,
            extendedProps: {
              tags: job.tags,
              summary: job.summary,
              clientName: job.clientName,
            },
          };
        }
      );
      setEvents(assignEventColors(mapped));
      hasCompletedFetchRef.current = true;
      setCalendarReady(true);
      setLoading(false);
    } catch {
      setError("Could not load jobs");
      hasCompletedFetchRef.current = true;
      setCalendarReady(true);
      setLoading(false);
    }
  }, [visibleRange, initialRange, tags]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  function toggleTag(t: string) {
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {SUPPORT_JOB_CATEGORY_TAGS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggleTag(t)}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-left text-[11px] font-medium leading-snug sm:text-xs ${
              tags.includes(t)
                ? "border-teal-600 bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-100"
                : "border-zinc-300 dark:border-zinc-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="relative fc-theme-standard min-h-[min(88vh,920px)] rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
        {loading && !calendarReady ? (
          <p className="p-4 text-sm text-zinc-500">Loading calendar…</p>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            initialDate="2026-04-06"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            allDaySlot={false}
            slotMinTime="09:00:00"
            slotMaxTime="22:00:00"
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            snapDuration="00:30:00"
            height={820}
            contentHeight="auto"
            dayMaxEvents={4}
            fixedWeekCount={false}
            expandRows
            events={events}
            datesSet={(arg) => {
              const from = arg.start.toISOString();
              const to = arg.end.toISOString();
              setVisibleRange((prev) =>
                prev && prev.from === from && prev.to === to ? prev : { from, to }
              );
            }}
            eventClassNames="cursor-pointer"
            eventClick={(info) => {
              info.jsEvent.preventDefault();
              router.push(`/jobs/${info.event.id}`);
            }}
            eventContent={(arg) => (
              <div className="fc-event-main-frame overflow-hidden px-0.5 py-0.5 text-left text-xs leading-tight">
                <div className="truncate font-medium">{arg.event.title}</div>
                <div className="truncate text-[10px] opacity-80">
                  {String(arg.event.extendedProps.clientName ?? "")}
                </div>
              </div>
            )}
          />
        )}
        {loading && calendarReady && (
          <div
            className="pointer-events-none absolute inset-0 z-[5] flex items-start justify-end rounded-lg bg-white/40 p-2 dark:bg-zinc-900/40"
            aria-hidden
          >
            <span className="rounded-md bg-white/90 px-2 py-1 text-xs text-zinc-600 shadow-sm dark:bg-zinc-800/90 dark:text-zinc-300">
              Updating…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
