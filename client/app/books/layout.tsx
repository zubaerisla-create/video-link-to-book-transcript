import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digital Book Reader",
  description: "Read saved transcripts in the Transcriptly digital book reader.",
  robots: { index: false, follow: false },
};

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
