import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the Transcriptly team for support, feature requests, bug reports, and copyright or DMCA inquiries.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    type: "website",
    url: "/contact",
    title: "Contact Us | Transcriptly",
    description:
      "Get in touch with the Transcriptly team for support, feature requests, bug reports, and copyright or DMCA inquiries.",
  },
  twitter: {
    card: "summary",
    title: "Contact Us | Transcriptly",
    description:
      "Get in touch with the Transcriptly team for support, feature requests, bug reports, and copyright or DMCA inquiries.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
