import type { Metadata } from "next";
import ExtensionGuidePage from "@/app/extension/page";

export const metadata: Metadata = {
  title: "How to Install and Use the Transcriptly Chrome Extension (Step-by-Step Guide)",
  description:
    "Complete beginner-friendly visual guide with illustrations on how to install and use the Transcriptly Chrome Extension to import clean YouTube transcripts into digital books.",
  alternates: {
    canonical: "/guides/how-to-use-chrome-extension",
  },
};

export default function GuideWrapperPage() {
  return <ExtensionGuidePage />;
}
