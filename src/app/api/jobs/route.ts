import type { Prisma } from "@/generated/prisma";
import { DEMO_CLIENT_ID, ensureDemoUsers } from "@/lib/demo-users";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createJobSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  startAt: z.string(),
  endAt: z.string(),
  tags: z.array(z.string()),
  clientName: z.string().min(1),
  region: z.string().min(1),
  clientPhotoUrl: z.string().url().optional().or(z.literal("")),
  personality: z.string().optional(),
  preferences: z.string().optional(),
  reqAgeMin: z.number().int().optional(),
  reqAgeMax: z.number().int().optional(),
  reqGender: z.string().optional(),
  reqPhysicalAbility: z.string().optional(),
  description: z.string().min(1),
  pricePerHourAud: z.number().int().min(18).max(250),
});

export async function GET(req: Request) {
  await ensureDemoUsers();

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const tagsParam = searchParams.get("tags");

  const where: Prisma.JobWhereInput = {};

  if (from && to) {
    where.AND = [
      { startAt: { lte: new Date(to) } },
      { endAt: { gte: new Date(from) } },
    ];
  } else if (from) {
    where.endAt = { gte: new Date(from) };
  } else if (to) {
    where.startAt = { lte: new Date(to) };
  }

  if (tagsParam) {
    const tags = tagsParam.split(",").map((t) => t.trim()).filter(Boolean);
    if (tags.length) {
      where.tags = { hasSome: tags };
    }
  }

  const jobs = await prisma.job.findMany({
    where,
    orderBy: { startAt: "asc" },
    include: {
      provider: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  await ensureDemoUsers();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const d = parsed.data;
  const startAt = new Date(d.startAt);
  let endAt = new Date(d.endAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return NextResponse.json(
      { error: "Invalid start or end time." },
      { status: 422 }
    );
  }
  if (endAt <= startAt) {
    // Force a valid range to avoid blocking posting on malformed/equal times.
    endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  }

  const job = await prisma.job.create({
    data: {
      title: d.title,
      summary:
        d.summary?.trim() ||
        d.description.trim().slice(0, 180) ||
        d.title.trim(),
      startAt,
      endAt,
      tags: d.tags,
      clientName: d.clientName,
      region: d.region.trim(),
      clientPhotoUrl:
        (d.clientPhotoUrl && String(d.clientPhotoUrl).trim()) ||
        "/demo-client-profile.png",
      personality: d.personality ?? null,
      preferences: d.preferences ?? null,
      reqAgeMin: d.reqAgeMin ?? null,
      reqAgeMax: d.reqAgeMax ?? null,
      reqGender: d.reqGender ?? null,
      reqPhysicalAbility: d.reqPhysicalAbility ?? null,
      description: d.description,
      pricePerHourAud: d.pricePerHourAud,
      providerId: DEMO_CLIENT_ID,
    },
  });

  return NextResponse.json({ job });
}
