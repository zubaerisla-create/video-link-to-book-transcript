"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { GithubIcon } from "@/components/GithubIcon";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <header className="sticky top-0 z-50 w-full border-b border-[#F0E8E2] bg-[#FFFDF8]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#292522] transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-[#F0E8E2] shadow-xs group-hover:scale-105 transition-transform overflow-hidden p-1">
            <Image
              src="/logo.png"
              alt="Transcriptly Logo"
              width={32}
              height={32}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight">Transcriptly</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#F8DDE8] text-[#292522] font-semibold shadow-xs"
                      : "text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="h-5 w-px bg-[#F0E8E2]" />

          {/* User state / Auth buttons */}
          {!isLoading && (
            <div className="flex items-center gap-2">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard"
                    title="Go to Library"
                    className="flex items-center gap-1.5 rounded-xl border border-[#F0E8E2] bg-[#FFF1B8]/50 px-3 py-1.5 text-xs font-semibold text-[#292522] hover:bg-[#FFF1B8] transition-colors shadow-xs"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-[#292522]" />
                    <span>{user.full_name.split(" ")[0]}</span>
                  </Link>
                  <button
                    onClick={() => logout()}
                    title="Log out"
                    className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-xl px-3.5 py-2 text-sm font-medium text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-xl bg-[#E9A9C3] px-4 py-2 text-sm font-semibold text-[#292522] hover:bg-[#DE91B1] transition-colors shadow-xs"
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
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50 transition-colors"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#77716D] hover:text-[#292522] hover:bg-[#F0E8E2]/50 transition-colors"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#F0E8E2] bg-white text-[#292522] shadow-xs hover:bg-[#FFFDF8] transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#F0E8E2] bg-[#FFFDF8] px-4 pt-2 pb-5 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
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

          <div className="h-px w-full bg-[#F0E8E2] my-2" />

          {/* Mobile Auth Actions */}
          {!isLoading && (
            <div className="pt-1">
              {isAuthenticated && user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between rounded-xl border border-[#F0E8E2] bg-[#FFF1B8]/40 px-3.5 py-2">
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-[#292522]" />
                      <span className="text-sm font-semibold text-[#292522]">{user.full_name}</span>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl border border-[#F0E8E2] bg-white py-2.5 text-sm font-medium text-[#292522] hover:bg-[#FFFDF8]"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-xl bg-[#E9A9C3] py-2.5 text-sm font-semibold text-[#292522] hover:bg-[#DE91B1] shadow-xs"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
