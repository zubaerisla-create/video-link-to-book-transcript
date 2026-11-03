import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import Transcript",
  description: "Review and import your staged YouTube transcript from the Transcriptly Chrome extension.",
  alternates: { canonical: "/import" },
  robots: { index: false, follow: false },
};

export default function ImportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
