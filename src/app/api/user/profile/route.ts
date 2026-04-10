import { DEMO_WORKER_ID, ensureDemoUsers } from "@/lib/demo-users";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  bio: z.string().max(5000).optional(),
  funFact: z.string().max(500).optional(),
  onboardingCompleted: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  await ensureDemoUsers();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const data: {
    bio?: string | null;
    funFact?: string | null;
    onboardingCompleted?: boolean;
  } = {};

  if (parsed.data.bio !== undefined) data.bio = parsed.data.bio;
  if (parsed.data.funFact !== undefined) data.funFact = parsed.data.funFact;
  if (parsed.data.onboardingCompleted === true) {
    data.onboardingCompleted = true;
  }

  const user = await prisma.user.update({
    where: { id: DEMO_WORKER_ID },
    data,
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted,
      bio: user.bio,
      funFact: user.funFact,
    },
  });
}
