import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Vocabulary Dictionary",
  description: "Review and manage your saved vocabulary words in Transcriptly.",
  alternates: { canonical: "/dictionary" },
  robots: { index: false, follow: false },
};

export default function DictionaryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
