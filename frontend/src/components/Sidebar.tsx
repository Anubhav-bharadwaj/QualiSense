"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  AlertTriangle,
  GitBranch,
  CheckSquare,
  BarChart3,
  Leaf,
  FlaskConical,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Cpu,
  Users,
  LogOut,
  User as UserIcon,
  ChevronUp
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  onResetDemo?: () => void;
  isResetting?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onResetDemo, isResetting }) => {
  const pathname = usePathname();
  const { user, role, hasPermission, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Production Batches", href: "/batches", icon: Boxes },
    { label: "Quality Alerts", href: "/alerts", icon: AlertTriangle },
    { label: "5 Whys / Fishbone", href: "/investigations", icon: GitBranch },
    { label: "Action Centre (CAPA)", href: "/actions", icon: CheckSquare },
    { label: "Quality Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Sustainability & Rework", href: "/sustainability", icon: Leaf },
  ];

  const userInitials = user?.avatar || (user?.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "QS");

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex flex-col gap-1">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:border-teal-500/50 transition-colors">
            <FlaskConical className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-tight">QualiSense AI</h1>
            <p className="text-[11px] text-teal-400/90 font-medium">Cosmetic Defect Prevention</p>
          </div>
        </Link>
        <div className="mt-2 text-[10px] uppercase font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 inline-flex items-center gap-1 w-fit">
          <ShieldCheck className="w-3 h-3 text-teal-400" />
          L&apos;Oréal Challenge Option 02
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Workflows
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-teal-600/20 text-teal-300 border border-teal-500/30 shadow-sm shadow-teal-950"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-teal-400" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Real-World Research Data Lab */}
        <div className="pt-4 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-400/90 flex items-center justify-between">
          <span>Real-World Data Lab</span>
          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono border border-amber-500/30">UCI SECOM</span>
        </div>
        <Link
          href="/dataset-lab"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            pathname.startsWith("/dataset-lab")
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Cpu className={`w-4 h-4 shrink-0 ${pathname.startsWith("/dataset-lab") ? "text-amber-400" : "text-amber-400/70"}`} />
          <div className="flex flex-col">
            <span className="leading-tight">Manufacturing Lab</span>
            <span className="text-[10px] text-slate-400 font-normal">SECOM Sensor Dataset</span>
          </div>
        </Link>

        {/* Administration Section - Visible if Administrator or has users.manage */}
        {(role === "Administrator" || hasPermission("users.manage")) && (
          <>
            <div className="pt-4 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-rose-400/90 flex items-center justify-between">
              <span>Administration</span>
              <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-mono border border-rose-500/30">Admin</span>
            </div>
            <Link
              href="/admin/users"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith("/admin/users")
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Users className={`w-4 h-4 shrink-0 ${pathname.startsWith("/admin/users") ? "text-rose-400" : "text-rose-400/70"}`} />
              <div className="flex flex-col">
                <span className="leading-tight">User Management</span>
                <span className="text-[10px] text-slate-400 font-normal">RBAC & Audit Trail</span>
              </div>
            </Link>
          </>
        )}

        {/* Demo Fast Track Section */}
        <div className="pt-5 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Guided Demo Flow
        </div>
        <div className="px-2">
          <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs space-y-2">
            <div className="text-slate-300 font-medium flex items-center justify-between">
              <span>Demo Incident</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">P0 Flow</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Batch <span className="text-white font-mono font-medium">LOT-2026-HYD-041</span> has an active thermal deviation (42.8 °C).
            </p>
            <Link
              href="/batches/1"
              className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium pt-1"
            >
              Inspect Batch & Alert
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Footer Controls & User Pill */}
      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/60 relative" ref={menuRef}>
        {onResetDemo && (
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700/80 active:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            {isResetting ? "Resetting Scenario..." : "Reset Demo Data"}
          </button>
        )}

        {/* User Menu Dropdown */}
        {userMenuOpen && (
          <div className="absolute bottom-20 left-4 right-4 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-2 space-y-1 z-30 animate-in fade-in slide-in-from-bottom-2">
            <div className="px-3 py-2 border-b border-slate-700/80">
              <p className="text-xs font-bold text-white truncate">{user?.name || "Demo User"}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              <div className="mt-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {role || "Viewer"}
                </span>
              </div>
            </div>

            <Link
              href="/profile"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-teal-400" />
              <span>Account & Security</span>
            </Link>

            {(role === "Administrator" || hasPermission("users.manage")) && (
              <Link
                href="/admin/users"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-rose-400" />
                <span>User Management</span>
              </Link>
            )}

            <button
              onClick={() => {
                setUserMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 rounded-lg transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* User Pill Trigger */}
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="w-full flex items-center gap-3 pt-1 text-left p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors focus:outline-hidden"
        >
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-semibold text-xs text-teal-300 shrink-0">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.name || "Dr. Sarah Chen"}</p>
            <p className="text-[11px] text-slate-400 truncate">{role || "Lead QA Engineer"}</p>
          </div>
          <ChevronUp className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
        </button>
      </div>
    </aside>
  );
};
