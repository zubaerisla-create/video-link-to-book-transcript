import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Sign up for a free Transcriptly account to save YouTube transcripts as digital books.",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
