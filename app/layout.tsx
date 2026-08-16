import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "FindAI — Discover places, instantly",
    template: "%s | FindAI",
  },
  description:
    "Search millions of businesses worldwide by what you actually need. FindAI understands plain language, location, price, and hours.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "FindAI — Discover places, instantly",
    description: "Search millions of businesses worldwide by what you actually need.",
    url: baseUrl,
    siteName: "FindAI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FindAI — Discover places, instantly",
    description: "Search millions of businesses worldwide by what you actually need.",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-atlas font-sans">
        {children}
      </body>
    </html>
  );
}