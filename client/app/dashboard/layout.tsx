import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Library",
  description: "Your saved digital transcript books in Transcriptly.",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
