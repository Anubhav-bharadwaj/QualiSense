"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { User, AuditLogEntry } from "@/types";
import {
  Users,
  UserPlus,
  ShieldAlert,
  Search,
  Filter,
  KeyRound,
  Loader2,
  X,
  Activity,
  AlertCircle
} from "lucide-react";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"users" | "audit">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Quality Engineer",
    organisation: "L’Oréal Plant Operations",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  // Fetch Users
  const loadUsers = async () => {
    try {
      const data = await api.adminListUsers({
        search: searchTerm || undefined,
        role: roleFilter !== "All" ? roleFilter : undefined,
      });
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users.");
    }
  };

  // Fetch Audit Logs
  const loadAuditLogs = async () => {
    try {
      const logs = await api.adminGetAuditLogs(100);
      setAuditLogs(logs);
    } catch (err: any) {
      console.warn("Failed to load audit logs:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadUsers(), loadAuditLogs()]).finally(() => setLoading(false));
  }, [searchTerm, roleFilter]);

  // Handle Toggle Active
  const handleToggleStatus = async (targetUser: User) => {
    try {
      const updated = await api.adminUpdateUser(targetUser.id, {
        is_active: !targetUser.is_active,
      });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || "Could not update user status.");
    }
  };

  // Handle Change Role
  const handleChangeRole = async (targetUser: User, newRole: string) => {
    try {
      const updated = await api.adminUpdateUser(targetUser.id, {
        role: newRole,
      });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
      loadAuditLogs();
    } catch (err: any) {
      alert(err.message || "Could not update role.");
    }
  };

  // Handle Create User Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      await api.adminCreateUser(createForm);
      setIsCreateOpen(false);
      setCreateForm({
        name: "",
        email: "",
        password: "",
        role: "Quality Engineer",
        organisation: "L’Oréal Plant Operations",
      });
      loadUsers();
      loadAuditLogs();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Reset User Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setResetLoading(true);
    setResetFeedback(null);

    try {
      const res = await api.adminResetUserPassword(resetModalUser.id, {
        new_password: resetNewPassword || undefined,
      });
      setResetFeedback(
        res.temporary_password
          ? `Temporary password generated: ${res.temporary_password}`
          : res.message
      );
      loadAuditLogs();
    } catch (err: any) {
      setResetFeedback(`Error: ${err.message}`);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AppShell title="Administration & User Management" requiredRole="Administrator">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold text-white">Plant Security & RBAC Console</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Admin Privilege
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Manage authorized plant personnel, RBAC permission tiers, and inspect compliance audit logs.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === "users"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Authorized Users ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors ${
              activeTab === "audit"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Security Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* Tab 1: Users Table */}
        {activeTab === "users" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-hidden"
                >
                  <option value="All">All Roles</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Quality Engineer">Quality Engineer</option>
                  <option value="Production Manager">Production Manager</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-y border-slate-200 text-slate-700 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Organisation</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Last Login</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                          <span>Loading plant user accounts...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelf = u.id === currentUser?.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-900 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                                {u.avatar || u.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">
                                  {u.name} {isSelf && <span className="text-[10px] font-semibold text-teal-600">(You)</span>}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <select
                              value={u.role}
                              disabled={isSelf}
                              onChange={(e) => handleChangeRole(u, e.target.value)}
                              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-medium disabled:opacity-50"
                            >
                              <option value="Administrator">Administrator</option>
                              <option value="Quality Engineer">Quality Engineer</option>
                              <option value="Production Manager">Production Manager</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 text-slate-700 truncate max-w-[150px]">
                            {u.organisation || "—"}
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isSelf}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                                u.is_active
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-500 border border-slate-300 hover:bg-slate-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                              {u.is_active ? "Active" : "Deactivated"}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {u.last_login_at
                              ? new Date(u.last_login_at).toLocaleDateString()
                              : "Never"}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setResetModalUser(u);
                                setResetNewPassword("");
                                setResetFeedback(null);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] border border-slate-300 transition-colors"
                            >
                              <KeyRound className="w-3 h-3 text-slate-500" />
                              <span>Reset Password</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Security Audit Trail */}
        {activeTab === "audit" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">System Audit Trail</h3>
                <p className="text-xs text-slate-500">Immutable ledger of authentication, role edits, and security events</p>
              </div>
              <button
                onClick={loadAuditLogs}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700"
              >
                Refresh Log
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-y border-slate-200 text-slate-700 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target</th>
                    <th className="py-3 px-4">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No audit records logged yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {log.actor_name || "System"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {log.target_type ? `${log.target_type} #${log.target_id || ""}` : "—"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-500 max-w-[250px] truncate">
                          {log.metadata_json ? JSON.stringify(log.metadata_json) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Create User */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  <span>Create Authorized Plant User</span>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Jean-Luc Martin"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Work Email</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="jeanluc.martin@qualisense.internal"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Temporary Password</label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Assigned Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Administrator">Administrator (Full Plant Operations + RBAC)</option>
                    <option value="Quality Engineer">Quality Engineer (Batches, CAPA, Root Cause)</option>
                    <option value="Production Manager">Production Manager (Batches, Readings, Oversight)</option>
                    <option value="Viewer">Viewer (Read-Only Access)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Plant / Department</label>
                  <input
                    type="text"
                    value={createForm.organisation}
                    onChange={(e) => setCreateForm({ ...createForm, organisation: e.target.value })}
                    placeholder="Line 02 • Haircare"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {createLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save User Account</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reset User Password */}
        {resetModalUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                  <KeyRound className="w-5 h-5 text-teal-600" />
                  <span>Reset User Password</span>
                </div>
                <button
                  onClick={() => setResetModalUser(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  Resetting credentials for: <strong>{resetModalUser.name}</strong> ({resetModalUser.email})
                </p>
                <p className="text-[11px] text-slate-400">
                  Leave new password blank to auto-generate a secure random temporary password.
                </p>
              </div>

              {resetFeedback && (
                <div className="p-3 rounded-xl bg-slate-900 text-teal-300 font-mono text-xs border border-slate-800 break-all">
                  {resetFeedback}
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Specific Password (Optional)</label>
                  <input
                    type="text"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Leave blank to auto-generate"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                  >
                    Done
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {resetLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Apply Reset</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
