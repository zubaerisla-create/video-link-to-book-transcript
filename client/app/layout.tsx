import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

import { ADSENSE_CLIENT_ID } from "@/lib/adsense";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://habd.tech";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Transcriptly | Turn YouTube Videos Into Readable Transcripts & Digital Books",
    template: "%s | Transcriptly",
  },
  description:
    "Extract clean captions from any YouTube video in Bangla, English, and other languages. Formats captions into readable paragraphs, provides side-by-side translation, and saves transcripts as digital books.",
  keywords: [
    "youtube transcript",
    "youtube subtitles extractor",
    "youtube to text",
    "bangla youtube transcript",
    "digital book reader",
    "caption generator",
    "video to text converter",
    "youtube caption download",
  ],
  authors: [{ name: "Transcriptly Team" }],
  creator: "Transcriptly",
  publisher: "Transcriptly",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Transcriptly",
    title: "Transcriptly | YouTube Video URL to Readable Transcript & Digital Books",
    description:
      "Transform messy, fragmented YouTube subtitles into clean, readable paragraphs with multilingual support, translation, and personal library saving.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transcriptly | YouTube Video to Transcript Tool",
    description:
      "Extract clean captions from YouTube videos into readable paragraphs, timestamped SRT, and personal digital books.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "64x64" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  other: {
    "google-adsense-account": ADSENSE_CLIENT_ID,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <meta name="google-adsense-account" content={ADSENSE_CLIENT_ID} />
        <Script
          id="google-adsense-script"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FFFDF8] text-[#292522]">
        <AuthProvider>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
