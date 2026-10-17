"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, CheckCircle2, AlertCircle, ArrowRight, Lock } from "lucide-react";
import { resetPasswordApi, ApiError } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("Missing or invalid password reset link. Please request a new one.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      await resetPasswordApi({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || "Failed to reset password. The link may have expired.");
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
            Set New Password
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#77716D]">
            Please enter and confirm your new secure password.
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-[#292522]">Password Reset Complete</h2>
            <p className="text-xs text-[#77716D] leading-relaxed">
              Your password has been successfully updated. You can now log in using your new credentials.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#292522] py-2.5 px-4 text-sm font-semibold text-white hover:bg-[#1a1715] transition-colors"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {!token && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                No reset token found in URL. Please open the link directly from the email you received.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#77716D] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77716D]/60" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] py-2.5 pl-9 pr-3.5 text-sm text-[#292522] placeholder:text-[#77716D]/50 focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#77716D] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77716D]/60" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] py-2.5 pl-9 pr-3.5 text-sm text-[#292522] placeholder:text-[#77716D]/50 focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !token}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#E9A9C3] py-2.5 px-4 text-sm font-semibold text-[#292522] hover:bg-[#DE91B1] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Updating password...</span>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#F0E8E2] text-center text-xs text-[#77716D]">
              Remembered your password?{" "}
              <Link href="/login" className="font-semibold text-[#292522] hover:underline">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#77716D]">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
