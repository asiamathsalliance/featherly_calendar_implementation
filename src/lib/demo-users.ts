import { prisma } from "@/lib/prisma";

export const DEMO_WORKER_ID = "demo-worker";
export const DEMO_CLIENT_ID = "demo-client";

export async function ensureDemoUsers() {
  await prisma.user.upsert({
    where: { id: DEMO_WORKER_ID },
    update: {
      image: "/demo-worker-profile.png",
    },
    create: {
      id: DEMO_WORKER_ID,
      name: "Demo Worker",
      email: "worker@featherly.local",
      image: "/demo-worker-profile.png",
      role: "SUPPORT_WORKER",
      onboardingCompleted: true,
      bio: "Experienced support worker with community outreach focus.",
      funFact: "I enjoy hiking on weekends.",
    },
  });

  await prisma.user.upsert({
    where: { id: DEMO_CLIENT_ID },
    update: {
      image: "/demo-client-profile.png",
    },
    create: {
      id: DEMO_CLIENT_ID,
      name: "Demo Client",
      email: "client@featherly.local",
      image: "/demo-client-profile.png",
      role: "CLIENT",
      onboardingCompleted: true,
      bio: "Posts support sessions for testing.",
    },
  });
}
