"use client";

import Image from "next/image";
import { BASE_PATH, COMPANY } from "@/lib/defaults";
import { LANGS, strings, type Lang } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";
import { Button, Segmented } from "./ui";

interface Props {
  onReset: () => void;
  onPrint: () => void;
  onShare: () => void;
  onLang: (lang: Lang) => void;
}

export function Header({ onReset, onPrint, onShare, onLang }: Props) {
  const { s, lang } = useI18n();
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 sm:py-4">
        <div className="flex flex-col items-start gap-1">
          <Image src={`${BASE_PATH}/logo.png`} alt={`${COMPANY} miniBar`} width={2685} height={729} priority className="h-9 w-auto shrink-0 sm:h-11" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-navy sm:text-xs">{s.tagline}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Segmented<Lang>
            ariaLabel={s.language}
            size="sm"
            value={lang}
            onChange={onLang}
            options={LANGS.map((l) => ({ value: l, label: strings(l).langLabel }))}
          />
          <Button onClick={onShare} aria-label={s.shareQr}>
            <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="3" width="5" height="5" rx="1" />
              <rect x="12" y="3" width="5" height="5" rx="1" />
              <rect x="3" y="12" width="5" height="5" rx="1" />
              <path d="M12 12h2v2h-2zM15 15h2v2h-2zM15 12h2M12 15v2" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">{s.qr}</span>
          </Button>
          <div className="hidden md:block">
            <Button onClick={onPrint}>{s.printSummary}</Button>
          </div>
          <Button variant="primary" onClick={onReset}>
            <span className="sm:hidden">{s.reset}</span>
            <span className="hidden sm:inline">{s.resetForNext}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
