"use client";

import Image from "next/image";
import { COMPANY } from "@/lib/defaults";
import { Button } from "./ui";

export function Header({ onReset, onPrint }: { onReset: () => void; onPrint: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt={`${COMPANY} miniBar`} width={2685} height={729} priority className="h-10 w-auto sm:h-12" />
          <span className="hidden border-l border-line pl-4 text-sm text-slate-ui md:inline">Savings Calculator</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
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
