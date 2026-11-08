"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { findCountry, searchCountries } from "@/lib/countries";

/** Searchable, keyboard- and touch-friendly country combobox. */
export function CountrySelect({ id, value, onChange }: { id?: string; value: string; onChange: (code: string) => void }) {
  const selected = findCountry(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const results = searchCountries(query).slice(0, 80);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[active];
      if (hit) choose(hit.code);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="input pr-11"
        placeholder="Search country"
        value={open ? query : (selected?.name ?? "")}
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setActive(0);
        }}
        onBlur={() => {
          setOpen(false);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
      />
      <svg aria-hidden className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-ui" viewBox="0 0 16 16" fill="none">
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-line bg-white p-1 shadow-[0_20px_50px_-20px_rgba(11,31,58,0.35)]"
        >
          {results.length === 0 && <li className="px-4 py-3 text-sm text-slate-ui">No matching country</li>}
          {results.map((c, i) => (
            <li
              key={c.code}
              role="option"
              aria-selected={c.code === value}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(c.code);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-base ${
                i === active ? "bg-mist text-navy" : "text-ink"
              }`}
            >
              <span>{c.name}</span>
              <span className="text-xs text-slate-ui">{c.currency}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
