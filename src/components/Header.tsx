"use client";

import Image from "next/image";
import { COMPANY } from "@/lib/defaults";
import { Button } from "./ui";

export function Header({ onReset, onPrint, onShare }: { onReset: () => void; onPrint: () => void; onShare: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt={`${COMPANY} miniBar`} width={2685} height={729} priority className="h-10 w-auto sm:h-12" />
          <span className="hidden border-l border-line pl-4 text-sm text-slate-ui md:inline">Savings Calculator</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button onClick={onShare} aria-label="Share as QR code">
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="3" width="5" height="5" rx="1" />
              <rect x="12" y="3" width="5" height="5" rx="1" />
              <rect x="3" y="12" width="5" height="5" rx="1" />
              <path d="M12 12h2v2h-2zM15 15h2v2h-2zM15 12h2M12 15v2" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">QR</span>
          </Button>
          <div className="hidden md:block">
            <Button onClick={onPrint}>Print summary</Button>
          </div>
          <Button variant="primary" onClick={onReset}>
            <span className="sm:hidden">Reset</span>
            <span className="hidden sm:inline">Reset for next customer</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
