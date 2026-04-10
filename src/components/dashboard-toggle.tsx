import Link from "next/link";

export function DashboardToggle({ current }: { current: "worker" | "client" }) {
  return (
    <div className="inline-flex rounded-full border border-zinc-300 p-1 dark:border-zinc-700">
      <Link
        href="/dashboard/worker"
        className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
          current === "worker"
            ? "bg-teal-600 text-white"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        }`}
      >
        Support Worker
      </Link>
      <Link
        href="/dashboard/client"
        className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
          current === "client"
            ? "bg-teal-600 text-white"
            : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        }`}
      >
        Client
      </Link>
    </div>
  );
}
