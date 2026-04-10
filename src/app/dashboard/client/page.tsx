import { DEMO_CLIENT_ID, ensureDemoUsers } from "@/lib/demo-users";
import { prisma } from "@/lib/prisma";
import { ClientJobReviewList } from "@/components/client-job-review-list";
import { DashboardToggle } from "@/components/dashboard-toggle";
import { NewJobForm } from "../provider/new-job-form";

export default async function ClientDashboardPage() {
  await ensureDemoUsers();
  const jobs = await prisma.job.findMany({
    where: { providerId: DEMO_CLIENT_ID },
    orderBy: { startAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
  const jobRows = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    startAt: j.startAt.toISOString(),
    pricePerHourAud: j.pricePerHourAud,
    applicantCount: j._count.applications,
  }));

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-14">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Client dashboard</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Review applications and post new job listings.
          </p>
        </div>
        <DashboardToggle current="client" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium">Client profile</h2>
          <div className="mt-5 space-y-4">
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/demo-client-profile.png"
                alt=""
                className="h-40 w-40 rounded-full object-cover ring-4 ring-teal-200 dark:ring-teal-800"
              />
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-lg font-semibold">Demo Client</p>
              <p className="text-zinc-500">client@featherly.local</p>
              <p className="text-zinc-600 dark:text-zinc-300">
                Coordinates support sessions and reviews applicants for best fit.
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-medium">Review applications</h2>
            <ClientJobReviewList jobs={jobRows} />
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-medium">Post a new listing</h2>
            <div className="mt-4">
              <NewJobForm />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
