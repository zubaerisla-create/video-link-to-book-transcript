import type { Metadata } from "next";
import Link from "next/link";
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the Terms of Service governing your use of Transcriptly, including permitted use, intellectual property respect, account responsibilities, and service disclaimers.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = "October 16, 2026";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center rounded-full bg-[#FFF1B8] px-3.5 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <span>User Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#292522]">
          Terms of Service
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-[#77716D]">
          Last Updated: {lastUpdated} • Please read carefully before using Transcriptly
        </p>
      </div>

      <div className="rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-10 shadow-xs space-y-8 text-sm sm:text-base text-[#77716D] leading-relaxed">
        {/* Acceptance of Terms */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">1. Acceptance of Terms</h2>
          <p>
            Welcome to <strong>Transcriptly</strong> (&ldquo;Service&rdquo;, &ldquo;Website&rdquo;, &ldquo;we&rdquo;, or &ldquo;us&rdquo;). By accessing our website, extracting transcripts, registering an account, or saving digital books, you acknowledge that you have read, understood, and agreed to be bound by these Terms of Service (&ldquo;Terms&rdquo;) and our <Link href="/privacy" className="text-[#292522] underline font-medium hover:text-[#E9A9C3]">Privacy Policy</Link>.
          </p>
          <p>
            If you do not agree with any part of these Terms, you must discontinue your use of Transcriptly immediately.
          </p>
        </section>

        {/* Description of Service */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">2. Description of the Service</h2>
          <p>
            Transcriptly provides an online utility designed to:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
            <li>Extract publicly accessible closed captions and subtitles from YouTube video URLs provided by the user.</li>
            <li>Reassemble fragmented subtitle snippets into readable, coherent text paragraphs with natural punctuation.</li>
            <li>Provide aligned bilingual and translated views for educational, research, and accessibility purposes.</li>
            <li>Enable registered users to save transcripts as digital books in their private library and read them page-by-page.</li>
            <li>Export transcript data in standard formats (TXT, JSON, SRT, and PDF).</li>
          </ul>
        </section>

        {/* Intellectual Property and YouTube Content */}
        <section className="space-y-3 rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <ShieldCheck className="h-5 w-5 text-[#292522]" />
            <h2>3. Intellectual Property Rights & Creator Content</h2>
          </div>
          <p>
            Transcriptly does not claim ownership of any video content, speech, or captions extracted through the tool:
          </p>
          <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm">
            <li>
              <strong>Video Creator Ownership:</strong> All copyright, trademarks, intellectual property, and moral rights in the source video, audio, and underlying caption texts remain solely with the respective YouTube content creators, copyright holders, and licensors.
            </li>
            <li>
              <strong>Fair Use & Personal Purpose:</strong> Transcripts extracted via Transcriptly are provided for personal study, academic reference, research, citation, and accessibility. You are solely responsible for ensuring that your downstream use of any transcript complies with applicable copyright laws and the doctrine of Fair Use.
            </li>
            <li>
              <strong>Content Removal:</strong> If you are a copyright owner or YouTube creator and wish to request removal or exclusion of transcripts derived from your videos, please visit our <Link href="/copyright" className="text-[#292522] underline font-semibold hover:text-[#E9A9C3]">Copyright & Removal Policy</Link>.
            </li>
          </ul>
        </section>

        {/* Acceptable Use Policy */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">4. Acceptable Use and Restrictions</h2>
          <p>
            When utilizing Transcriptly, you agree that you will not:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
            <li>Use the Service to violate any applicable local, national, or international law or regulation.</li>
            <li>Attempt to bypass rate limits, server security controls, or authentication mechanisms.</li>
            <li>Engage in automated scraping or denial-of-service (DoS) attacks that overburden our infrastructure.</li>
            <li>Submit malicious URLs or attempt to inject harmful code into our parsing or database engines.</li>
            <li>Use transcripts to harass, defame, misrepresent, or infringe upon the rights of third parties.</li>
          </ul>
        </section>

        {/* User Accounts and Security */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">5. User Accounts and Library Security</h2>
          <p>
            To use the personal digital library and reader features, you may register an account:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
            <li>You agree to provide accurate, current, and complete information during registration.</li>
            <li>You are responsible for safeguarding your login credentials and maintaining the confidentiality of your password.</li>
            <li>You are responsible for all activities that occur under your account.</li>
            <li>We reserve the right to suspend or terminate accounts that violate our Acceptable Use policies or engage in abusive automated queries.</li>
          </ul>
        </section>

        {/* Disclaimers of Warranties */}
        <section className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-base font-bold text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
            <h2>6. Disclaimer of Warranties</h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
            Transcriptly is provided on an <strong>&ldquo;AS IS&rdquo;</strong> and <strong>&ldquo;AS AVAILABLE&rdquo;</strong> basis without warranties of any kind, whether express or implied.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-amber-950">
            <li>We do not guarantee that every YouTube video will have accessible captions, as caption availability depends on creator permissions and YouTube settings.</li>
            <li>Auto-generated captions and automated translations may contain inaccuracies, phonetic misinterpretations, or grammatical errors inherent to speech recognition systems.</li>
            <li>We do not warrant uninterrupted, error-free, or entirely bug-free operation of our servers or external API integrations.</li>
          </ul>
        </section>

        {/* Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Transcriptly, its operators, and contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill arising out of or related to your use of or inability to use the Service.
          </p>
        </section>

        {/* Third-Party Links & Advertisements */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">8. Third-Party Links and Advertising</h2>
          <p>
            Our Service may contain links to third-party websites (such as YouTube and GitHub) or display third-party advertisements (such as Google AdSense). We do not control or endorse the content, policies, or practices of any third-party websites or advertisers, and you access them at your own risk.
          </p>
        </section>

        {/* Governing Law and Modifications */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. When updates are published, the revised date at the top will be updated. Your continued use of the Website after modifications constitutes acceptance of the new Terms.
          </p>
        </section>

        {/* Contact */}
        <section className="space-y-3 pt-4 border-t border-[#F0E8E2]">
          <h2 className="text-xl font-bold text-[#292522]">10. Contact Information</h2>
          <p>
            If you have questions or inquiries regarding these Terms of Service, please reach out via our <Link href="/contact" className="text-[#292522] underline font-semibold hover:text-[#E9A9C3]">Contact Page</Link> or email us at <strong className="text-[#292522]">legal@transcriptly.net</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
