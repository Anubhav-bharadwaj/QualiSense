"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  User,
  Shield,
  KeyRound,
  Building,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Check
} from "lucide-react";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  // Profile Edit State
  const [name, setName] = useState(user?.name || "");
  const [organisation, setOrganisation] = useState(user?.organisation || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);

    try {
      await api.updateProfile({ name, organisation });
      await refreshUser();
      setProfileMsg({ type: "success", text: "Profile details updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "New password must be at least 8 characters long." });
      setPasswordSaving(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      setPasswordSaving(false);
      return;
    }

    try {
      await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      setPasswordMsg({ type: "success", text: "Password changed successfully. Active sessions refreshed." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setPasswordSaving(false);
    }
  };

  const userInitials = user?.avatar || (user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "QS");

  return (
    <AppShell title="Account & Security">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* User Identity Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-teal-400 font-bold text-xl flex items-center justify-center border border-slate-700 shadow-inner">
              {userInitials}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user?.email}
              </p>
              {user?.organisation && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {user?.organisation}
                </p>
              )}
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 space-y-1 self-stretch sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0">
            <div className="flex items-center gap-1.5 sm:justify-end text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Argon2id Encrypted Account</span>
            </div>
            {user?.last_login_at && (
              <p className="text-[11px] text-slate-400">
                Last login: {new Date(user.last_login_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* 2-Column Grid: Profile Edit & Change Password */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Section 1: Edit Profile */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <User className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Personal Details</h2>
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  profileMsg.type === "success"
                    ? "bg-teal-50 border border-teal-200 text-teal-800"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
              >
                {profileMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Assigned Department / Plant</label>
                <input
                  type="text"
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                  placeholder="Packaging Line 01"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Account Email (Immutable)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400">Email changes require plant administrator re-verification.</p>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {profileSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Save Changes</span>
              </button>
            </form>
          </div>

          {/* Section 2: Change Password */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <KeyRound className="w-5 h-5 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Change Password</h2>
            </div>

            {passwordMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordMsg.type === "success"
                    ? "bg-teal-50 border border-teal-200 text-teal-800"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
              >
                {passwordMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">New Password (8+ chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {passwordSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Update Password</span>
              </button>
            </form>
          </div>
        </div>

        {/* Section 3: Granted Permissions Inspector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-teal-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Role & Security Privileges</h2>
                <p className="text-xs text-slate-500">
                  Granular permission grants active for your account role: <span className="font-semibold text-slate-800">{user?.role}</span>
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {user?.permissions?.length || 0} Grants
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
            {user?.permissions && user.permissions.length > 0 ? (
              user.permissions.map((perm) => (
                <div
                  key={perm}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2 text-slate-700"
                >
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span className="font-mono text-[11px] truncate">{perm}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 col-span-full">No explicit privileges granted.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
