"use client";

import type { AuLocationHit } from "@/lib/au-location-types";
import { useCallback, useEffect, useId, useRef, useState } from "react";

type Props = {
  id?: string;
  value: string;
  onChange: (displayLine: string) => void;
  required?: boolean;
};

export function AuLocationAutocomplete({
  id: idProp,
  value,
  onChange,
  required,
}: Props) {
  const reactId = useId();
  const listId = `${reactId}-list`;
  const inputId = idProp ?? `${reactId}-input`;

  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AuLocationHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const committedRef = useRef(!!value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
    committedRef.current = !!value;
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/locations/au-search?q=${encodeURIComponent(q.trim())}`
      );
      const data = (await res.json()) as {
        results?: AuLocationHit[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Search failed");
        setResults([]);
        return;
      }
      setResults(data.results ?? []);
    } catch {
      setError("Could not reach location search");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function onInputChange(v: string) {
    setQuery(v);
    if (committedRef.current) {
      committedRef.current = false;
      onChange("");
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(v);
    }, 380);
    setOpen(true);
  }

  function pick(hit: AuLocationHit) {
    committedRef.current = true;
    onChange(hit.display);
    setQuery(hit.display);
    setOpen(false);
    setResults([]);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div role="combobox" aria-expanded={open} aria-controls={listId}>
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          required={required}
          aria-autocomplete="list"
          placeholder="Search suburb, city, state…"
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 placeholder:font-normal dark:border-zinc-700 dark:bg-zinc-900"
          value={query}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => {
            setOpen(true);
            if (query.trim().length >= 2) void runSearch(query);
          }}
        />
      </div>
      <p className="mt-1 text-[11px] text-zinc-500">
        Australian places via OpenStreetMap search — pick a suggestion so suburb,
        city, and state are recorded accurately.
      </p>
      {error && (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{error}</p>
      )}
      {open && (loading || results.length > 0) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {loading && results.length === 0 && (
            <li className="px-3 py-2 text-zinc-500">Searching…</li>
          )}
          {results.map((hit) => (
            <li key={hit.display} role="option" aria-selected={false}>
              <button
                type="button"
                role="presentation"
                className="w-full px-3 py-2 text-left hover:bg-teal-50 dark:hover:bg-teal-950/50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(hit)}
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {hit.suburb}
                  {hit.city ? (
                    <>
                      <span className="text-zinc-400"> · </span>
                      {hit.city}
                    </>
                  ) : null}
                </span>
                {hit.state ? (
                  <span className="block text-xs text-zinc-500">{hit.state}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
