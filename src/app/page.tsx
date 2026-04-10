import { FadeInSection } from "@/components/fade-in-section";
import { HomeReviewMarquee } from "@/components/home-review-marquee";
import { StarWorkersCarousel } from "@/components/star-workers-carousel";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* Hero */}
      <FadeInSection
        delayMs={0}
        className="border-b border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50/80 dark:border-zinc-800/80 dark:from-zinc-950 dark:to-zinc-900/50"
      >
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20">
          <div className="space-y-10 text-center sm:space-y-12">
            <Image
              src="/hero-support.png"
              alt="Diverse community in a park, holding hands in a circle, including a person using a wheelchair"
              width={1024}
              height={381}
              className="mx-auto w-full max-w-5xl rounded-3xl object-cover shadow-xl ring-1 ring-zinc-200/60 dark:ring-zinc-700/60"
              priority
            />
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-teal-700 dark:text-teal-400">
              Featherly
            </p>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-zinc-900 sm:text-5xl md:text-6xl dark:text-zinc-50">
              Better matching for{" "}
              <span className="text-teal-700 dark:text-teal-400">
                support workers
              </span>{" "}
              and clients
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-zinc-600 sm:text-xl dark:text-zinc-400">
              Discover roles that fit your strengths, post clear listings, and
              move from calendar browse to hiring decisions in one calm workflow.
            </p>
            <div className="flex flex-wrap justify-center gap-5 pt-2 sm:gap-6">
              <Link
                href="/dashboard/worker"
                className="rounded-full bg-teal-600 px-10 py-4 text-lg font-semibold text-white shadow-md transition hover:bg-teal-700"
              >
                Go to dashboard
              </Link>
              <Link
                href="/calendar"
                className="rounded-full border-2 border-zinc-300 bg-white px-10 py-4 text-lg font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Find a job
              </Link>
              <Link
                href="/dashboard/client"
                className="rounded-full border-2 border-zinc-300 bg-white px-10 py-4 text-lg font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Post job
              </Link>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* How it works */}
      <FadeInSection
        delayMs={80}
        className="border-b border-zinc-200/80 bg-white py-24 dark:border-zinc-800/80 dark:bg-zinc-950 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl dark:text-zinc-50">
              Built for clarity at every step
            </h2>
            <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400">
              Fewer surprises for workers, faster shortlists for clients—without
              losing the human side of care matching.
            </p>
          </div>
          <div className="mt-20 grid gap-12 md:grid-cols-3 md:gap-10 lg:gap-14">
            {[
              {
                title: "For support workers",
                body: "Browse timed sessions on a real calendar, filter by the eight core support categories, and apply when the fit feels right.",
              },
              {
                title: "For clients & providers",
                body: "Post structured roles, review applications in one place, and move candidates through screening and interviews with less back-and-forth.",
              },
              {
                title: "Preference-aware",
                body: "Workers can take a comfort-and-fit quiz so the product understands where they shine—personal care, mobility, emotional support, and more.",
              },
            ].map((block) => (
              <div
                key={block.title}
                className="rounded-3xl border border-zinc-200/90 bg-zinc-50/50 p-9 dark:border-zinc-800 dark:bg-zinc-900/40 sm:p-10"
              >
                <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                  {block.title}
                </h3>
                <p className="mt-5 text-[17px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {block.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </FadeInSection>

      {/* Demo worker spotlight */}
      <section className="border-b border-zinc-200/80 bg-white py-24 dark:border-zinc-800/80 dark:bg-zinc-950 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
              Spotlight
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl dark:text-zinc-50">
              Meet our star worker
            </h2>
            <p className="mt-5 text-lg text-zinc-600 dark:text-zinc-400">
              A real profile from the Featherly demo—see how workers show up to
              clients.
            </p>
          </div>
          <div className="mx-auto mt-14 max-w-4xl">
            <StarWorkersCarousel />
          </div>
        </div>
      </section>

      {/* Social proof */}
      <FadeInSection
        delayMs={200}
        className="bg-gradient-to-b from-zinc-50 to-white py-24 dark:from-zinc-900 dark:to-zinc-950 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl dark:text-zinc-50">
              What people are saying
            </h2>
            <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400">
              Real voices from workers and families who value thoughtful
              matching.
            </p>
          </div>
          <div className="mt-16">
            <HomeReviewMarquee />
          </div>
        </div>
      </FadeInSection>

      {/* Closing CTA — no scroll fade; static for immediate readability */}
      <section className="border-t border-zinc-200/80 bg-teal-950 py-24 text-white dark:border-zinc-800 sm:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Ready to get started?
          </h2>
          <p className="mt-6 text-lg text-teal-100/95">
            Open the calendar or your dashboard—no clutter, just the next right
            step.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-5 sm:gap-6">
            <Link
              href="/quiz/preferences"
              className="rounded-full bg-white px-8 py-3.5 text-base font-semibold text-teal-900 shadow-sm transition hover:bg-teal-50"
            >
              Take the preference quiz
            </Link>
            <Link
              href="/calendar"
              className="rounded-full border-2 border-teal-400/50 px-8 py-3.5 text-base font-semibold text-white transition hover:border-teal-300 hover:bg-teal-900/50"
            >
              View job calendar
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
