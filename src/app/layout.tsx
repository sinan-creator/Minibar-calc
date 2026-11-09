import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import { APP_NAME, BASE_PATH, PUBLIC_URL } from "@/lib/defaults";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: APP_NAME,
  description:
    "Compare the total cost of ownership of Inverter Compressor, Absorption and Thermoelectric (Peltier) hotel minibars and see annual electricity savings and payback.",
  applicationName: APP_NAME,
  // Indexable at the public address: canonical + language variants + share preview. Unset locally (no PUBLIC_URL).
  metadataBase: PUBLIC_URL ? new URL(PUBLIC_URL) : undefined,
  alternates: { canonical: "/", languages: { en: "/?lang=en", tr: "/?lang=tr" } },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Elektromarla",
    title: APP_NAME,
    description: "How much electricity does a hotel minibar really cost? Compare Inverter, Absorption and Thermoelectric minibars over 10 years.",
    images: [{ url: `${BASE_PATH}/icon-512.png`, width: 512, height: 512 }],
  },
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Minibar Savings" },
  icons: {
    icon: [{ url: `${BASE_PATH}/icon-192.png`, type: "image/png", sizes: "192x192" }],
    apple: `${BASE_PATH}/apple-touch-icon.png`,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1f3a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans">
        {children}
        <RegisterServiceWorker />
        <Analytics />
      </body>
    </html>
  );
}
