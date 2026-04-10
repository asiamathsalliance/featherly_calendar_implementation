import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white/90 py-8 text-center text-[15px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-400">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-4 sm:flex-row sm:gap-6">
        <p>
          © {new Date().getFullYear()} Featherly. All rights reserved.
        </p>
        <span className="hidden text-zinc-300 sm:inline dark:text-zinc-600" aria-hidden>
          |
        </span>
        <Link
          href="/terms"
          className="font-medium text-teal-700 hover:underline dark:text-teal-400"
        >
          Terms
        </Link>
      </div>
    </footer>
  );
}
