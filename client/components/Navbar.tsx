"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";
import { GithubIcon } from "@/components/GithubIcon";

export function Navbar() {
  const pathname = usePathname();
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#F0E8E2] bg-[#FFFDF8]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Minimal text logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-lg font-semibold tracking-tight text-[#292522] transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522] shadow-xs group-hover:bg-[#F8DDE8] transition-colors">
            <FileText className="h-4 w-4" />
          </div>
          <span className="font-semibold text-base sm:text-lg">Transcriptly</span>
        </Link>

        {/* Navigation links & GitHub */}
        <div className="flex items-center gap-1 sm:gap-4">
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#F8DDE8] text-[#292522]"
                      : "text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="h-4 w-px bg-[#F0E8E2] mx-1" />

          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50 transition-colors"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
