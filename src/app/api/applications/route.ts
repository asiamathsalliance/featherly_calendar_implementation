import { DEMO_WORKER_ID, ensureDemoUsers } from "@/lib/demo-users";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  jobId: z.string().min(1),
  applicantName: z.string().min(1),
  applicantGender: z.string().min(1),
  applicantAge: z.number().int().min(16).max(100),
  applicantRegion: z.string().min(1),
  availableForShift: z.boolean(),
});

export async function GET(req: Request) {
  await ensureDemoUsers();

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (jobId) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        worker: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            funFact: true,
          },
        },
        quiz: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ applications });
  }

  const applications = await prisma.application.findMany({
    where: { workerId: DEMO_WORKER_ID },
    include: {
      job: true,
      quiz: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ applications });
}

export async function POST(req: Request) {
  await ensureDemoUsers();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const job = await prisma.job.findUnique({
    where: { id: parsed.data.jobId },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existing = await prisma.application.findUnique({
    where: {
      jobId_workerId: {
        jobId: parsed.data.jobId,
        workerId: DEMO_WORKER_ID,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ application: existing });
  }

  const genderRequired = (job.reqGender ?? "").trim().toLowerCase();
  const genderGiven = parsed.data.applicantGender.trim().toLowerCase();
  const genderPreferenceOpen =
    !genderRequired ||
    genderRequired === "any" ||
    genderRequired === "both";
  const genderMismatch =
    !genderPreferenceOpen && genderRequired !== genderGiven;
  const age = parsed.data.applicantAge;
  const ageMismatch =
    (job.reqAgeMin != null && age < job.reqAgeMin) ||
    (job.reqAgeMax != null && age > job.reqAgeMax);

  const availabilityMismatch = parsed.data.availableForShift === false;

  const rejectionReason = genderMismatch
    ? `Gender requirement mismatch (${job.reqGender})`
    : ageMismatch
      ? `Age requirement mismatch (${job.reqAgeMin ?? "?"}-${job.reqAgeMax ?? "?"})`
      : availabilityMismatch
        ? "Not available for the scheduled shift"
        : null;
  const isRejected = !!rejectionReason;

  const application = await prisma.application.create({
    data: {
      jobId: parsed.data.jobId,
      workerId: DEMO_WORKER_ID,
      applicantName: parsed.data.applicantName,
      applicantGender: parsed.data.applicantGender,
      applicantAge: parsed.data.applicantAge,
      applicantRegion: parsed.data.applicantRegion,
      rejectionReason,
      status: isRejected ? "REJECTED" : "DRAFT",
    },
  });

  return NextResponse.json({
    application,
    preScreenRejected: isRejected,
    rejectionReason,
  });
}
