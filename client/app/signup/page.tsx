"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus, AlertCircle, BookOpen, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const { signup } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      await signup(fullName.trim(), email.trim(), password, confirmPassword);

      if (redirectTarget === "pending_save") {
        router.push("/?save=true");
      } else {
        router.push(redirectTarget);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <div className="rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-10 shadow-xs">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8DDE8] border border-[#F0E8E2] text-[#292522]">
            <UserPlus className="h-6 w-6 text-[#292522]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#292522]">
            Create Account
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#77716D]">
            Save transcripts permanently, track reading progress, and read distraction-free.
          </p>

          {redirectTarget === "pending_save" && (
            <div className="mt-4 rounded-xl border border-[#F0E8E2] bg-[#FFF1B8]/50 px-3 py-2 text-xs text-[#292522] font-medium">
              Create an account to save your pending transcript into your library.
            </div>
          )}
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#77716D] mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Abdullah Rahman"
              autoComplete="name"
              required
              className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#292522] placeholder:text-[#77716D]/50 focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#77716D] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#292522] placeholder:text-[#77716D]/50 focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#77716D] mb-1.5">
              Password (min. 8 characters)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#292522] placeholder:text-[#77716D]/50 focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#77716D] mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#292522] placeholder:text-[#77716D]/50 focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#E9A9C3] py-2.5 px-4 text-sm font-semibold text-[#292522] hover:bg-[#DE91B1] transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#F0E8E2] text-center text-xs text-[#77716D]">
          Already have an account?{" "}
          <Link
            href={`/login${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
            className="font-semibold text-[#292522] hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#77716D]">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
