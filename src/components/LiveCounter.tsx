"use client";

import { useEffect, useState } from "react";
import { DAYS_PER_YEAR } from "@/lib/defaults";
import { formatMoney, formatMoneyExact } from "@/lib/format";

/** Ticking "saved so far today" figure: annual savings spread evenly over the year, accrued since local midnight. */
export function LiveCounter({ annualSavings, currency }: { annualSavings: number; currency: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, []);

  if (annualSavings <= 0 || now === null) return null;

  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const perSecond = annualSavings / (DAYS_PER_YEAR * 86_400);
  const today = perSecond * ((now - midnight.getTime()) / 1000);

  return (
    <div className="mt-6 inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-full bg-mist py-2 pl-3 pr-5 text-sm text-slate-ui">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
      </span>
      <span>
        Saved so far today: <span className="num font-semibold text-navy">{formatMoneyExact(today, currency)}</span>
      </span>
      <span className="num">+{formatMoney(perSecond * 3600, currency, { digits: 2 })} every hour</span>
    </div>
  );
}
