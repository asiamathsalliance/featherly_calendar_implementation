import { ensureDemoUsers } from "@/lib/demo-users";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: Params) {
  await ensureDemoUsers();

  const { id } = await context.params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      provider: { select: { id: true, name: true, image: true } },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}
