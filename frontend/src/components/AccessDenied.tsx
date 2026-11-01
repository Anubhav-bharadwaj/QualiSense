"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Home, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface AccessDeniedProps {
  requiredPermission?: string;
  requiredRole?: string;
  title?: string;
  description?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  requiredPermission,
  requiredRole,
  title = "Access Restricted",
  description = "You do not have the necessary permissions to access this plant module.",
}) => {
  const { user } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>

        {/* User Context & Missing Privilege */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left text-xs space-y-2.5">
          <div className="flex items-center justify-between text-slate-600">
            <span>Signed In As:</span>
            <span className="font-semibold text-slate-900">{user?.name || "Authenticated User"}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Assigned Role:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded font-medium bg-slate-200 text-slate-800">
              {user?.role || "Viewer"}
            </span>
          </div>
          {requiredPermission && (
            <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
              <span>Required Permission:</span>
              <span className="font-mono text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                {requiredPermission}
              </span>
            </div>
          )}
          {requiredRole && (
            <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
              <span>Required Minimum Role:</span>
              <span className="font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                {requiredRole}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Return to Dashboard
          </Link>
          <Link
            href="/profile"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            View Account Profile
          </Link>
        </div>
      </div>
    </div>
  );
};
