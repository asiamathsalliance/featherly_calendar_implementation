"use client";

import { STAR_WORKERS_SPOTLIGHT } from "@/lib/star-workers-spotlight";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

export function StarWorkersCarousel() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const n = STAR_WORKERS_SPOTLIGHT.length;

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + n) % n);
    },
    [n]
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 48) return;
    if (dx > 0) go(-1);
    else go(1);
  };

  return (
    <div className="relative px-8 sm:px-11 md:px-14">
      <button
        type="button"
        aria-label="Previous star worker"
        onClick={() => go(-1)}
        className="absolute left-0 top-1/2 z-30 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-1 text-4xl font-light leading-none text-teal-700/85 transition hover:text-teal-600 sm:text-5xl dark:text-teal-400/90 dark:hover:text-teal-300"
      >
        <span aria-hidden>‹</span>
      </button>
      <button
        type="button"
        aria-label="Next star worker"
        onClick={() => go(1)}
        className="absolute right-0 top-1/2 z-30 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-1 text-4xl font-light leading-none text-teal-700/85 transition hover:text-teal-600 sm:text-5xl dark:text-teal-400/90 dark:hover:text-teal-300"
      >
        <span aria-hidden>›</span>
      </button>

      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/90 bg-white shadow-lg dark:border-zinc-700/80 dark:bg-zinc-900/60">
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="relative z-0"
        >
          <div
            className="flex [@media(prefers-reduced-motion:reduce)]:transition-none"
            style={{
              width: `${n * 100}%`,
              transform: `translateX(-${(index / n) * 100}%)`,
              transition: "transform 0.45s cubic-bezier(0.33, 1, 0.68, 1)",
            }}
          >
            {STAR_WORKERS_SPOTLIGHT.map((w) => (
              <div
                key={w.id}
                className="shrink-0"
                style={{ width: `${100 / n}%` }}
              >
                <div className="grid gap-0 md:grid-cols-[minmax(240px,340px)_1fr]">
                  <div className="flex items-center justify-center bg-zinc-50 p-6 sm:p-8 dark:bg-zinc-950">
                    <div className="relative aspect-[4/5] w-full max-w-[260px] overflow-hidden rounded-2xl shadow-md ring-1 ring-zinc-200/70 dark:ring-zinc-600/80">
                      <Image
                        src={w.imageSrc}
                        alt=""
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 768px) 85vw, 280px"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                    <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                      {w.name}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {w.email}
                    </p>
                    <p className="mt-6 text-[17px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {w.bio}
                    </p>
                    <p className="mt-5 text-[17px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        Fun fact:{" "}
                      </span>
                      {w.funFact}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                      {w.categories.map((label, i) => (
                        <span
                          key={`${w.id}-${i}-${label}`}
                          className="inline-block rounded-xl border border-teal-200/90 bg-white/95 px-3.5 py-2 text-xs font-semibold text-teal-900 shadow-[0_6px_20px_rgba(15,118,110,0.14)] backdrop-blur-sm dark:border-teal-800/80 dark:bg-zinc-800/95 dark:text-teal-100 dark:shadow-black/25"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="mt-5 flex justify-center gap-2"
        role="tablist"
        aria-label="Star worker slides"
      >
        {STAR_WORKERS_SPOTLIGHT.map((w, i) => (
          <button
            key={w.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show ${w.name}`}
            onClick={() => setIndex(i)}
            className={`h-2 cursor-pointer rounded-full transition-all ${
              i === index
                ? "w-8 bg-teal-600 dark:bg-teal-400"
                : "w-2 bg-zinc-300 dark:bg-zinc-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
