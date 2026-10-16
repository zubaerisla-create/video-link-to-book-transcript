"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, BookOpen, LogOut, User as UserIcon } from "lucide-react";
import { GithubIcon } from "@/components/GithubIcon";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/zubaerisla-create";

  const navLinks = [
    { href: "/", label: "Home" },
    ...(isAuthenticated ? [{ href: "/dashboard", label: "My Library" }] : []),
    { href: "/how-it-works", label: "How It Works" },
    { href: "/guides", label: "Guides" },
    { href: "/faq", label: "FAQ" },
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

        {/* Navigation links & Auth */}
        <div className="flex items-center gap-1 sm:gap-3">
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#F8DDE8] text-[#292522] font-semibold"
                      : "text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="h-4 w-px bg-[#F0E8E2] mx-1" />

          {/* User state / Auth buttons */}
          {!isLoading && (
            <div className="flex items-center gap-1.5">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    title="Go to Library"
                    className="flex items-center gap-1.5 rounded-lg border border-[#F0E8E2] bg-[#FFF1B8]/40 px-2.5 py-1 text-xs font-medium text-[#292522] hover:bg-[#FFF1B8] transition-colors"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-[#77716D]" />
                    <span className="hidden sm:inline font-semibold">{user.full_name.split(" ")[0]}</span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    title="Log out"
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/login"
                    className="rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-[#E9A9C3] px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#292522] hover:bg-[#DE91B1] transition-colors shadow-xs"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}

          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50 transition-colors"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
