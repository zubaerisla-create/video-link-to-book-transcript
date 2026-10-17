"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Zap,
  Activity,
  ShieldAlert,
  Menu,
  X,
  ExternalLink,
  Shield,
  ArrowLeft,
  LogOut,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = !!(user?.is_admin || user?.role === "admin");

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/analytics", label: "Visitors & Traffic", icon: BarChart3 },
    { href: "/admin/users", label: "User Management", icon: Users },
    { href: "/admin/features", label: "Transcript Usage", icon: Zap },
    { href: "/admin/health", label: "System Health", icon: Activity },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: ShieldAlert },
  ];

  // 1. Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#FFFDF8]">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#292522] border-t-transparent mx-auto mb-4" />
          <p className="text-sm font-medium text-[#77716D]">Verifying administrative permissions...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 bg-[#FFFDF8]">
        <div className="max-w-md w-full rounded-3xl border border-[#F0E8E2] bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF1B8] text-[#292522] mb-4">
            <Shield className="h-7 w-7 text-[#292522]" />
          </div>
          <h2 className="text-xl font-bold text-[#292522]">Authentication Required</h2>
          <p className="mt-2 text-sm text-[#77716D]">
            Please sign in with your administrator account to access the Transcriptly admin dashboard.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(pathname)}`)}
              className="w-full rounded-2xl bg-[#292522] py-3 text-sm font-bold text-white hover:bg-[#1a1715] transition-colors"
            >
              Sign In to Continue
            </button>
            <Link
              href="/"
              className="w-full rounded-2xl border border-[#E8DACB] py-3 text-sm font-semibold text-[#292522] hover:bg-[#FAF4EC] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated but not an administrator (403 Forbidden)
  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 bg-[#FFFDF8]">
        <div className="max-w-md w-full rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-[#292522]">Access Restricted (403)</h2>
          <p className="mt-2 text-sm text-[#77716D]">
            Your account (<strong className="text-[#292522]">{user?.email}</strong>) does not have administrative privileges.
            Sensitive administrative tools are strictly restricted to authorized team members.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/dashboard"
              className="w-full rounded-2xl bg-[#292522] py-3 text-sm font-bold text-white hover:bg-[#1a1715] transition-colors"
            >
              Go to My Library
            </Link>
            <Link
              href="/"
              className="w-full rounded-2xl border border-[#E8DACB] py-3 text-sm font-semibold text-[#292522] hover:bg-[#FAF4EC] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Admin Shell
  return (
    <div className="min-h-screen bg-[#FAF4EC]/40 text-[#292522] flex flex-col md:flex-row">
      {/* Mobile Top Navigation Header */}
      <div className="md:hidden flex items-center justify-between border-b border-[#F0E8E2] bg-white px-4 py-3 sticky top-16 z-30">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#292522] text-[#FFF1B8] font-bold text-xs">
            🛡️
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#292522]">Transcriptly Admin</h1>
            <p className="text-[10px] text-[#77716D]">Portal & Telemetry</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-xl border border-[#E8DACB] p-2 text-[#292522] hover:bg-[#FAF4EC]"
          aria-label="Toggle Navigation"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-16 inset-y-0 left-0 z-40 w-64 shrink-0 bg-white border-r border-[#F0E8E2] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 h-[calc(100vh-4rem)] overflow-y-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 sm:p-5">
          {/* Admin Header Badge */}
          <div className="hidden md:flex items-center gap-3 pb-5 mb-5 border-b border-[#F0E8E2]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#292522] text-[#FFF1B8] font-bold text-sm shadow-xs">
              🛡️
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#292522] leading-tight">Admin Console</h2>
              <span className="inline-block mt-0.5 rounded-md bg-[#FFF1B8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#292522]">
                Staff Only
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-[#292522] text-white shadow-xs"
                      : "text-[#77716D] hover:bg-[#FAF4EC] hover:text-[#292522]"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#FFF1B8]" : "text-[#77716D]"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Footer */}
        <div className="p-4 border-t border-[#F0E8E2] bg-[#FFFDF8]/50 space-y-2">
          <div className="px-2 py-1">
            <p className="text-[11px] font-bold text-[#292522] truncate">{user?.full_name}</p>
            <p className="text-[10px] text-[#77716D] truncate">{user?.email}</p>
          </div>

          <div className="pt-2 border-t border-[#F0E8E2]/60 flex flex-col gap-1">
            <Link
              href="/"
              className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium text-[#77716D] hover:text-[#292522] hover:bg-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Exit Admin</span>
              </span>
              <ExternalLink className="h-3 w-3 text-[#A8A29E]" />
            </Link>

            <button
              onClick={() => logout()}
              className="flex items-center gap-2 w-full text-left rounded-xl px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
