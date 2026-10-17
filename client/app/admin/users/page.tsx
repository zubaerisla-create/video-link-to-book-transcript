"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Clock,
  BookMarked,
  Award,
  Eye,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  getAdminUsersApi,
  getAdminUserDetailApi,
  updateAdminUserStatusApi,
  updateAdminUserRoleApi,
} from "@/lib/api";
import { AdminUserItem, AdminUsersResponse, UserActivityDetailResponse } from "@/lib/types";

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<AdminUsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 15;

  // Confirmation Modal state
  const [actionTarget, setActionTarget] = useState<{
    user: AdminUserItem;
    action: "suspend" | "activate" | "promote" | "demote";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User Activity Slide-Over / Modal state
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserActivityDetailResponse | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const handleOpenUserDetail = async (userId: string) => {
    setIsDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await getAdminUserDetailApi(userId);
      setSelectedUserDetail(detail);
    } catch (err: any) {
      setDetailError(err.message || "Failed to load user activity details.");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminUsersApi(page, limit, search, statusFilter, roleFilter);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load user accounts.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const { user, action } = actionTarget;
      if (action === "suspend") {
        await updateAdminUserStatusApi(user.id, false);
        setFeedbackMsg({ type: "success", text: `User ${user.email} suspended.` });
      } else if (action === "activate") {
        await updateAdminUserStatusApi(user.id, true);
        setFeedbackMsg({ type: "success", text: `User ${user.email} activated.` });
      } else if (action === "promote") {
        await updateAdminUserRoleApi(user.id, "admin");
        setFeedbackMsg({ type: "success", text: `User ${user.email} promoted to Administrator.` });
      } else if (action === "demote") {
        await updateAdminUserRoleApi(user.id, "user");
        setFeedbackMsg({ type: "success", text: `Administrator privileges removed for ${user.email}.` });
      }
      setActionTarget(null);
      await fetchUsers();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Action failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#292522]">
            User Management
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#77716D]">
            Manage registered accounts, grant administrative roles, or suspend access.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-2xl border border-[#E8DACB] bg-white px-3.5 py-2 text-xs font-bold text-[#292522] shadow-2xs hover:bg-[#FAF4EC] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications */}
      {feedbackMsg && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold ${
            feedbackMsg.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error loading users</p>
            <p className="mt-0.5 text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-[#F0E8E2] bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#77716D]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email address..."
              className="w-full rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] pl-10 pr-20 py-2.5 text-xs text-[#292522] placeholder:text-[#A8A29E] focus:border-[#292522] focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-16 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#77716D] hover:text-[#292522]"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[#292522] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1a1715]"
            >
              Search
            </button>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#77716D] hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] px-3 py-2 text-xs font-semibold text-[#292522] focus:border-[#292522] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#77716D] hidden sm:inline">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] px-3 py-2 text-xs font-semibold text-[#292522] focus:border-[#292522] focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins Only</option>
              <option value="user">Standard Users</option>
            </select>
          </div>
        </div>

        {/* Total Count Header */}
        <div className="flex items-center justify-between text-xs text-[#77716D] pt-2 border-t border-[#F0E8E2]">
          <span>
            Showing <strong className="text-[#292522]">{data?.items.length || 0}</strong> of{" "}
            <strong className="text-[#292522]">{data?.total_count || 0}</strong> registered accounts
          </span>
          {search && (
            <span>
              Matching query: <strong className="text-[#292522]">&quot;{search}&quot;</strong>
            </span>
          )}
        </div>
      </div>

      {/* Users Table / Mobile Cards */}
      <div className="rounded-3xl border border-[#F0E8E2] bg-white overflow-hidden shadow-xs">
        {isLoading && !data ? (
          <div className="p-8 text-center text-sm text-[#77716D]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#292522] border-t-transparent mx-auto mb-3" />
            Loading accounts...
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#77716D]">
            <Users className="h-8 w-8 mx-auto text-[#A8A29E] mb-2" />
            No user accounts found matching the filter criteria.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF4EC] text-[#77716D] font-bold uppercase tracking-wider text-[11px] border-b border-[#F0E8E2]">
                  <tr>
                    <th className="py-3.5 px-5">User</th>
                    <th className="py-3.5 px-4">Reading Time</th>
                    <th className="py-3.5 px-4">Sessions & Books</th>
                    <th className="py-3.5 px-4">Vocabulary</th>
                    <th className="py-3.5 px-4">Latest Book Read</th>
                    <th className="py-3.5 px-4">Role & Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E8E2]">
                  {data.items.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-[#FFFDF8] transition-colors cursor-pointer"
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest("button")) return;
                          handleOpenUserDetail(u.id);
                        }}
                      >
                        {/* User info */}
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-[#292522] flex items-center gap-1.5">
                            <span>{u.full_name}</span>
                            {isSelf && (
                              <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#77716D] font-mono">{u.email}</div>
                        </td>

                        {/* Reading Time */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#292522] flex items-center gap-1">
                            <Clock className="h-3 w-3 text-orange-600" />
                            <span>{formatDuration(u.reading_time_seconds)}</span>
                          </div>
                          <div className="text-[10px] text-[#77716D]">
                            Today: {formatDuration(u.reading_time_today_seconds)}
                          </div>
                        </td>

                        {/* Sessions & Books */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#292522]">
                            {u.reading_sessions_count || 0} sessions
                          </div>
                          <div className="text-[10px] text-[#77716D]">
                            {u.distinct_books_read || 0} read • {u.books_count} in library
                          </div>
                        </td>

                        {/* Vocabulary */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-pink-700 flex items-center gap-1">
                            <Award className="h-3 w-3 text-pink-600" />
                            <span>{u.vocab_saved_total || 0} words</span>
                          </div>
                          <div className="text-[10px] text-[#77716D]">
                            +{u.vocab_saved_today || 0} today
                          </div>
                        </td>

                        {/* Latest Book */}
                        <td className="py-3.5 px-4 max-w-[180px]">
                          <div className="text-xs font-semibold text-[#292522] truncate" title={u.last_read_book_title}>
                            {u.last_read_book_title || "None yet"}
                          </div>
                        </td>

                        {/* Role & Status */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {u.is_admin || u.role === "admin" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1B8] px-2 py-0.5 text-[10px] font-extrabold text-[#292522]">
                                <Shield className="h-2.5 w-2.5" />
                                <span>Admin</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                User
                              </span>
                            )}

                            {u.is_active ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700">
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600">
                                <XCircle className="h-2.5 w-2.5 text-rose-500" />
                                <span>Suspended</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Activity details button */}
                            <button
                              onClick={() => handleOpenUserDetail(u.id)}
                              title="View full user reading & vocabulary activity"
                              className="rounded-xl px-2.5 py-1 text-[11px] font-bold border border-[#E8DACB] bg-[#FAF4EC] text-[#292522] hover:bg-[#E8DACB] transition-colors"
                            >
                              Activity
                            </button>

                            {/* Suspend / Activate button */}
                            {u.is_active ? (
                              <button
                                disabled={isSelf}
                                onClick={() => setActionTarget({ user: u, action: "suspend" })}
                                title={isSelf ? "You cannot suspend your own account" : "Suspend user"}
                                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-colors ${
                                  isSelf
                                    ? "opacity-40 border-slate-200 text-slate-400 cursor-not-allowed"
                                    : "border-red-200 text-red-600 hover:bg-red-50"
                                }`}
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => setActionTarget({ user: u, action: "activate" })}
                                className="rounded-xl px-2.5 py-1 text-[11px] font-bold border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                Activate
                              </button>
                            )}

                            {/* Role promote/demote button */}
                            {u.is_admin || u.role === "admin" ? (
                              <button
                                disabled={isSelf}
                                onClick={() => setActionTarget({ user: u, action: "demote" })}
                                title={isSelf ? "You cannot demote yourself" : "Remove admin privileges"}
                                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold border transition-colors ${
                                  isSelf
                                    ? "opacity-40 border-slate-200 text-slate-400 cursor-not-allowed"
                                    : "border-[#E8DACB] text-[#77716D] hover:bg-[#FAF4EC]"
                                }`}
                              >
                                Demote
                              </button>
                            ) : (
                              <button
                                onClick={() => setActionTarget({ user: u, action: "promote" })}
                                className="rounded-xl px-2.5 py-1 text-[11px] font-bold border border-[#292522] bg-[#292522] text-white hover:bg-[#1a1715] transition-colors"
                              >
                                Make Admin
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-[#F0E8E2]">
              {data.items.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <div key={u.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-[#292522] flex items-center gap-1.5">
                          <span>{u.full_name}</span>
                          {isSelf && (
                            <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-bold text-teal-700">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#77716D] font-mono break-all">{u.email}</div>
                      </div>
                      <div>
                        {u.is_admin || u.role === "admin" ? (
                          <span className="rounded-full bg-[#FFF1B8] px-2 py-0.5 text-[10px] font-extrabold text-[#292522]">
                            Admin
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            User
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-[#FFFDF8] p-2 border border-[#F0E8E2]">
                        <span className="text-[10px] font-bold uppercase text-[#77716D]">Reading Time</span>
                        <div className="font-black text-[#292522] mt-0.5">{formatDuration(u.reading_time_seconds)}</div>
                        <div className="text-[10px] text-[#77716D]">{u.reading_sessions_count || 0} sessions</div>
                      </div>
                      <div className="rounded-xl bg-[#FFFDF8] p-2 border border-[#F0E8E2]">
                        <span className="text-[10px] font-bold uppercase text-[#77716D]">Vocabulary</span>
                        <div className="font-black text-pink-700 mt-0.5">{u.vocab_saved_total || 0} words</div>
                        <div className="text-[10px] text-[#77716D]">+{u.vocab_saved_today || 0} today</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#F0E8E2]">
                      <button
                        onClick={() => handleOpenUserDetail(u.id)}
                        className="flex-1 rounded-xl py-1.5 text-xs font-bold border border-[#E8DACB] bg-[#FAF4EC] text-[#292522]"
                      >
                        Activity Details
                      </button>

                      {u.is_active ? (
                        <button
                          disabled={isSelf}
                          onClick={() => setActionTarget({ user: u, action: "suspend" })}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold border ${
                            isSelf
                              ? "opacity-40 border-slate-200 text-slate-400"
                              : "border-red-200 text-red-600 hover:bg-red-50"
                          }`}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => setActionTarget({ user: u, action: "activate" })}
                          className="rounded-xl px-3 py-1.5 text-xs font-bold border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination footer */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#F0E8E2] bg-[#FFFDF8]">
            <span className="text-xs text-[#77716D]">
              Page <strong className="text-[#292522]">{data.page}</strong> of{" "}
              <strong className="text-[#292522]">{data.total_pages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E8DACB] bg-white text-[#292522] disabled:opacity-40 hover:bg-[#FAF4EC]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= data.total_pages || isLoading}
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E8DACB] bg-white text-[#292522] disabled:opacity-40 hover:bg-[#FAF4EC]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
          <div className="max-w-md w-full rounded-3xl border border-[#F0E8E2] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  actionTarget.action === "suspend"
                    ? "bg-red-100 text-red-600"
                    : actionTarget.action === "promote"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {actionTarget.action === "suspend" ? (
                  <UserX className="h-5 w-5" />
                ) : (
                  <ShieldAlert className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#292522]">
                  {actionTarget.action === "suspend" && "Suspend Account"}
                  {actionTarget.action === "activate" && "Reactivate Account"}
                  {actionTarget.action === "promote" && "Promote to Administrator"}
                  {actionTarget.action === "demote" && "Demote Administrator"}
                </h3>
                <p className="text-xs text-[#77716D]">{actionTarget.user.email}</p>
              </div>
            </div>

            <p className="text-xs text-[#77716D] leading-relaxed">
              {actionTarget.action === "suspend" &&
                "Suspended users cannot log in, access their library, or generate new transcripts. Existing data will remain safely preserved."}
              {actionTarget.action === "activate" &&
                "This will immediately restore access for this user to log in and use Transcriptly."}
              {actionTarget.action === "promote" &&
                "Administrators have full access to sensitive analytics, platform user accounts, and telemetry. Only grant this to trusted team members."}
              {actionTarget.action === "demote" &&
                "This user will lose all administrative privileges and access to the /admin panel immediately."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setActionTarget(null)}
                className="rounded-2xl border border-[#E8DACB] px-4 py-2 text-xs font-semibold text-[#292522] hover:bg-[#FAF4EC]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmAction}
                className={`rounded-2xl px-4 py-2 text-xs font-bold text-white transition-colors ${
                  actionTarget.action === "suspend"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#292522] hover:bg-[#1a1715]"
                }`}
              >
                {isSubmitting ? "Processing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Activity Slide-Over / Modal */}
      {(selectedUserDetail || isDetailLoading || detailError) && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs p-0">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#F0E8E2] px-6 py-4 bg-[#FFFDF8]">
              <div>
                <h3 className="text-base font-extrabold text-[#292522]">User Activity Profile</h3>
                <p className="text-xs text-[#77716D]">Reading history, duration analytics, and personal dictionary</p>
              </div>
              <button
                onClick={() => {
                  setSelectedUserDetail(null);
                  setDetailError(null);
                }}
                className="rounded-xl p-1.5 text-[#77716D] hover:bg-[#FAF4EC] hover:text-[#292522] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isDetailLoading ? (
                <div className="py-20 text-center text-xs text-[#77716D]">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#292522] border-t-transparent mx-auto mb-3" />
                  Loading activity analytics...
                </div>
              ) : detailError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                  {detailError}
                </div>
              ) : selectedUserDetail ? (
                <>
                  {/* User Profile Card */}
                  <div className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-[#292522]">{selectedUserDetail.user.full_name}</h4>
                      <p className="text-xs font-mono text-[#77716D]">{selectedUserDetail.user.email}</p>
                      <p className="text-[11px] text-[#A8A29E] mt-0.5">
                        Joined {selectedUserDetail.user.created_at ? new Date(selectedUserDetail.user.created_at).toLocaleDateString() : "N/A"}
                        {selectedUserDetail.user.last_login_at && (
                          <span> • Last login {new Date(selectedUserDetail.user.last_login_at).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        selectedUserDetail.user.is_admin ? "bg-[#FFF1B8] text-[#292522]" : "bg-slate-100 text-slate-700"
                      }`}>
                        {selectedUserDetail.user.is_admin ? "Administrator" : "User"}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        selectedUserDetail.user.is_active ? "text-emerald-700" : "text-rose-600"
                      }`}>
                        {selectedUserDetail.user.is_active ? "Active" : "Suspended"}
                      </span>
                    </div>
                  </div>

                  {/* Reading Time Metrics Grid */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#77716D] mb-2 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-orange-600" />
                      <span>Reading Time Aggregations</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-[#F0E8E2] bg-white p-3">
                        <span className="text-[10px] font-bold uppercase text-[#77716D]">Today</span>
                        <div className="text-base font-black text-[#292522] mt-0.5">
                          {formatDuration(selectedUserDetail.reading_summary.today_reading_seconds)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#F0E8E2] bg-white p-3">
                        <span className="text-[10px] font-bold uppercase text-[#77716D]">Last 7 Days</span>
                        <div className="text-base font-black text-[#292522] mt-0.5">
                          {formatDuration(selectedUserDetail.reading_summary.d7_reading_seconds)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#F0E8E2] bg-white p-3">
                        <span className="text-[10px] font-bold uppercase text-[#77716D]">Last 30 Days</span>
                        <div className="text-base font-black text-[#292522] mt-0.5">
                          {formatDuration(selectedUserDetail.reading_summary.d30_reading_seconds)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-[#F0E8E2] bg-orange-50/50 p-3">
                        <span className="text-[10px] font-bold uppercase text-orange-800">Total Reading</span>
                        <div className="text-base font-black text-orange-950 mt-0.5">
                          {formatDuration(selectedUserDetail.reading_summary.total_reading_seconds)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-[#77716D] flex items-center gap-3">
                      <span>{selectedUserDetail.reading_summary.total_reading_sessions} reader sessions</span>
                      <span>•</span>
                      <span>{selectedUserDetail.reading_summary.distinct_books_read} distinct books read</span>
                      <span>•</span>
                      <span>Avg {formatDuration(selectedUserDetail.reading_summary.avg_session_seconds)} / session</span>
                    </div>
                  </div>

                  {/* Vocabulary Summary Cards */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#77716D] mb-2 flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-pink-600" />
                      <span>Saved Vocabulary Progress</span>
                    </h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="rounded-xl border border-[#F0E8E2] bg-white p-3">
                        <span className="text-[10px] font-bold uppercase text-[#77716D]">Total Words</span>
                        <div className="text-base font-black text-[#292522] mt-0.5">
                          {selectedUserDetail.vocabulary_summary.total_words}
                        </div>
                      </div>
                      <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3">
                        <span className="text-[10px] font-bold uppercase text-sky-700">New</span>
                        <div className="text-base font-black text-sky-900 mt-0.5">
                          {selectedUserDetail.vocabulary_summary.new_count}
                        </div>
                      </div>
                      <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
                        <span className="text-[10px] font-bold uppercase text-amber-700">Learning</span>
                        <div className="text-base font-black text-amber-900 mt-0.5">
                          {selectedUserDetail.vocabulary_summary.learning_count}
                        </div>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                        <span className="text-[10px] font-bold uppercase text-emerald-700">Learned</span>
                        <div className="text-base font-black text-emerald-900 mt-0.5">
                          {selectedUserDetail.vocabulary_summary.learned_count}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Reading Sessions Table */}
                  <div>
                    <h4 className="text-xs font-bold text-[#292522] mb-2">Recent Reading Sessions</h4>
                    {selectedUserDetail.recent_sessions.length === 0 ? (
                      <p className="text-xs text-[#77716D]">No recorded reading sessions yet.</p>
                    ) : (
                      <div className="rounded-xl border border-[#F0E8E2] overflow-hidden text-xs">
                        <div className="max-h-48 overflow-y-auto divide-y divide-[#F0E8E2]">
                          {selectedUserDetail.recent_sessions.map((s) => (
                            <div key={s.id} className="p-3 bg-[#FFFDF8] flex items-center justify-between">
                              <div className="truncate max-w-[240px]">
                                <div className="font-bold text-[#292522] truncate">{s.book_title}</div>
                                <div className="text-[10px] text-[#77716D]">
                                  {s.start_time ? new Date(s.start_time).toLocaleString() : "N/A"} • Page {s.last_page_read} ({s.reading_progress}%)
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="rounded-md bg-orange-100 px-2 py-0.5 font-bold text-orange-800 text-[11px]">
                                  {formatDuration(s.duration_seconds)}
                                </span>
                                <div className="text-[10px] text-[#77716D] mt-0.5 capitalize">{s.device_type}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent Saved Words */}
                  <div>
                    <h4 className="text-xs font-bold text-[#292522] mb-2">Recent Vocabulary Words</h4>
                    {selectedUserDetail.recent_words.length === 0 ? (
                      <p className="text-xs text-[#77716D]">No words saved to personal dictionary yet.</p>
                    ) : (
                      <div className="rounded-xl border border-[#F0E8E2] overflow-hidden text-xs">
                        <div className="max-h-48 overflow-y-auto divide-y divide-[#F0E8E2]">
                          {selectedUserDetail.recent_words.map((w) => (
                            <div key={w.id} className="p-3 bg-white flex items-center justify-between">
                              <div className="truncate max-w-[240px]">
                                <span className="font-bold text-[#292522]">{w.original_word}</span>
                                <span className="text-[#77716D] mx-1.5">•</span>
                                <span className="font-semibold text-teal-800">{w.bangla_meaning}</span>
                                {w.english_definition && (
                                  <p className="text-[10px] text-[#77716D] truncate mt-0.5">{w.english_definition}</p>
                                )}
                              </div>
                              <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold capitalize ${
                                w.learning_status === "learned"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : w.learning_status === "learning"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-sky-100 text-sky-800"
                              }`}>
                                {w.learning_status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
