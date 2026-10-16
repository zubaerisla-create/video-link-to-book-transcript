"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { GithubIcon } from "@/components/GithubIcon";

export function Footer() {
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/zubaerisla-create";
  const currentYear = 2026;

  return (
    <footer className="mt-auto border-t border-[#F0E8E2] bg-[#FFFDF8] pt-12 pb-8 sm:pt-16 sm:pb-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Main Footer Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="sm:col-span-2 md:col-span-1 space-y-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522]">
                <FileText className="h-4 w-4" />
              </div>
              <span className="font-bold text-base text-[#292522]">Transcriptly</span>
            </Link>
            <p className="text-xs text-[#77716D] leading-relaxed">
              Transform messy YouTube captions into clean, readable text paragraphs, bilingual translations, and personal digital books.
            </p>
            <div className="pt-1">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#77716D] hover:text-[#292522] transition-colors"
              >
                <GithubIcon className="h-4 w-4" />
                <span>GitHub Repository</span>
              </a>
            </div>
          </div>

          {/* Product Col */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#292522]">
              Product & Features
            </h3>
            <ul className="space-y-2 text-xs text-[#77716D]">
              <li>
                <Link href="/" className="hover:text-[#292522] transition-colors">
                  Transcript Extractor
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-[#292522] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/guides" className="hover:text-[#292522] transition-colors">
                  Guides & Tutorials
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#292522] transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Guides Col */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#292522]">
              Popular Guides
            </h3>
            <ul className="space-y-2 text-xs text-[#77716D]">
              <li>
                <Link href="/guides/how-to-get-transcript-from-youtube" className="hover:text-[#292522] transition-colors">
                  Get YouTube Transcript
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-copy-and-save-youtube-captions" className="hover:text-[#292522] transition-colors">
                  Copy & Format Captions
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-fix-missing-unavailable-captions" className="hover:text-[#292522] transition-colors">
                  Fix Missing Captions
                </Link>
              </li>
              <li>
                <Link href="/guides/how-to-use-transcripts-for-studying-research" className="hover:text-[#292522] transition-colors">
                  Transcripts for Studying
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Legal Col */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#292522]">
              Trust & Compliance
            </h3>
            <ul className="space-y-2 text-xs text-[#77716D]">
              <li>
                <Link href="/about" className="hover:text-[#292522] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#292522] transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#292522] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#292522] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/copyright" className="hover:text-[#292522] transition-colors">
                  Copyright & DMCA
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer & Bottom Bar */}
        <div className="border-t border-[#F0E8E2] pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#77716D] text-center md:text-left">
          <p>© {currentYear} Transcriptly. All rights reserved.</p>
          <p className="max-w-xl text-[11px] leading-relaxed">
            Guest requests are processed strictly in-memory. Personal library persistence is available for registered users. Transcriptly is not affiliated with or endorsed by YouTube.
          </p>
        </div>
      </div>
    </footer>
  );
}
