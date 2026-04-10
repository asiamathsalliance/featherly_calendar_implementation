"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Home", active: pathname === "/" },
    {
      href: "/dashboard/worker",
      label: "Dashboard",
      active: pathname.startsWith("/dashboard"),
    },
    {
      href: "/calendar",
      label: "Job Calendar",
      active: pathname.startsWith("/calendar") || pathname.startsWith("/jobs/"),
    },
    {
      href: "/quiz/preferences",
      label: "Take a free quiz",
      active: pathname.startsWith("/quiz/preferences"),
    },
  ];

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 sm:gap-8 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 text-xl font-bold tracking-tight text-teal-800 dark:text-teal-300"
        >
          <Image
            src="/favicon-featherly.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 rounded-lg object-contain"
            priority
          />
          <span>Featherly</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-[15px] font-medium sm:gap-4">
          {links.map((link, i) => (
            <div key={link.href} className="flex items-center gap-3 sm:gap-4">
              <Link
                className={`group relative inline-block pb-0.5 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:text-teal-700 dark:hover:text-teal-400 ${
                  link.active ? "text-teal-800 dark:text-teal-300" : "text-zinc-700 dark:text-zinc-300"
                }`}
                href={link.href}
              >
                <span className="transition-opacity duration-300 ease-out group-hover:opacity-100">
                  {link.label}
                </span>
                <span
                  className={`absolute -bottom-0.5 left-0 right-0 h-0.5 origin-center rounded-full bg-teal-500 transition-all duration-300 ease-out dark:bg-teal-400 ${
                    link.active
                      ? "scale-x-100 opacity-100"
                      : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-40"
                  }`}
                  aria-hidden
                />
              </Link>
              {i < links.length - 1 && (
                <span className="text-zinc-400 dark:text-zinc-600">|</span>
              )}
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
