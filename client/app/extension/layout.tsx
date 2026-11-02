import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download the Transcriptly Chrome Extension (Bangla Install Guide)",
  description:
    "Download the free Transcriptly Chrome extension and follow the step-by-step Bangla installation guide with illustrations and a tutorial video. Import YouTube transcripts in one click.",
  alternates: {
    canonical: "/extension",
  },
};

export default function ExtensionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
