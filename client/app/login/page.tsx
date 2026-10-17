"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, AlertCircle, ArrowRight, BookOpen, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, forgotPasswordApi } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), password);

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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotError(null);
    setForgotLoading(true);
    try {
      await forgotPasswordApi(forgotEmail.trim());
      setForgotSubmitted(true);
    } catch (err: any) {
      setForgotError(err.message || "Failed to send reset instructions.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-20">
      <div className="rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-10 shadow-xs">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-[#F0E8E2] text-[#292522] shadow-xs p-1.5 overflow-hidden">
            <Image
              src="/logo.png"
              alt="Transcriptly"
              width={48}
              height={48}
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#292522]">
            Welcome Back
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#77716D]">
            Sign in to access your personal transcript library and digital books.
          </p>

          {redirectTarget === "pending_save" && (
            <div className="mt-4 rounded-xl border border-[#F0E8E2] bg-[#F8DDE8]/40 px-3 py-2 text-xs text-[#292522] font-medium">
              Log in to save your pending transcript to your library.
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#77716D]">
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgot(true);
                  setForgotSubmitted(false);
                }}
                className="text-xs text-[#77716D] hover:text-[#292522] underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#292522] placeholder:text-[#77716D]/50 focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#E9A9C3] py-2.5 px-4 text-sm font-semibold text-[#292522] hover:bg-[#DE91B1] transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#F0E8E2] text-center text-xs text-[#77716D]">
          Don&apos;t have an account?{" "}
          <Link
            href={`/signup${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
            className="font-semibold text-[#292522] hover:underline"
          >
            Create one for free
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl border border-[#F0E8E2] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="h-5 w-5 text-[#E9A9C3]" />
              <h3 className="text-base font-bold text-[#292522]">Reset Password</h3>
            </div>
            {forgotSubmitted ? (
              <div>
                <p className="text-xs text-[#77716D] leading-relaxed">
                  If an account is associated with <strong>{forgotEmail}</strong>, password reset instructions have been dispatched.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="mt-4 w-full rounded-xl bg-[#FFF1B8] py-2 text-xs font-semibold text-[#292522] hover:bg-[#F8DDE8]"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-[#77716D]">
                  Enter your email address and we will provide a secure recovery link.
                </p>
                {forgotError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                    {forgotError}
                  </div>
                )}
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={forgotLoading}
                  className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-3 py-2 text-xs text-[#292522] disabled:opacity-60"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    disabled={forgotLoading}
                    className="rounded-xl px-3 py-1.5 text-xs text-[#77716D] disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="rounded-xl bg-[#E9A9C3] px-3.5 py-1.5 text-xs font-semibold text-[#292522] hover:bg-[#DE91B1] disabled:opacity-60 cursor-pointer"
                  >
                    {forgotLoading ? "Sending..." : "Send Instructions"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#77716D]">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
