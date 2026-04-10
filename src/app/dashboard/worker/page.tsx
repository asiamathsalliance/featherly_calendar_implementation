import { DEMO_WORKER_ID, ensureDemoUsers } from "@/lib/demo-users";
import { prisma } from "@/lib/prisma";
import { getUserPreferenceQuizFields } from "@/lib/worker-preference-quiz-persistence";
import { DashboardToggle } from "@/components/dashboard-toggle";
import { WorkerInterviewActions } from "@/components/worker-interview-actions";
import Link from "next/link";

export default async function WorkerDashboardPage() {
  await ensureDemoUsers();

  const user = await prisma.user.findUnique({
    where: { id: DEMO_WORKER_ID },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      funFact: true,
    },
  });
  if (!user) return null;

  const { preferenceQuizCompletedAt, topCategories } =
    await getUserPreferenceQuizFields(DEMO_WORKER_ID);

  const applications = await prisma.application.findMany({
    where: { workerId: user.id },
    include: { job: true },
    orderBy: { updatedAt: "desc" },
  });
  const pending = applications.filter((a) => a.status === "PENDING");

  function awaitingWorkerInterviewReply(a: (typeof applications)[0]) {
    if (a.status !== "INTERVIEW" || !a.interviewAt) return false;
    const p = a.interviewProposalStatus;
    if (p === "AWAITING_WORKER") return true;
    if (p === "NONE") return true;
    return false;
  }

  const interviewProposalsForWorker = applications
    .filter(awaitingWorkerInterviewReply)
    .map((a) => ({
      id: a.id,
      jobId: a.jobId,
      jobTitle: a.job.title,
      interviewAt: a.interviewAt!.toISOString(),
    }));

  const confirmedInterviews = applications.filter(
    (a) =>
      a.status === "INTERVIEW" &&
      a.interviewProposalStatus === "WORKER_ACCEPTED" &&
      a.interviewAt
  );

  function statusClasses(status: string) {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-950/80 dark:text-amber-100 dark:ring-amber-700";
      case "ACCEPTED":
        return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-100 dark:ring-emerald-700";
      case "REJECTED":
        return "bg-red-100 text-red-900 ring-1 ring-red-300 dark:bg-red-950/80 dark:text-red-100 dark:ring-red-700";
      case "INTERVIEW":
        return "bg-violet-100 text-violet-900 ring-1 ring-violet-300 dark:bg-violet-950/80 dark:text-violet-100 dark:ring-violet-700";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-14">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Support worker dashboard</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Profile, work hours, and application pipeline.
          </p>
        </div>
        <DashboardToggle current="worker" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
        <section className="flex h-full min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium">Profile</h2>
          <div className="mt-5 space-y-4">
            <div className="flex justify-center">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt=""
                  className="h-40 w-40 rounded-full object-cover ring-4 ring-teal-200 dark:ring-teal-800"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-full bg-zinc-200 text-3xl dark:bg-zinc-800">
                  ?
                </div>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-zinc-500">{user.email}</p>
              {user.funFact && (
                <p>
                  <span className="font-medium">Fun fact: </span>
                  {user.funFact}
                </p>
              )}
              {user.bio && <p className="text-zinc-600 dark:text-zinc-300">{user.bio}</p>}
            </div>
            <div className="rounded-xl border border-teal-200/80 bg-teal-50/70 p-4 dark:border-teal-900/50 dark:bg-teal-950/30">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Top categories
                </p>
                <Link
                  href="/quiz/preferences"
                  className="text-xs font-medium text-teal-700 underline hover:text-teal-900 dark:text-teal-400"
                >
                  {preferenceQuizCompletedAt ? "Retake quiz" : "Take quiz"}
                </Link>
              </div>
              {!preferenceQuizCompletedAt || topCategories.length === 0 ? (
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                  Take the preference quiz to get your top 3 categories.
                </p>
              ) : (
                <ol className="mt-2 space-y-2">
                  {topCategories.map((cat, i) => (
                    <li
                      key={`${cat}-${i}`}
                      className="flex items-center gap-2 rounded-lg border border-teal-100 bg-white/80 px-2.5 py-2 text-xs dark:border-teal-900/40 dark:bg-zinc-900/60"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {cat}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>

        <div className="flex min-h-0 flex-col gap-6 lg:col-span-2 lg:h-full">
          <section className="shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="font-medium text-zinc-800 dark:text-zinc-200">
              Working hours (example)
            </h2>
            <div className="mt-4 grid gap-3">
              {[
                ["Mon", 6],
                ["Tue", 4],
                ["Wed", 7],
                ["Thu", 5],
                ["Fri", 8],
                ["Sat", 3],
                ["Sun", 2],
              ].map(([day, hours]) => (
                <div key={String(day)} className="flex items-center gap-3">
                  <div className="w-10 text-xs text-zinc-500">{String(day)}</div>
                  <div className="h-3 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-3 rounded bg-teal-500"
                      style={{ width: `${Number(hours) * 12}%` }}
                    />
                  </div>
                  <div className="w-10 text-right text-xs text-zinc-500">
                    {String(hours)}h
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="shrink-0">
            <WorkerInterviewActions items={interviewProposalsForWorker} />
          </div>

          {confirmedInterviews.length > 0 && (
            <section className="shrink-0 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
              <h2 className="text-lg font-medium text-emerald-900 dark:text-emerald-100">
                Confirmed interviews
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {confirmedInterviews.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/jobs/${a.jobId}`}
                      className="font-medium text-emerald-900 hover:underline dark:text-emerald-200"
                    >
                      {a.job.title}
                    </Link>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {new Date(a.interviewAt!).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-auto flex min-h-[18rem] flex-1 flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:min-h-[22rem]">
            <h2 className="text-lg font-medium">Application pending status</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Pending applications: {pending.length}
            </p>
            <ul className="mt-4 flex-1 divide-y divide-zinc-200 overflow-y-auto dark:divide-zinc-800">
              {applications.length === 0 && (
                <li className="py-4 text-sm text-zinc-500">
                  No applications yet.{" "}
                  <Link href="/calendar" className="text-teal-700 underline">
                    Browse the calendar
                  </Link>
                  .
                </li>
              )}
              {applications.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-4"
                >
                  <div>
                    <Link
                      href={`/jobs/${a.jobId}`}
                      className="font-medium text-teal-800 hover:underline dark:text-teal-300"
                    >
                      {a.job.title}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      Updated {new Date(a.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(a.status)}`}
                  >
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
