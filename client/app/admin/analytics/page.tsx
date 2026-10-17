"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  Users,
  Eye,
  Activity,
  Globe,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Layers,
} from "lucide-react";
import { getAdminOverviewApi } from "@/lib/api";
import { AdminOverviewResponse } from "@/lib/types";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { TimeSeriesChart, BreakdownBarList } from "@/components/admin/ChartComponents";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [range, setRange] = useState("7d");
  const [fromDate, setFromDate] = useState<string | undefined>();
  const [toDate, setToDate] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (r: string, f?: string, t?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminOverviewApi(r, f, t);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load visitor analytics.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(range, fromDate, toDate);
  }, [range, fromDate, toDate, fetchAnalytics]);

  const handleRangeChange = (newRange: string, f?: string, t?: string) => {
    setRange(newRange);
    setFromDate(f);
    setToDate(t);
  };

  const renderDelta = (deltaPct?: number) => {
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
            Visitors & Traffic Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#77716D]">
            First-party pseudonymous session metrics, audience activity, and traffic sources.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <DateRangeFilter
            currentRange={range}
            onRangeChange={handleRangeChange}
            isLoading={isLoading}
          />
          <button
            onClick={() => fetchAnalytics(range, fromDate, toDate)}
            disabled={isLoading}
            title="Refresh analytics"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#E8DACB] bg-white text-[#77716D] shadow-2xs hover:bg-[#FAF4EC] hover:text-[#292522] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error loading analytics</p>
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
          {/* Main Visitor KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                {renderDelta(data.kpis.unique_visitors.delta_pct)}
              </div>
              <p className="mt-1 text-xs text-[#77716D]">
                <span>Distinct visitor IDs in current period</span>
              </p>
            </div>

            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                  Total Sessions
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-[#292522]">
                  {data.kpis.sessions.value.toLocaleString()}
                </span>
                {renderDelta(data.kpis.sessions.delta_pct)}
              </div>
              <p className="mt-1 text-xs text-[#77716D]">
                <span>Inactivity timeout: 30 minutes</span>
              </p>
            </div>

            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">
                  Page Views
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <BarChart3 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-black text-[#292522]">
                  {data.kpis.page_views.value.toLocaleString()}
                </span>
                {renderDelta(data.kpis.page_views.delta_pct)}
              </div>
              <p className="mt-1 text-xs text-[#77716D]">
                <span>Total legitimate non-bot page requests</span>
              </p>
            </div>
          </div>

          {/* User Engagement (DAU, WAU, MAU, Stickiness) */}
          {data.user_engagement && (
            <div className="rounded-3xl border border-[#E8DACB] bg-[#FFF8F0] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#292522]">User Engagement & Active Reach</h3>
                  <p className="text-xs text-[#77716D]">Daily, Weekly, and Monthly Active Users across the platform</p>
                </div>
                <div className="rounded-xl bg-[#FAF4EC] px-3 py-1 text-xs font-bold text-[#292522]">
                  DAU/MAU Stickiness: {data.user_engagement.stickiness_ratio}%
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-white p-4 border border-[#F0E8E2]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716D]">DAU (24h)</span>
                  <div className="mt-1 text-xl font-black text-[#292522]">{data.user_engagement.dau_users}</div>
                  <div className="text-[10px] text-[#77716D] mt-0.5">{data.user_engagement.dau_visitors} unique visitors</div>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-[#F0E8E2]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716D]">WAU (7d)</span>
                  <div className="mt-1 text-xl font-black text-[#292522]">{data.user_engagement.wau_users}</div>
                  <div className="text-[10px] text-[#77716D] mt-0.5">{data.user_engagement.wau_visitors} unique visitors</div>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-[#F0E8E2]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716D]">MAU (30d)</span>
                  <div className="mt-1 text-xl font-black text-[#292522]">{data.user_engagement.mau_users}</div>
                  <div className="text-[10px] text-[#77716D] mt-0.5">{data.user_engagement.mau_visitors} unique visitors</div>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-[#F0E8E2]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#77716D]">Total Accounts</span>
                  <div className="mt-1 text-xl font-black text-[#292522]">{data.kpis.total_users.value}</div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-0.5">+{data.kpis.new_users.value} new registrations</div>
                </div>
              </div>
            </div>
          )}

          {/* Time Series Chart */}
          <TimeSeriesChart
            data={data.time_series}
            title="Traffic & Page View Volume"
            subtitle={`Daily distribution from ${data.start_date.slice(0, 10)} to ${data.end_date.slice(0, 10)}`}
            series={[
              { key: "page_views", label: "Page Views", color: "#8B5CF6" },
              { key: "unique_visitors", label: "Unique Visitors", color: "#0D9488" },
              { key: "sessions", label: "Sessions", color: "#F59E0B" },
            ]}
          />

          {/* Pages & Referrers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Visited Pages */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[#292522] mb-1">Most Visited Pages</h3>
              <p className="text-xs text-[#77716D] mb-4">Top URLs visited by non-bot users</p>
              {data.top_pages.length === 0 ? (
                <p className="text-xs text-[#77716D]">No page views logged yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.top_pages.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-[#FFFDF8] px-3.5 py-2.5 border border-[#F0E8E2] text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[280px]">
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

            {/* Referrers */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[#292522] mb-1">Top Referrers</h3>
              <p className="text-xs text-[#77716D] mb-4">Origin domains bringing traffic to Transcriptly</p>
              {data.top_referrers.length === 0 ? (
                <p className="text-xs text-[#77716D]">No external referrer sources logged.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.top_referrers.map((ref, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-[#FFFDF8] px-3.5 py-2.5 border border-[#F0E8E2] text-xs font-semibold"
                    >
                      <span className="text-[#292522] truncate max-w-[240px]">
                        {ref.domain || "Direct Navigation"}
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

          {/* Device & Browser Breakdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <BreakdownBarList
              title="Device Types"
              items={data.device_breakdown.map((d) => ({
                label: d.type ? d.type.charAt(0).toUpperCase() + d.type.slice(1) : "Unknown",
                count: d.count,
              }))}
              color="#0D9488"
            />
            <BreakdownBarList
              title="Browsers"
              items={data.browser_breakdown.map((b) => ({
                label: b.browser || "Other",
                count: b.count,
              }))}
              color="#292522"
            />
          </div>
        </>
      )}
    </div>
  );
}
