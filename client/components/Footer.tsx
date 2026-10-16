"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { GithubIcon } from "@/components/GithubIcon";

export function Footer() {
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com";
  const currentYear = 2026;

  return (
    <footer className="mt-auto border-t border-[#F0E8E2] bg-[#FFFDF8] py-8 sm:py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FFF1B8] text-[#292522]">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-sm text-[#292522]">Transcriptly</span>
            </div>
            <p className="text-xs text-[#77716D]">
              Clean YouTube transcripts, readable paragraphs, instant exports.
            </p>
          </div>

          <div className="flex items-center gap-5 text-sm text-[#77716D]">
            <Link href="/" className="hover:text-[#292522] transition-colors">
              Home
            </Link>
            <Link href="/how-it-works" className="hover:text-[#292522] transition-colors">
              How It Works
            </Link>
            <Link href="/about" className="hover:text-[#292522] transition-colors">
              About
            </Link>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-[#292522] transition-colors"
            >
              <GithubIcon className="h-4 w-4" />
              <span>GitHub</span>
            </a>
          </div>
        </div>

        <div className="mt-6 border-t border-[#F0E8E2]/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#77716D]">
          <p>© {currentYear} Transcriptly. Open source and local-first.</p>
          <p>No storage. Video links and transcripts are processed on-demand in client state.</p>
        </div>
      </div>
    </footer>
  );
}
