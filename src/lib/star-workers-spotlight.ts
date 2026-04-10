/** Homepage spotlight carousel — illustrative profiles (not all DB-backed). */
export type StarWorkerSpotlight = {
  id: string;
  name: string;
  email: string;
  imageSrc: string;
  bio: string;
  funFact: string;
  /** Short labels shown in floating category boxes */
  categories: string[];
};

export const STAR_WORKERS_SPOTLIGHT: StarWorkerSpotlight[] = [
  {
    id: "demo",
    name: "Demo Worker",
    email: "worker@featherly.local",
    imageSrc: "/demo-worker-profile.png",
    bio: "Experienced support worker with community outreach focus.",
    funFact: "I enjoy hiking on weekends.",
    categories: ["House support", "Companionship", "Transport"],
  },
  {
    id: "maya",
    name: "Maya Chen",
    email: "maya.chen@featherly.local",
    imageSrc: "/star-worker-sam.png",
    bio: "Calm, detail-oriented support with a background in aged care and meal planning.",
    funFact: "I bake sourdough every Sunday.",
    categories: ["Personal care", "Medical support", "Care coordination"],
  },
  {
    id: "sam",
    name: "Sam Okonkwo",
    email: "sam.okonkwo@featherly.local",
    imageSrc: "/star-worker-maya.png",
    bio: "Mobility and community access specialist—wheelchair-friendly outings and errands.",
    funFact: "Volunteer coach for junior footy on Saturdays.",
    categories: ["Mobility", "Skills & independence", "Transport"],
  },
];
