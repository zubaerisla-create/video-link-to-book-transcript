import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download the Transcriptly Chrome Extension (Bangla Install Guide)",
  description:
    "Download the free Transcriptly Chrome extension and follow the step-by-step Bangla installation guide with illustrations and a tutorial video. Import YouTube transcripts in one click.",
  alternates: {
    canonical: "/extension",
  },
  openGraph: {
    type: "website",
    url: "/extension",
    title: "Download the Transcriptly Chrome Extension | Transcriptly",
    description:
      "Download the free Transcriptly Chrome extension and follow the step-by-step installation guide with illustrations and a tutorial video.",
  },
  twitter: {
    card: "summary",
    title: "Download the Transcriptly Chrome Extension | Transcriptly",
    description:
      "Download the free Transcriptly Chrome extension and follow the step-by-step installation guide.",
  },
};

export default function ExtensionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
