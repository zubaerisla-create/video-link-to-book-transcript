"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Database,
  Cpu,
  RefreshCw,
  ArrowLeft,
  Clock,
  Server,
  Layers,
} from "lucide-react";
import { getAdminSystemHealthApi } from "@/lib/api";
import { AdminSystemHealthResponse } from "@/lib/types";

export default function AdminHealthPage() {
  const [data, setData] = useState<AdminSystemHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminSystemHealthApi();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load system health diagnostics.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#77716D] hover:text-[#292522] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Overview</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#292522]">
            System Health & Diagnostics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#77716D]">
            Database connectivity, operational latency, runtime environment, and error tracking.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-2xl border border-[#E8DACB] bg-white px-3.5 py-2 text-xs font-bold text-[#292522] shadow-2xs hover:bg-[#FAF4EC] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Health</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error loading diagnostics</p>
            <p className="mt-0.5 text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {isLoading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
          <div className="h-32 rounded-3xl bg-neutral-200/60" />
          <div className="h-32 rounded-3xl bg-neutral-200/60" />
          <div className="h-32 rounded-3xl bg-neutral-200/60" />
        </div>
      )}

      {data && (
        <>
          {/* Status Banner */}
          <div className="flex items-center justify-between rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-950">
                  All Core Systems Operational
                </h3>
                <p className="text-xs text-emerald-800">
                  FastAPI service, database connection pool, and first-party analytics ingestion are running normally.
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <Clock className="h-3.5 w-3.5" />
              <span>Checked {new Date(data.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Database Diagnostics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                  Database Latency
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Database className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-[#292522]">
                {data.database.latency_ms} <span className="text-sm font-bold text-[#77716D]">ms</span>
              </div>
              <p className="mt-1 text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Status: {data.database.status}</span>
              </p>
            </div>

            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                  Total Users
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Server className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-[#292522]">
                {data.database.total_users.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-[#77716D]">Registered application accounts</p>
            </div>

            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                  Total Books
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-[#292522]">
                {data.database.total_books.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-[#77716D]">Saved digital transcript books</p>
            </div>

            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                  Analytics Events
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-[#292522]">
                {data.database.total_analytics_events.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-[#77716D]">Privacy-preserving telemetry rows</p>
            </div>
          </div>

          {/* Runtime Environment Info */}
          <div className="rounded-3xl border border-[#F0E8E2] bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#292522] mb-1">Server Runtime Environment</h3>
            <p className="text-xs text-[#77716D] mb-4">Underlying server platform information</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-2xl bg-[#FFFDF8] p-4 border border-[#F0E8E2]">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[#77716D]" />
                  <span className="text-xs font-semibold text-[#77716D]">Python Version</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#292522]">{data.runtime.python_version}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-[#FFFDF8] p-4 border border-[#F0E8E2]">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-[#77716D]" />
                  <span className="text-xs font-semibold text-[#77716D]">Operating System</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#292522]">{data.runtime.os}</span>
              </div>
            </div>
          </div>

          {/* Recent Extraction & Import Failures */}
          <div className="rounded-3xl border border-[#F0E8E2] bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#292522] mb-1">Recent Import Failures</h3>
            <p className="text-xs text-[#77716D] mb-4">Latest reported failed pipeline extractions</p>

            {data.recent_import_failures.length === 0 ? (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>No failed imports reported in recent application history!</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.recent_import_failures.map((err, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-rose-50/40 px-3.5 py-2.5 border border-rose-100 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                      <span className="font-semibold text-rose-900 truncate">{err.reason}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#77716D] shrink-0">
                      {err.page_path && <span className="font-mono">{err.page_path}</span>}
                      <span>{new Date(err.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
