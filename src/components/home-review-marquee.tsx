const REVIEWS = [
  {
    quote:
      "Posting shifts on Featherly finally felt organised—applicants actually matched what we needed.",
    name: "Sarah M.",
    role: "Family coordinator",
  },
  {
    quote:
      "I could see the role window on the calendar and apply without guessing the hours. Huge relief.",
    name: "James T.",
    role: "Support worker",
  },
  {
    quote:
      "The screening questions were tied to our client’s situation—saves us time on first calls.",
    name: "Priya K.",
    role: "Service provider",
  },
  {
    quote:
      "Clear layout, easy to switch between worker and client views for testing our workflow.",
    name: "Alex R.",
    role: "Operations lead",
  },
  {
    quote:
      "We got structured applications instead of random emails. Makes shortlisting straightforward.",
    name: "Daniel L.",
    role: "Client advocate",
  },
];

export function HomeReviewMarquee() {
  const loop = [...REVIEWS, ...REVIEWS];

  return (
    <section className="w-full" aria-label="Client and worker reviews">
      <div className="relative overflow-hidden py-2">
        <div
          className="home-marquee-track flex w-max gap-5 pr-5"
          style={{ willChange: "transform" }}
        >
          {loop.map((r, i) => (
            <figure
              key={`${r.name}-${i}`}
              className="w-[min(100vw-2rem,22rem)] shrink-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <blockquote className="text-[17px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                “{r.quote}”
              </blockquote>
              <figcaption className="mt-4 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {r.name}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400"> · {r.role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
