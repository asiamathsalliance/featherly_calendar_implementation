import { DEMO_WORKER_ID, ensureDemoUsers } from "@/lib/demo-users";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function JobDetailPage(context: Params) {
  await ensureDemoUsers();
  const { id } = await context.params;

  const job = await prisma.job.findUnique({
    where: { id },
    include: { provider: { select: { name: true } } },
  });

  if (!job) notFound();

  let existingApplicationId: string | null = null;
  const app = await prisma.application.findUnique({
    where: {
      jobId_workerId: { jobId: id, workerId: DEMO_WORKER_ID },
    },
  });
  const isDraft = app?.status === "DRAFT";
  const hasApplication = Boolean(app);

  const clientPhoto =
    job.clientPhotoUrl?.trim() || "/demo-client-profile.png";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/calendar"
        className="text-sm text-teal-700 hover:underline dark:text-teal-400"
      >
        ← Back to calendar
      </Link>
      <div className="mt-6 flex flex-col gap-6 sm:flex-row">
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={clientPhoto}
            alt=""
            className="h-32 w-32 rounded-2xl object-cover ring-1 ring-zinc-200 dark:ring-zinc-700"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <h1 className="text-2xl font-semibold">{job.title}</h1>
          <p className="text-sm text-zinc-500">
            {new Date(job.startAt).toLocaleString()} —{" "}
            {new Date(job.endAt).toLocaleString()}
          </p>
          <p className="text-base font-medium text-teal-800 dark:text-teal-200">
            ${job.pricePerHourAud} / hour{" "}
            <span className="font-normal text-zinc-500 dark:text-zinc-400">
              (AUD)
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {job.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-900 dark:bg-teal-950 dark:text-teal-200"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="text-zinc-700 dark:text-zinc-300">{job.summary}</p>
          {job.region && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Location:{" "}
              </span>
              {job.region}
            </p>
          )}
        </div>
      </div>

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-medium">Client</h2>
        <p>
          <span className="font-medium">{job.clientName}</span>
        </p>
        {job.personality && (
          <p>
            <span className="font-medium">Personality: </span>
            {job.personality}
          </p>
        )}
        {job.preferences && (
          <p>
            <span className="font-medium">Preferences: </span>
            {job.preferences}
          </p>
        )}
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-medium">Requirements</h2>
        <ul className="list-inside list-disc space-y-1 text-zinc-700 dark:text-zinc-300">
          <li>
            Age: {job.reqAgeMin ?? "—"} — {job.reqAgeMax ?? "—"}
          </li>
          <li>
            Gender preference:{" "}
            {job.reqGender
              ? job.reqGender.charAt(0).toUpperCase() + job.reqGender.slice(1)
              : "Any"}
          </li>
          <li>Physical ability: {job.reqPhysicalAbility ?? "Not specified"}</li>
        </ul>
        <div>
          <h3 className="font-medium">Role description</h3>
          <p className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {job.description}
          </p>
        </div>
      </section>

      <div className="mt-10">
        {hasApplication ? (
          <div className="flex flex-wrap gap-3">
            {isDraft ? (
              <Link
                href={`/apply/${job.id}`}
                className="inline-flex cursor-pointer rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white hover:bg-teal-700"
              >
                Continue your application
              </Link>
            ) : (
              <Link
                href="/dashboard/worker"
                className="inline-flex cursor-pointer rounded-full border border-teal-600 bg-white px-6 py-3 text-sm font-medium text-teal-800 hover:bg-teal-50 dark:border-teal-500 dark:bg-zinc-900 dark:text-teal-200 dark:hover:bg-teal-950"
              >
                View status
              </Link>
            )}
            <span className="self-center text-sm text-zinc-500">
              {isDraft
                ? "Your application is saved as a draft until you submit."
                : "You already have an application for this role."}
            </span>
          </div>
        ) : (
          <Link
            href={`/apply/${job.id}`}
            className="inline-flex rounded-full bg-teal-600 px-6 py-3 text-sm font-medium text-white hover:bg-teal-700"
          >
            Apply for this role
          </Link>
        )}
      </div>
    </main>
  );
}
