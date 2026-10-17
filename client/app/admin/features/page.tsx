"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Zap,
  CheckCircle2,
  XCircle,
  BookOpen,
  Languages,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Percent,
  FileText,
} from "lucide-react";
import { getAdminFeatureUsageApi } from "@/lib/api";
import { AdminFeatureUsageResponse } from "@/lib/types";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { BreakdownBarList } from "@/components/admin/ChartComponents";

export default function AdminFeaturesPage() {
  const [data, setData] = useState<AdminFeatureUsageResponse | null>(null);
  const [range, setRange] = useState("7d");
  const [fromDate, setFromDate] = useState<string | undefined>();
  const [toDate, setToDate] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async (r: string, f?: string, t?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminFeatureUsageApi(r, f, t);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load feature usage telemetry.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures(range, fromDate, toDate);
  }, [range, fromDate, toDate, fetchFeatures]);

  const handleRangeChange = (newRange: string, f?: string, t?: string) => {
    setRange(newRange);
    setFromDate(f);
    setToDate(t);
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
            Transcript Feature Telemetry
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#77716D]">
            Extraction attempts, translation rates, language adoption, and pipeline health.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <DateRangeFilter
            currentRange={range}
            onRangeChange={handleRangeChange}
            isLoading={isLoading}
          />
          <button
            onClick={() => fetchFeatures(range, fromDate, toDate)}
            disabled={isLoading}
            title="Refresh feature data"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#E8DACB] bg-white text-[#77716D] shadow-2xs hover:bg-[#FAF4EC] hover:text-[#292522] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error loading feature data</p>
            <p className="mt-0.5 text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {isLoading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-neutral-200/60" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">Total Attempts</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Zap className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-[#292522]">
                {data.attempts.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-[#77716D]">Extraction & import pipelines started</p>
            </div>

            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">Success Rate</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-[#292522]">
                {data.success_rate}%
              </div>
              <p className="mt-1 text-xs text-emerald-700 font-semibold">{data.successes} successful imports</p>
            </div>

            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">Books Created</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-[#292522]">
                {data.books_created.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-[#77716D]">Digital transcript books saved to library</p>
            </div>

            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#77716D]">Failed Attempts</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <XCircle className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-[#292522]">
                {data.failures.toLocaleString()}
              </div>
              <p className="mt-1 text-xs text-[#77716D]">Missing captions or network errors</p>
            </div>
          </div>

          {/* Languages & Translation Ratio Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Languages */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#292522]">Languages Processed</h3>
                  <p className="text-xs text-[#77716D]">Most frequent languages across books created</p>
                </div>
                <Languages className="h-4 w-4 text-[#77716D]" />
              </div>

              {data.languages.length === 0 ? (
                <p className="text-xs text-[#77716D]">No books created in this period.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.languages.map((l, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-[#FFFDF8] px-3.5 py-2.5 border border-[#F0E8E2] text-xs font-semibold"
                    >
                      <span className="text-[#292522]">{l.language || "Unknown Language"}</span>
                      <span className="rounded-md bg-[#FAF4EC] px-2 py-0.5 text-xs font-bold text-[#292522]">
                        {l.count} books
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Translation Ratio */}
            <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[#292522] mb-1">Translation Ratio</h3>
              <p className="text-xs text-[#77716D] mb-4">Books kept in original language vs translated</p>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FFFDF8] border border-[#F0E8E2] mb-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-[#292522]">Original ({data.translation_ratio.original})</span>
                    <span className="text-teal-700">Translated ({data.translation_ratio.translated})</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      className="h-full bg-[#292522]"
                      style={{
                        width: `${
                          data.books_created > 0
                            ? (data.translation_ratio.original / data.books_created) * 100
                            : 50
                        }%`,
                      }}
                    />
                    <div
                      className="h-full bg-teal-600"
                      style={{
                        width: `${
                          data.books_created > 0
                            ? (data.translation_ratio.translated / data.books_created) * 100
                            : 50
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-[#FAF4EC] border border-[#F0E8E2]">
                  <div className="text-lg font-black text-[#292522]">{data.translation_ratio.original}</div>
                  <div className="text-[11px] text-[#77716D] font-medium">Original Transcripts</div>
                </div>
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-100">
                  <div className="text-lg font-black text-teal-800">{data.translation_ratio.translated}</div>
                  <div className="text-[11px] text-teal-700 font-medium">Translated Books</div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Categories Breakdown */}
          <div className="rounded-3xl border border-[#F0E8E2] bg-white p-5 sm:p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#292522] mb-1">Common Extraction Failures</h3>
            <p className="text-xs text-[#77716D] mb-4">Error breakdown for failed transcript imports</p>

            {data.common_errors.length === 0 ? (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 border border-emerald-100 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Zero extraction failures recorded during this time period!</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {data.common_errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-rose-50/50 px-3.5 py-2.5 border border-rose-100 text-xs font-semibold"
                  >
                    <span className="font-mono text-rose-800">{err.category}</span>
                    <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                      {err.count} occurrences
                    </span>
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
