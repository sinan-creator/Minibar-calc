"use client";

import { COMPANY } from "@/lib/defaults";
import { Button } from "./ui";

export function Header({ onReset, onPrint }: { onReset: () => void; onPrint: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-semibold tracking-tight text-navy">{COMPANY}</span>
          <span className="hidden text-sm text-slate-ui sm:inline">Minibar Savings Calculator</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button onClick={onPrint} className="hidden sm:inline-flex">
            Print summary
          </Button>
          <Button variant="primary" onClick={onReset}>
            Reset for next customer
          </Button>
        </div>
      </div>
    </header>
  );
}
