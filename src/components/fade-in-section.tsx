"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Extra delay after becoming visible (ms) */
  delayMs?: number;
};

export function FadeInSection({ children, className = "", delayMs = 0 }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduceMotion]);

  const shown = visible || reduceMotion;

  return (
    <section
      ref={ref}
      className={`transition-[opacity,transform] duration-[850ms] ease-out [@media(prefers-reduced-motion:reduce)]:translate-y-0 [@media(prefers-reduced-motion:reduce)]:opacity-100 ${
        shown
          ? "translate-y-0 opacity-100"
          : "translate-y-10 opacity-0"
      } ${className}`}
      style={
        shown && !reduceMotion ? { transitionDelay: `${delayMs}ms` } : undefined
      }
    >
      {children}
    </section>
  );
}
