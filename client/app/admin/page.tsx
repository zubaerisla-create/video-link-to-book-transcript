"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Eye,
  Activity,
  UserCheck,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Smartphone,
  Globe,
  Clock,
  BookMarked,
  Award,
  Flame,
} from "lucide-react";
import { getAdminOverviewApi } from "@/lib/api";
import { AdminOverviewResponse } from "@/lib/types";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { TimeSeriesChart, BreakdownBarList } from "@/components/admin/ChartComponents";

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [range, setRange] = useState("7d");
  const [fromDate, setFromDate] = useState<string | undefined>();
  const [toDate, setToDate] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(
    async (r: string, f?: string, t?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await getAdminOverviewApi(r, f, t);
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to load admin overview metrics.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOverview(range, fromDate, toDate);
  }, [range, fromDate, toDate, fetchOverview]);

  const handleRangeChange = (newRange: string, f?: string, t?: string) => {
    setRange(newRange);
    setFromDate(f);
    setToDate(t);
  };

  const handleRefresh = () => {
    fetchOverview(range, fromDate, toDate);
  };

  // Helper for KPI delta presentation
  const renderKpiDelta = (deltaPct?: number) => {
    if (deltaPct === undefined || deltaPct === null) return null;
    const isPositive = deltaPct >= 0;
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-bold ${
          isPositive ? "text-emerald-700" : "text-rose-600"
        }`}
      >
        {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        <span>
          {isPositive ? "+" : ""}
          {deltaPct.toFixed(1)}%
        </span>
      </span>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#292522]">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#77716D]">
            Privacy-preserving first-party analytics, audience reach, and platform activity.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <DateRangeFilter
            currentRange={range}
            onRangeChange={handleRangeChange}
            isLoading={isLoading}
          />
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh metrics"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#E8DACB] bg-white text-[#77716D] shadow-2xs hover:bg-[#FAF4EC] hover:text-[#292522] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error loading overview</p>
            <p className="mt-0.5 text-xs text-red-700">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="rounded-lg bg-red-100 px-3 py-1 text-xs font-bold text-red-800 hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-neutral-200/60" />
          ))}
        </div>
      )}

      {/* Main Content when loaded */}
      {data && (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Unique Visitors */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                  Unique Visitors
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-[#292522]">
                  {data.kpis.unique_visitors.value.toLocaleString()}
                </span>
                {renderKpiDelta(data.kpis.unique_visitors.delta_pct)}
              </div>
              <p className="mt-1 text-xs text-[#77716D]">
                {data.kpis.unique_visitors.previous !== undefined ? (
                  <span>vs. {data.kpis.unique_visitors.previous.toLocaleString()} previous period</span>
                ) : (
                  <span>Privacy-pseudonymous cookie</span>
                )}
              </p>
            </div>

            {/* 2. Total Sessions */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                  Sessions
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-[#292522]">
                  {data.kpis.sessions.value.toLocaleString()}
                </span>
                {renderKpiDelta(data.kpis.sessions.delta_pct)}
              </div>
              <p className="mt-1 text-xs text-[#77716D]">
                {data.kpis.sessions.previous !== undefined ? (
                  <span>vs. {data.kpis.sessions.previous.toLocaleString()} previous period</span>
                ) : (
                  <span>30-minute inactivity boundary</span>
                )}
              </p>
            </div>

            {/* 3. Page Views */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                  Page Views
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-[#292522]">
                  {data.kpis.page_views.value.toLocaleString()}
                </span>
                {renderKpiDelta(data.kpis.page_views.delta_pct)}
              </div>
              <p className="mt-1 text-xs text-[#77716D]">
                <span>Deduplicated client & route transitions</span>
              </p>
            </div>

            {/* 4. Total Users & New Signups */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                  Registered Users
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-[#292522]">
                  {data.kpis.total_users.value.toLocaleString()}
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                  +{data.kpis.new_users.value} new
                </span>
              </div>
              <p className="mt-1 text-xs text-[#77716D]">
                <span>{data.kpis.active_users.value} active accounts</span>
              </p>
            </div>

            {/* 5. Books Created */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                  Books Created
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-[#292522]">
                  {data.kpis.books_created.value.toLocaleString()}
                </span>
                {renderKpiDelta(data.kpis.books_created.delta_pct)}
              </div>
              <p className="mt-1 text-xs text-[#77716D]">
                <span>Digital reader books saved in library</span>
              </p>
            </div>

            {/* 6. Import Success Rate */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                  Import Success Rate
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-[#292522]">
                  {data.kpis.import_success_rate.value}%
                </span>
                <span className="text-xs font-semibold text-[#77716D]">
                  {data.kpis.imports_success.value} successes
                </span>
              </div>
              <p className="mt-1 text-xs text-[#77716D]">
                <span>Stage import & direct YouTube extractions</span>
              </p>
            </div>

            {/* 7. Total Reading Time */}
            {data.kpis.reading_time_seconds && (
              <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                    Total Reading Time
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-[#292522]">
                    {formatDuration(data.kpis.reading_time_seconds.value)}
                  </span>
                  {renderKpiDelta(data.kpis.reading_time_seconds.delta_pct)}
                </div>
                <p className="mt-1 text-xs text-[#77716D]">
                  {data.kpis.active_readers && data.kpis.active_readers.value > 0 ? (
                    <span>
                      {data.kpis.active_readers.value} active readers (avg{" "}
                      {formatDuration(data.kpis.avg_reading_time_seconds?.value)})
                    </span>
                  ) : (
                    <span>Verified active reader heartbeats</span>
                  )}
                </p>
              </div>
            )}

            {/* 8. Reading Sessions */}
            {data.kpis.reading_sessions && (
              <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                    Reading Sessions
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <BookMarked className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-[#292522]">
                    {data.kpis.reading_sessions.value.toLocaleString()}
                  </span>
                  {renderKpiDelta(data.kpis.reading_sessions.delta_pct)}
                </div>
                <p className="mt-1 text-xs text-[#77716D]">
                  <span>Tracked reading reader sessions</span>
                </p>
              </div>
            )}

            {/* 9. Vocabulary Saved */}
            {data.kpis.total_vocab_saved && (
              <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                    Vocabulary Saved
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                    <Award className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-black text-[#292522]">
                    {data.kpis.total_vocab_saved.value.toLocaleString()}
                  </span>
                  {data.kpis.vocab_saved_in_range && (
                    <span className="inline-flex items-center rounded-full bg-pink-50 px-2 py-0.5 text-xs font-bold text-pink-700">
                      +{data.kpis.vocab_saved_in_range.value} in period
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[#77716D]">
                  <span>English-Bangla personal dictionary entries</span>
                </p>
              </div>
            )}
          </div>

          {/* Time Series Trend Chart */}
          <TimeSeriesChart
            data={data.time_series}
            title="Audience & Activity Trends"
            subtitle={`Showing daily metrics from ${data.start_date.slice(0, 10)} to ${data.end_date.slice(0, 10)}`}
            series={[
              { key: "page_views", label: "Page Views", color: "#8B5CF6" },
              { key: "unique_visitors", label: "Unique Visitors", color: "#0D9488" },
              { key: "sessions", label: "Sessions", color: "#F59E0B" },
              { key: "books_created", label: "Books Created", color: "#10B981" },
            ]}
          />

          {/* Breakdown Section: Pages & Referrers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Landing Pages */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#292522]">Top Viewed Pages</h3>
                  <p className="text-xs text-[#77716D]">Most visited paths across all devices</p>
                </div>
                <Link
                  href="/admin/analytics"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#292522] hover:underline"
                >
                  <span>All Traffic</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {data.top_pages.length === 0 ? (
                <p className="text-xs text-[#77716D]">No page views logged yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.top_pages.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-[#FFFDF8] px-3.5 py-2.5 border border-[#F0E8E2] text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[240px] sm:max-w-[320px]">
                        <span className="font-mono text-[11px] text-[#77716D]">#{idx + 1}</span>
                        <span className="font-mono text-[#292522] truncate">{p.path}</span>
                      </div>
                      <span className="rounded-md bg-[#FAF4EC] px-2 py-0.5 text-xs font-bold text-[#292522]">
                        {p.views.toLocaleString()} views
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Referrers */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#292522]">Traffic Sources & Referrers</h3>
                  <p className="text-xs text-[#77716D]">External domains and direct navigation</p>
                </div>
                <Globe className="h-4 w-4 text-[#77716D]" />
              </div>

              {data.top_referrers.length === 0 ? (
                <p className="text-xs text-[#77716D]">No external referrer data recorded.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.top_referrers.map((ref, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-[#FFFDF8] px-3.5 py-2.5 border border-[#F0E8E2] text-xs font-semibold"
                    >
                      <span className="text-[#292522] truncate max-w-[220px]">
                        {ref.domain || "Direct / Bookmark"}
                      </span>
                      <span className="rounded-md bg-[#FAF4EC] px-2 py-0.5 text-xs font-bold text-[#292522]">
                        {ref.count.toLocaleString()} visits
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Breakdown Section: Device & Browser */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <BreakdownBarList
              title="Device Distribution"
              items={data.device_breakdown.map((d) => ({
                label: d.type ? d.type.charAt(0).toUpperCase() + d.type.slice(1) : "Unknown",
                count: d.count,
              }))}
              color="#0D9488"
            />
            <BreakdownBarList
              title="Browser Distribution"
              items={data.browser_breakdown.map((b) => ({
                label: b.browser || "Other",
                count: b.count,
              }))}
              color="#292522"
            />
          </div>

          {/* Reading & Learning Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most Read Books */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#292522]">Most-Read Digital Books</h3>
                  <p className="text-xs text-[#77716D]">Ranked by total verified active reading time</p>
                </div>
                <BookOpen className="h-4 w-4 text-[#77716D]" />
              </div>

              {!data.top_books || data.top_books.length === 0 ? (
                <p className="text-xs text-[#77716D]">No reading activity recorded during this period.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.top_books.map((b, idx) => (
                    <div
                      key={b.book_id}
                      className="flex items-center justify-between rounded-xl bg-[#FFFDF8] px-3.5 py-2.5 border border-[#F0E8E2] text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[240px] sm:max-w-[300px]">
                        <span className="font-mono text-[11px] text-[#77716D]">#{idx + 1}</span>
                        <div className="truncate">
                          <p className="text-[#292522] font-bold truncate">{b.title}</p>
                          <p className="text-[10px] text-[#77716D] truncate">{b.channel_title}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="rounded-md bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-700">
                          {formatDuration(b.total_seconds)}
                        </span>
                        <p className="text-[10px] text-[#77716D] mt-0.5">
                          {b.sessions_count} sessions ({b.unique_readers} readers)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Vocabulary Learners */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#292522]">Top Vocabulary Learners</h3>
                  <p className="text-xs text-[#77716D]">Readers building English-Bangla dictionaries</p>
                </div>
                <Award className="h-4 w-4 text-[#77716D]" />
              </div>

              {!data.top_learners || data.top_learners.length === 0 ? (
                <p className="text-xs text-[#77716D]">No saved vocabulary entries yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.top_learners.map((l, idx) => (
                    <div
                      key={l.user_id}
                      className="flex items-center justify-between rounded-xl bg-[#FFFDF8] px-3.5 py-2.5 border border-[#F0E8E2] text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[240px]">
                        <span className="font-mono text-[11px] text-[#77716D]">#{idx + 1}</span>
                        <div className="truncate">
                          <p className="text-[#292522] font-bold truncate">{l.full_name}</p>
                          <p className="text-[10px] text-[#77716D] font-mono truncate">{l.email}</p>
                        </div>
                      </div>
                      <span className="rounded-md bg-pink-50 px-2 py-0.5 text-xs font-bold text-pink-700">
                        {l.vocab_count} words saved
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Admin Actions & Operations Links */}
          <div className="rounded-3xl border border-[#E8DACB] bg-[#FFF8F0] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#292522]">Administrative Operations</h3>
                <p className="text-xs text-[#77716D] mt-0.5">
                  Direct shortcuts to user management, system diagnostics, and audit trail.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/admin/users"
                  className="rounded-2xl bg-[#292522] px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1a1715] transition-colors"
                >
                  Manage Users
                </Link>
                <Link
                  href="/admin/features"
                  className="rounded-2xl border border-[#E8DACB] bg-white px-4 py-2.5 text-xs font-bold text-[#292522] shadow-2xs hover:bg-[#FAF4EC] transition-colors"
                >
                  Transcript Telemetry
                </Link>
                <Link
                  href="/admin/health"
                  className="rounded-2xl border border-[#E8DACB] bg-white px-4 py-2.5 text-xs font-bold text-[#292522] shadow-2xs hover:bg-[#FAF4EC] transition-colors"
                >
                  System Health
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
