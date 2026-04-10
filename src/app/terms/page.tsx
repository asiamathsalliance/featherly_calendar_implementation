import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/"
        className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
      >
        ← Back home
      </Link>
      <h1 className="mt-8 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Terms of use
      </h1>
      <p className="mt-6 text-[17px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        Featherly is provided as a demonstration product for scheduling and
        matching support work. Use it at your own discretion. Nothing on this
        site constitutes legal, medical, or professional advice. We make no
        warranties about availability or accuracy of data.
      </p>
      <p className="mt-4 text-[17px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        By using this site you agree not to misuse it or attempt to access
        systems or data without authorization. We may change or discontinue
        the demo at any time.
      </p>
    </main>
  );
}
