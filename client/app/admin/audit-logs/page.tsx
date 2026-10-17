"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Shield,
  RefreshCw,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  AlertTriangle,
} from "lucide-react";
import { getAdminAuditLogsApi } from "@/lib/api";
import { AdminAuditLogsResponse, AdminAuditLogItem } from "@/lib/types";

export default function AdminAuditLogsPage() {
  const [data, setData] = useState<AdminAuditLogsResponse | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminAuditLogsApi(page, limit);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load administrative audit trail.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
            Administrative Audit Trail
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#77716D]">
            Immutable record of sensitive administrative actions, role assignments, and account changes.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-2xl border border-[#E8DACB] bg-white px-3.5 py-2 text-xs font-bold text-[#292522] shadow-2xs hover:bg-[#FAF4EC] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error loading audit logs</p>
            <p className="mt-0.5 text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-3xl border border-[#F0E8E2] bg-white shadow-xs overflow-hidden">
        {isLoading && !data ? (
          <div className="p-8 text-center text-xs text-[#77716D]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#292522] border-t-transparent mx-auto mb-3" />
            Loading audit records...
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#77716D]">
            <ShieldAlert className="h-8 w-8 mx-auto text-[#A8A29E] mb-2" />
            No administrative audit actions recorded yet.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF4EC] text-[#77716D] font-bold uppercase tracking-wider text-[11px] border-b border-[#F0E8E2]">
                  <tr>
                    <th className="py-3.5 px-5">Administrator</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Target Type</th>
                    <th className="py-3.5 px-4">IP Address</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E8E2]">
                  {data.items.map((log) => (
                    <tr key={log.id} className="hover:bg-[#FFFDF8] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-[#292522] flex items-center gap-1.5">
                          <User className="h-3 w-3 text-[#77716D]" />
                          <span>{log.admin_email}</span>
                        </div>
                        <div className="font-mono text-[10px] text-[#77716D]">{log.admin_id}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center rounded-lg bg-[#FAF4EC] px-2 py-0.5 font-mono text-[11px] font-bold text-[#292522] border border-[#E8DACB]">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#292522] capitalize">
                          {log.target_type || "N/A"}
                        </span>
                        {log.target_id && (
                          <div className="font-mono text-[10px] text-[#77716D] truncate max-w-[140px]">
                            {log.target_id}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#77716D]">
                        {log.ip_address || "127.0.0.1"}
                      </td>

                      <td className="py-3.5 px-4 text-[#77716D]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        {log.details ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="rounded-lg bg-[#FAF4EC] px-2.5 py-1 text-[11px] font-bold text-[#292522] hover:bg-[#E8DACB] transition-colors"
                          >
                            View
                          </button>
                        ) : (
                          <span className="text-[#A8A29E] text-[11px]">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-[#F0E8E2] bg-[#FAF4EC] px-5 py-3 text-xs text-[#77716D]">
              <div>
                Page <strong className="text-[#292522]">{data.page}</strong> of{" "}
                <strong className="text-[#292522]">{data.total_pages}</strong> ({data.total_count} total events)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl border border-[#E8DACB] bg-white px-2.5 py-1 font-bold text-[#292522] disabled:opacity-40 hover:bg-[#FFFDF8]"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  disabled={page >= data.total_pages || isLoading}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border border-[#E8DACB] bg-white px-2.5 py-1 font-bold text-[#292522] disabled:opacity-40 hover:bg-[#FFFDF8]"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="max-w-lg w-full rounded-3xl border border-[#F0E8E2] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0E8E2] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#292522]">Audit Action Details</h3>
                <p className="text-xs text-[#77716D] font-mono mt-0.5">{selectedLog.action}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl p-1 text-[#77716D] hover:bg-[#FAF4EC] hover:text-[#292522]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-semibold text-[#77716D]">Administrator:</span>{" "}
                <span className="font-bold text-[#292522]">{selectedLog.admin_email}</span>
              </div>
              <div>
                <span className="font-semibold text-[#77716D]">Timestamp:</span>{" "}
                <span className="text-[#292522]">{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-semibold text-[#77716D]">IP Address:</span>{" "}
                <span className="font-mono text-[#292522]">{selectedLog.ip_address}</span>
              </div>
              <div className="mt-3">
                <span className="font-semibold text-[#77716D] block mb-1">Sanitized Metadata:</span>
                <pre className="max-h-48 overflow-auto rounded-xl bg-slate-900 p-3 text-[11px] font-mono text-emerald-400">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedLog.details || "{}"), null, 2);
                    } catch {
                      return selectedLog.details || "{}";
                    }
                  })()}
                </pre>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-[#292522] px-4 py-2 text-xs font-bold text-white hover:bg-[#1a1715]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
