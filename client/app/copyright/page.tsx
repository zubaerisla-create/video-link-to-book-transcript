import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, FileText, CheckCircle2, AlertOctagon, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Copyright Policy & Content Removal",
  description:
    "Review Transcriptly's Copyright Policy, Fair Use guidelines, and the procedure for creators and copyright owners to request content exclusion or removal.",
  alternates: {
    canonical: "/copyright",
  },
};

export default function CopyrightPolicyPage() {
  const lastUpdated = "October 16, 2026";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center rounded-full bg-[#FFF1B8] px-3.5 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <span>Intellectual Property</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#292522]">
          Copyright & Content Removal Policy
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-[#77716D]">
          Last Updated: {lastUpdated} • Digital Millennium Copyright Act (DMCA) Notice & Procedure
        </p>
      </div>

      <div className="rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-10 shadow-xs space-y-8 text-sm sm:text-base text-[#77716D] leading-relaxed">
        {/* Policy Statement */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">1. Respect for Intellectual Property</h2>
          <p>
            <strong>Transcriptly</strong> respects the intellectual property rights of content creators, video producers, publishers, and rights holders. We expect all users of our Service to respect these rights in full accordance with copyright laws.
          </p>
          <p>
            Transcriptly is a technical utility that retrieves public closed-caption tracks and auto-generated subtitle streams made publicly available by creators on YouTube. Transcriptly:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
            <li><strong>Does not host, store, or stream YouTube video or audio files.</strong></li>
            <li><strong>Does not bypass access controls, DRM, paywalls, or privacy settings.</strong></li>
            <li><strong>Does not claim ownership or copyright over any spoken words, subtitles, or captions extracted via the Service.</strong></li>
          </ul>
        </section>

        {/* Fair Use & Educational Reference */}
        <section className="space-y-3 rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <FileText className="h-5 w-5 text-[#292522]" />
            <h2>2. Fair Use and Educational Purpose</h2>
          </div>
          <p>
            Transcripts generated through Transcriptly are intended for transformative, personal, and fair use purposes, such as:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
            <li>Academic study, lecture note-taking, and research citations.</li>
            <li>Accessibility assistance for hearing-impaired individuals and non-native language speakers.</li>
            <li>Searchability and textual indexing of spoken educational content.</li>
          </ul>
          <p className="text-xs sm:text-sm pt-1">
            Users who reproduce, publish, or redistribute extracted transcripts are solely responsible for ensuring that their downstream use complies with the Fair Use provisions of copyright law (17 U.S.C. § 107) and international intellectual property treaties.
          </p>
        </section>

        {/* Notice and Takedown Procedure */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <AlertOctagon className="h-5 w-5 text-[#292522]" />
            <h2>3. Content Removal and DMCA Notice Procedure</h2>
          </div>
          <p>
            If you are a copyright owner, video creator, or authorized agent and believe that content accessible through Transcriptly infringes upon your copyright, or if you wish to exclude your YouTube channel or specific videos from transcript processing, you may submit a formal notification.
          </p>
          <p>
            To expedite your request, please include the following details:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm">
            <li>
              <strong>Identification of Copyrighted Work:</strong> A clear description of the copyrighted video or work claimed to have been infringed, including the direct YouTube video URL(s).
            </li>
            <li>
              <strong>Proof of Authority:</strong> Evidence demonstrating that you are the creator, copyright owner, or authorized representative of the copyright owner.
            </li>
            <li>
              <strong>Contact Information:</strong> Your full name, mailing address, telephone number, and an active email address where we can contact you.
            </li>
            <li>
              <strong>Statement of Good Faith:</strong> A statement that you have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
            </li>
            <li>
              <strong>Accuracy Statement & Signature:</strong> A statement that the information in the notification is accurate under penalty of perjury, accompanied by your physical or electronic signature.
            </li>
          </ol>
        </section>

        {/* Submission Method & Video Blacklisting */}
        <section className="space-y-3 rounded-2xl border border-[#FFF1B8] bg-[#FFF1B8]/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <Mail className="h-5 w-5 text-[#292522]" />
            <h2>4. Submitting Your Notice & Video Blacklisting</h2>
          </div>
          <p className="text-xs sm:text-sm">
            Send your notification to our designated copyright contact:
          </p>
          <div className="rounded-xl border border-[#F0E8E2] bg-white p-4 font-mono text-xs text-[#292522] space-y-1">
            <p><strong>Email:</strong> copyright@transcriptly.net</p>
            <p><strong>Subject:</strong> DMCA / Content Removal Notice - [Your Channel or Video ID]</p>
            <p><strong>Web Form:</strong> <Link href="/contact" className="underline font-sans font-semibold text-[#292522] hover:text-[#E9A9C3]">Contact Form (Topic: Copyright & DMCA)</Link></p>
          </div>
          <p className="text-xs sm:text-sm pt-2">
            Upon receipt of a valid and verified notification, Transcriptly will promptly take appropriate action, which may include blocking transcript generation for the designated video ID(s) and purging any associated digital book records from our platform within <strong>24 to 48 hours</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
