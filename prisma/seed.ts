import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";
import { SUPPORT_JOB_CATEGORY_TAGS } from "../src/lib/support-job-categories";
import pg from "pg";

const DEMO_WORKER_ID = "demo-worker";
const DEMO_CLIENT_ID = "demo-client";

const T = SUPPORT_JOB_CATEGORY_TAGS;

/** Weekdays only, starting 6 Apr 2026 (Mon), 20 days → ~4 weeks. */
function weekdaysFromApril2026(count: number): Date[] {
  const out: Date[] = [];
  const d = new Date(2026, 3, 6);
  while (out.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Start/end hours within 09:00–17:00 (spread, no overlap on same day — one job per day). */
/** Varied demo rates ($/hr AUD), aligned with JOBS order (20 entries). */
const SEED_PRICE_PER_HOUR_AUD: number[] = [
  42, 48, 44, 46, 52, 55, 40, 45, 50, 43, 47, 49, 51, 44, 46, 48, 53, 41, 45,
  47,
];

const DAY_SLOTS: [number, number, number, number][] = [
  [9, 0, 11, 0],
  [11, 15, 13, 15],
  [14, 0, 16, 0],
  [9, 30, 11, 30],
  [13, 0, 15, 0],
  [15, 30, 17, 0],
  [10, 0, 12, 0],
  [12, 30, 14, 30],
  [9, 0, 10, 30],
  [16, 0, 17, 0],
  [10, 30, 12, 30],
  [13, 30, 15, 30],
  [11, 0, 13, 0],
  [14, 30, 16, 30],
  [9, 0, 12, 0],
  [12, 0, 14, 0],
  [15, 0, 17, 0],
  [9, 45, 11, 45],
  [13, 15, 15, 15],
  [10, 15, 12, 15],
];

type JobSeed = {
  title: string;
  summary: string;
  clientName: string;
  region: string;
  personality: string;
  preferences: string;
  reqAgeMin: number;
  reqAgeMax: number;
  reqGender: string;
  reqPhysicalAbility: string;
  description: string;
  tags: string[];
};

const JOBS: JobSeed[] = [
  {
    title: "Morning park walk & mobility check-in",
    summary:
      "Gentle outdoor walk with rest stops; light mobility cues and hydration prompts.",
    clientName: "Alex M.",
    region: "Surry Hills, Sydney, New South Wales",
    personality: "Calm, enjoys nature; prefers a steady pace.",
    preferences: "Morning only; text 30 min before arrival.",
    reqAgeMin: 25,
    reqAgeMax: 55,
    reqGender: "any",
    reqPhysicalAbility: "Comfortable walking 45–60 minutes on mixed paths.",
    description:
      "Meet at the client’s front entrance, walk to the nearby park, use paved paths where possible. Offer arm support on uneven sections, plan rest on benches every 15 minutes. Note any discomfort or balance concerns in the handover log.",
    tags: [T[1], T[5]],
  },
  {
    title: "Hearing clinic & GP — note-taking support",
    summary:
      "Two short appointments; help with hearing loop access and clear written notes.",
    clientName: "Jordan K.",
    region: "Carlton, Melbourne, Victoria",
    personality: "Direct; appreciates clear time buffers between rooms.",
    preferences: "Written summary emailed same day.",
    reqAgeMin: 22,
    reqAgeMax: 60,
    reqGender: "any",
    reqPhysicalAbility: "Low physical demand; mostly seated waiting.",
    description:
      "Check in at reception for both bookings, sit with the client during consults, capture key instructions and medication changes. Escort to pharmacy if time allows.",
    tags: [T[3], T[4]],
  },
  {
    title: "Meal prep & kitchen tidy — NDIS household",
    summary:
      "Prepare two balanced meals and reset the kitchen; label containers for the week.",
    clientName: "Samira H.",
    region: "Fortitude Valley, Brisbane, Queensland",
    personality: "Warm; likes clear labels and predictable routines.",
    preferences: "No strong spices; dairy-free options.",
    reqAgeMin: 21,
    reqAgeMax: 58,
    reqGender: "any",
    reqPhysicalAbility: "Standing and light lifting (shopping bags).",
    description:
      "Use the client’s meal plan sheet, chop and cook two mains plus sides, wash dishes and wipe surfaces. Photograph fridge layout before leaving.",
    tags: [T[2], T[7]],
  },
  {
    title: "Community bus & shopping escort",
    summary:
      "Ride the local bus to the shopping centre; assist with bags and checkout.",
    clientName: "Chris P.",
    region: "Glenelg, Adelaide, South Australia",
    personality: "Chatty in short bursts; needs patience in crowds.",
    preferences: "Avoid peak Saturday crowds if possible.",
    reqAgeMin: 24,
    reqAgeMax: 62,
    reqGender: "any",
    reqPhysicalAbility: "Able to push a loaded trolley short distances.",
    description:
      "Meet at the bus stop, tap on with the client’s concession card, stay together in the centre, carry up to two bags. Return on the same route.",
    tags: [T[4], T[5]],
  },
  {
    title: "Afternoon companionship & tea ritual",
    summary:
      "Quiet company at home: conversation, cards, and a short sit in the garden.",
    clientName: "Patricia L.",
    region: "Subiaco, Perth, Western Australia",
    personality: "Soft-spoken; enjoys classical radio and tea.",
    preferences: "Sessions 2–3 hours; no phone use during visit.",
    reqAgeMin: 30,
    reqAgeMax: 65,
    reqGender: "female",
    reqPhysicalAbility: "Minimal; one short step at the front door.",
    description:
      "Prepare tea to the client’s preference, engage in light conversation or reading aloud, assist with opening mail if requested. Log mood and appetite in the app.",
    tags: [T[5], T[6]],
  },
  {
    title: "Shower assist & dressing — male worker preferred",
    summary:
      "Respectful personal care with a second person (family) present for first 15 minutes.",
    clientName: "Robert T.",
    region: "Geelong, Victoria",
    personality: "Dignified; prefers clear verbal cues before touch.",
    preferences: "Male-identifying worker; morning slot only.",
    reqAgeMin: 28,
    reqAgeMax: 55,
    reqGender: "male",
    reqPhysicalAbility: "Experience with transfer aids and non-slip mats.",
    description:
      "Follow the client’s care plan for shower sequence, dry and dress, ensure bathroom safety. Family member leaves after introduction; document skin checks as per checklist.",
    tags: [T[0], T[1]],
  },
  {
    title: "School pickup & homework hour",
    summary:
      "Collect two children, snack at home, supervise quiet homework time.",
    clientName: "Nina V.",
    region: "Wollongong, New South Wales",
    personality: "Kids are energetic; client values firm but kind boundaries.",
    preferences: "WWCC sighted; no social media photos of children.",
    reqAgeMin: 23,
    reqAgeMax: 45,
    reqGender: "any",
    reqPhysicalAbility: "Driving licence required; car not provided.",
    description:
      "Sign out at school office, walk children home safely, prepare a simple snack, sit with homework for 45 minutes. Message parent if behaviour or safety issues arise.",
    tags: [T[6], T[7]],
  },
  {
    title: "Physio exercises at home — gentle prompting",
    summary:
      "Support the client through a printed exercise sheet after telehealth physio.",
    clientName: "Wei Z.",
    region: "Hobart, Tasmania",
    personality: "Motivated but tires easily; needs encouragement.",
    preferences: "Stop if pain above 4/10; log reps completed.",
    reqAgeMin: 25,
    reqAgeMax: 58,
    reqGender: "any",
    reqPhysicalAbility: "Spotting and floor-level assistance; mat provided.",
    description:
      "Set up space, time stretches, count repetitions, ensure hydration. Do not modify the programme—escalate questions to the physio line.",
    tags: [T[1], T[3]],
  },
  {
    title: "NDIS plan review — paperwork prep",
    summary:
      "Help gather receipts and draft bullet points before the planner call.",
    clientName: "Dana R.",
    region: "Canberra, Australian Capital Territory",
    personality: "Organised; anxiety spikes before official calls.",
    preferences: "Print-friendly summary; calm tone.",
    reqAgeMin: 26,
    reqAgeMax: 60,
    reqGender: "any",
    reqPhysicalAbility: "Desk-based; occasional filing cabinet reach.",
    description:
      "Sort documents into folders, build a one-page goals list, sit in on the call for note-taking. No financial advice—only facilitation.",
    tags: [T[7], T[2]],
  },
  {
    title: "Evening meal & medication prompt",
    summary:
      "Heat prepared meals, prompt evening meds from blister pack, quick tidy.",
    clientName: "Evelyn S.",
    region: "Ballarat, Victoria",
    personality: "Independent but forgetful with timing.",
    preferences: "Medication chart must be signed each visit.",
    reqAgeMin: 27,
    reqAgeMax: 64,
    reqGender: "any",
    reqPhysicalAbility: "Light household tasks only.",
    description:
      "Microwave or oven per instructions, observe swallowing and mood, complete medication sign-off, wipe kitchen and take rubbish out if full.",
    tags: [T[2], T[3]],
  },
  {
    title: "Art gallery outing — wheelchair access route",
    summary:
      "Half-day cultural visit with booked wheelchair and cafe stop.",
    clientName: "Omar F.",
    region: "Southbank, Melbourne, Victoria",
    personality: "Curious; needs breaks every 40 minutes.",
    preferences: "Book gallery wheelchair 48h ahead—already arranged.",
    reqAgeMin: 24,
    reqAgeMax: 55,
    reqGender: "any",
    reqPhysicalAbility: "Confident with manual wheelchair on lifts and ramps.",
    description:
      "Collect wheelchair at entrance, follow accessible route map, pause in each wing as needed. Debrief with family by SMS after drop-off.",
    tags: [T[4], T[5]],
  },
  {
    title: "Garden pots & light weeding",
    summary:
      "Outdoor session: repot herbs, weed two beds, water as marked.",
    clientName: "Bethany C.",
    region: "Sunshine Coast, Queensland",
    personality: "Green thumb; direct instructions preferred.",
    preferences: "Bring own gloves; tools in shed.",
    reqAgeMin: 20,
    reqAgeMax: 58,
    reqGender: "any",
    reqPhysicalAbility: "Kneeling and bending; sun protection required.",
    description:
      "Follow labelled beds only, use kneeler pad, dispose of green waste in bin. Photo before/after for the client’s records.",
    tags: [T[2], T[5]],
  },
  {
    title: "Telehealth setup & tech check",
    summary:
      "Test camera, mic, and link before a specialist video appointment.",
    clientName: "Harold W.",
    region: "Newcastle, New South Wales",
    personality: "Frustrated by tech; patient coaching helps.",
    preferences: "Arrive 45 minutes before appointment start.",
    reqAgeMin: 22,
    reqAgeMax: 50,
    reqGender: "any",
    reqPhysicalAbility: "Seated; occasional standing to adjust cables.",
    description:
      "Run speed test, close background apps, position device, stay for the first 5 minutes of the call then wait in the next room unless needed.",
    tags: [T[3], T[7]],
  },
  {
    title: "Swimming pool companion — shallow end",
    summary:
      "Aquatic centre visit: change-room assist and poolside presence only.",
    clientName: "Michelle O.",
    region: "Gold Coast, Queensland",
    personality: "Confident in water; uses a noodle for support.",
    preferences: "Female-identifying worker preferred.",
    reqAgeMin: 25,
    reqAgeMax: 48,
    reqGender: "female",
    reqPhysicalAbility: "Pool lifeguard not required; must be water-confident.",
    description:
      "Help with locker and shower shoes, stay in shallow lane, no hands-on rescue—alert staff if distress. Session length per pool policy.",
    tags: [T[1], T[5]],
  },
  {
    title: "Grocery shop & unpack — low-ticket budget",
    summary:
      "Shop from a strict list, compare unit prices, unpack and date-label.",
    clientName: "Kenji I.",
    region: "Parramatta, New South Wales",
    personality: "Budget-conscious; appreciates receipts kept.",
    preferences: "Cashless only; keep under $120 unless text approval.",
    reqAgeMin: 21,
    reqAgeMax: 60,
    reqGender: "any",
    reqPhysicalAbility: "Carrying multiple bags up one flight of stairs.",
    description:
      "Use client’s loyalty cards, photograph receipt, put cold items away first, mark use-by dates on dairy.",
    tags: [T[4], T[2]],
  },
  {
    title: "Respite for family — stay with client while carer errands",
    summary:
      "Cover a two-hour window; conversation, tea, and passive monitoring.",
    clientName: "Ruth E.",
    region: "Launceston, Tasmania",
    personality: "Mostly independent; uses a walker indoors.",
    preferences: "Emergency numbers on the fridge; no visitors.",
    reqAgeMin: 28,
    reqAgeMax: 65,
    reqGender: "any",
    reqPhysicalAbility: "Low; assist with kettle and answering door only.",
    description:
      "Stay in shared living areas, offer drinks, note any falls or confusion. Do not administer medication—call primary carer if unsure.",
    tags: [T[5], T[6]],
  },
  {
    title: "Foot care & compression socks — community nurse shadow",
    summary:
      "Observe and assist per nurse worksheet; no cutting nails unless ticked.",
    clientName: "George N.",
    region: "Darwin, Northern Territory",
    personality: "Diabetic feet; strict hygiene.",
    preferences: "Supplies in labelled tub; gloves mandatory.",
    reqAgeMin: 26,
    reqAgeMax: 55,
    reqGender: "any",
    reqPhysicalAbility: "Fine motor for gentle washing and lotion.",
    description:
      "Follow the one-page protocol from the clinic, apply socks as demonstrated, elevate legs 10 minutes after. Escalate breaks in skin immediately.",
    tags: [T[3], T[0]],
  },
  {
    title: "Music practice companion — cognitive stimulation",
    summary:
      "Sit with the client during piano practice; turn pages and time breaks.",
    clientName: "Clara D.",
    region: "St Kilda, Melbourne, Victoria",
    personality: "Former teacher; mild memory loss.",
    preferences: "Encourage but don’t correct technique unless asked.",
    reqAgeMin: 24,
    reqAgeMax: 70,
    reqGender: "any",
    reqPhysicalAbility: "Seated; occasional standing to adjust sheet music.",
    description:
      "Set timer for 20-minute blocks, offer water, log pieces attempted. Gentle redirection if frustration rises.",
    tags: [T[6], T[5]],
  },
  {
    title: "Night-early handover — dinner & wind-down routine",
    summary:
      "Prepare simple dinner, medication evening dose, lock-up checklist.",
    clientName: "Victor H.",
    region: "Cairns, Queensland",
    personality: "Early diner; likes TV news before bed prep.",
    preferences: "All doors locked checklist on bench.",
    reqAgeMin: 25,
    reqAgeMax: 58,
    reqGender: "any",
    reqPhysicalAbility: "Stairs once at end of shift with client.",
    description:
      "Cook per printed recipes, supervise evening meds from blister pack, run through windows and doors, leave handover note for overnight family.",
    tags: [T[2], T[3]],
  },
  {
    title: "Weekend market run — social outing",
    summary:
      "Farmers market visit: coffee, produce shop, slow walk home.",
    clientName: "Imogen A.",
    region: "Fremantle, Western Australia",
    personality: "Extroverted; enjoys chatting with stallholders.",
    preferences: "Sunscreen and hat reminders; cash float $40.",
    reqAgeMin: 22,
    reqAgeMax: 52,
    reqGender: "any",
    reqPhysicalAbility: "Walking 90 minutes with rests; two light bags.",
    description:
      "Meet at café first, browse stalls clockwise, help carry produce, debrief over coffee before walking home.",
    tags: [T[4], T[5]],
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Set DATABASE_URL for seeding.");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.user.upsert({
    where: { id: DEMO_WORKER_ID },
    update: { image: "/demo-worker-profile.png" },
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
    update: { image: "/demo-client-profile.png" },
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

  const removed = await prisma.job.deleteMany({});
  console.log(`Removed ${removed.count} existing job listing(s).`);

  const days = weekdaysFromApril2026(20);
  if (days.length !== 20 || JOBS.length !== 20) {
    throw new Error("Expected 20 weekdays and 20 job definitions.");
  }

  const data = JOBS.map((job, i) => {
    const day = days[i];
    const [sh, sm, eh, em] = DAY_SLOTS[i];
    const startAt = new Date(day);
    startAt.setHours(sh, sm, 0, 0);
    const endAt = new Date(day);
    endAt.setHours(eh, em, 0, 0);

    return {
      title: job.title,
      summary: job.summary,
      startAt,
      endAt,
      tags: job.tags,
      clientName: job.clientName,
      region: job.region,
      personality: job.personality,
      preferences: job.preferences,
      reqAgeMin: job.reqAgeMin,
      reqAgeMax: job.reqAgeMax,
      reqGender: job.reqGender,
      reqPhysicalAbility: job.reqPhysicalAbility,
      description: job.description,
      pricePerHourAud: SEED_PRICE_PER_HOUR_AUD[i]!,
      providerId: DEMO_CLIENT_ID,
      clientPhotoUrl: "/demo-client-profile.png",
    };
  });

  await prisma.job.createMany({ data });

  console.log(
    `Created ${data.length} job listings (weekdays from 6 Apr 2026, 9:00–17:00) for demo client user (${DEMO_CLIENT_ID}).`
  );
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
