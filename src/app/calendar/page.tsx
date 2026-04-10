import { JobCalendar } from "@/components/job-calendar";

export default function CalendarPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Job calendar</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Filter by tags, then click an event for full details and to apply.
        </p>
      </div>
      <JobCalendar initialTags={[]} />
    </main>
  );
}
