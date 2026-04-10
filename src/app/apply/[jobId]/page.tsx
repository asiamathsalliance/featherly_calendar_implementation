import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyFlow } from "./apply-flow";

type Params = { params: Promise<{ jobId: string }> };

export default async function ApplyPage(context: Params) {
  const { jobId } = await context.params;

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) notFound();

  const shiftRangeLabel = `${new Date(job.startAt).toLocaleString()} — ${new Date(job.endAt).toLocaleString()}`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/jobs/${jobId}`}
        className="text-sm text-teal-700 hover:underline dark:text-teal-400"
      >
        ← Job details
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">Application</h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Answer a short screening quiz generated for this role, then submit your
        application.
      </p>
      <ApplyFlow jobId={jobId} shiftRangeLabel={shiftRangeLabel} />
    </main>
  );
}
