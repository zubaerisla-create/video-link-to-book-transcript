import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, Cookie, Eye, Trash2, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Transcriptly collects, processes, and protects your data, including our ephemeral processing model, personal library storage, and Google AdSense cookie disclosures.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 16, 2026";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center rounded-full bg-[#FFF1B8] px-3.5 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <span>Legal & Transparency</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#292522]">
          Privacy Policy
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-[#77716D]">
          Last Updated: {lastUpdated} • Effective immediately
        </p>
      </div>

      <div className="rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-10 shadow-xs space-y-8 text-sm sm:text-base text-[#77716D] leading-relaxed">
        {/* Introduction */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">1. Introduction</h2>
          <p>
            At <strong>Transcriptly</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), we believe in privacy by design, transparent data handling, and user control. This Privacy Policy details how we handle information when you visit our website, use our YouTube video transcript extraction tool, create an account, or read saved digital books.
          </p>
          <p>
            By using Transcriptly, you agree to the collection and use of information in accordance with this policy. If you have any questions or concerns, you can contact us at any time through our <Link href="/contact" className="text-[#292522] underline font-medium hover:text-[#E9A9C3]">Contact Page</Link>.
          </p>
        </section>

        {/* Guest vs Registered Data Handling */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#292522]">2. How We Handle Your Data</h2>
          <p>
            We operate under two distinct modes depending on whether you are using Transcriptly as a guest visitor or as a registered account holder:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-5">
              <div className="flex items-center gap-2 mb-2 font-bold text-[#292522]">
                <Eye className="h-5 w-5 text-[#292522]" />
                <span>Guest Visitors (Default)</span>
              </div>
              <ul className="text-xs sm:text-sm space-y-2 list-disc list-inside">
                <li><strong>Ephemeral Processing:</strong> YouTube URLs you submit are processed on-demand in temporary server memory solely to fetch publicly available caption tracks.</li>
                <li><strong>No Database Storage:</strong> Neither the video URL, the video title, nor the extracted transcript text is stored in our database for guest users.</li>
                <li><strong>Client-Side State:</strong> Transcripts are delivered directly to your web browser session and are cleared when you refresh or close the tab.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-5">
              <div className="flex items-center gap-2 mb-2 font-bold text-[#292522]">
                <Lock className="h-5 w-5 text-[#292522]" />
                <span>Registered Account Holders</span>
              </div>
              <ul className="text-xs sm:text-sm space-y-2 list-disc list-inside">
                <li><strong>Account Credentials:</strong> When you register, we store your full name, email address, and a securely salted and hashed password (using industry-standard bcrypt).</li>
                <li><strong>Personal Digital Library:</strong> Only transcripts you explicitly choose to save (&ldquo;Save to My Library&rdquo;) are saved to our persistent database on our secure VPS.</li>
                <li><strong>Private Access:</strong> Your saved books, bookmarks, and reading progress are strictly private and accessible only by logging into your authenticated account.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Third-Party Services & YouTube */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">3. YouTube Data and Third-Party Media</h2>
          <p>
            Transcriptly retrieves publicly accessible closed-caption tracks and video metadata (such as video title, channel author, and thumbnail) provided by YouTube creators.
          </p>
          <p>
            When you enter a YouTube link, our backend communicates with YouTube servers to inspect available subtitle streams. We do not download the full video files, bypass YouTube paywalls, access private or unlisted restricted videos, or circumvent digital rights management (DRM). Use of YouTube services is subject to the <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer" className="text-[#292522] underline font-medium hover:text-[#E9A9C3]">YouTube Terms of Service</a> and <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#292522] underline font-medium hover:text-[#E9A9C3]">Google Privacy Policy</a>.
          </p>
        </section>

        {/* Advertising & Google AdSense Disclosures */}
        <section className="space-y-3 rounded-2xl border border-[#FFF1B8] bg-[#FFF1B8]/20 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <Cookie className="h-5 w-5 text-[#292522]" />
            <h2>4. Advertising and Google AdSense Disclosures</h2>
          </div>
          <p>
            To keep Transcriptly free and maintain our servers, we may display third-party advertisements served by <strong>Google AdSense</strong>. Google AdSense requires us to disclose the following information regarding advertising cookies and tracking:
          </p>
          <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm">
            <li>
              <strong>Third-Party Vendor Cookies:</strong> Third-party vendors, including Google, use cookies (such as the DoubleClick cookie) to serve advertisements based on a user&apos;s prior visits to this website or other websites across the Internet.
            </li>
            <li>
              <strong>Personalized Advertising:</strong> Google&apos;s use of advertising cookies enables it and its partners to serve personalized ads to our users based on their visits to Transcriptly and other websites.
            </li>
            <li>
              <strong>Opting Out of Personalized Ads:</strong> Users may opt out of personalized advertising by visiting Google&apos;s <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-[#292522] underline font-semibold hover:text-[#E9A9C3]">Google Ads Settings</a>.
            </li>
            <li>
              <strong>Opting Out via Third-Party Tools:</strong> Alternatively, you can opt out of a third-party vendor&apos;s use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-[#292522] underline font-semibold hover:text-[#E9A9C3]">aboutads.info</a> or <a href="https://www.youronlinechoices.com" target="_blank" rel="noopener noreferrer" className="text-[#292522] underline font-semibold hover:text-[#E9A9C3]">Your Online Choices</a>.
            </li>
          </ul>
        </section>

        {/* Cookies & Browser Storage */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">5. Cookies and Local Browser Storage</h2>
          <p>
            We use essential cookies and browser storage technologies strictly necessary for website functionality:
          </p>
          <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm">
            <li><strong>Session Authentication Cookie:</strong> When you log in, an HttpOnly cookie or secure authentication token is maintained so you remain logged in during your session.</li>
            <li><strong>Local Storage (Preferences):</strong> Your reading preferences in the digital book reader (font size, reading theme such as light, sepia, or dark, continuous scroll vs page-by-page) are stored in your device&apos;s local storage.</li>
            <li><strong>Pending Save Session:</strong> If you are not logged in and choose to save a transcript, the pending transcript is temporarily held in your browser&apos;s session storage until you complete authentication.</li>
          </ul>
        </section>

        {/* Data Security & VPS Infrastructure */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">6. Data Security and Infrastructure</h2>
          <p>
            We implement appropriate administrative, technical, and physical security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
            <li>All network communication is encrypted over HTTPS using modern TLS protocols.</li>
            <li>User passwords are never stored in plain text and are salted and hashed with bcrypt.</li>
            <li>The database is hosted internally on our virtual private server (VPS) behind a firewall, with internal database ports bound strictly to localhost.</li>
            <li>Database operations enforce strict user ownership validation to prevent unauthorized book access.</li>
          </ul>
        </section>

        {/* User Rights & Deletion */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <Trash2 className="h-5 w-5 text-[#292522]" />
            <h2>7. Your Data Rights & Deletion</h2>
          </div>
          <p>
            You have full ownership and control over your data:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm">
            <li><strong>Access & Export:</strong> You can export any transcript or saved digital book at any time in TXT, JSON, SRT, or PDF format directly from your library.</li>
            <li><strong>Deletion of Saved Books:</strong> You can delete any saved book from your library with a single click in your dashboard. This permanently purges the record from our database.</li>
            <li><strong>Account Erasure:</strong> If you wish to delete your entire account and all associated saved transcripts, you may contact us via our <Link href="/contact" className="text-[#292522] underline font-medium hover:text-[#E9A9C3]">Contact Page</Link>, and we will process your deletion request within 48 hours.</li>
          </ul>
        </section>

        {/* Changes to this Policy */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#292522]">8. Updates to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy periodically to reflect enhancements in our services, infrastructure upgrades, or changes in legal regulations. When changes occur, the &ldquo;Last Updated&rdquo; date at the top of this page will be revised. We encourage you to review this policy periodically.
          </p>
        </section>

        {/* Contact Us */}
        <section className="space-y-3 pt-4 border-t border-[#F0E8E2]">
          <div className="flex items-center gap-2 text-base font-bold text-[#292522]">
            <Mail className="h-5 w-5 text-[#292522]" />
            <h2>9. How to Contact Us</h2>
          </div>
          <p>
            If you have questions, feedback, or data privacy requests concerning this Privacy Policy, please reach out through our dedicated <Link href="/contact" className="text-[#292522] underline font-semibold hover:text-[#E9A9C3]">Contact Page</Link> or send an email to <strong className="text-[#292522]">privacy@transcriptly.net</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
