"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  selectedLine?: string;
  onLineChange?: (lineId: string) => void;
  onRefreshData?: () => void;
  requiredPermission?: string;
  requiredRole?: string | string[];
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  title = "Overview Dashboard",
  selectedLine = "All",
  onLineChange,
  onRefreshData,
  requiredPermission,
  requiredRole,
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "warning" } | null>(null);

  const showToast = (message: string, type: "success" | "warning" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.resetDemoData();
      showToast("Demo scenario reset! Batch LOT-2026-HYD-041 thermal deviation restored.", "success");
      if (onRefreshData) {
        onRefreshData();
      } else {
        // reload current page to fetch freshly seeded data
        window.location.reload();
      }
    } catch (err: any) {
      showToast("Failed to reset demo: " + err.message, "warning");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <ProtectedRoute requiredPermission={requiredPermission} requiredRole={requiredRole}>
      <div className="flex w-full min-h-screen bg-slate-100">
        <Sidebar onResetDemo={handleResetDemo} isResetting={isResetting} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header
            title={title}
            selectedLine={selectedLine}
            onLineChange={onLineChange}
            onResetDemo={handleResetDemo}
            isResetting={isResetting}
          />

          {toast && (
            <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
              <div
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium ${
                  toast.type === "success"
                    ? "bg-slate-900 text-teal-300 border-teal-500/40"
                    : "bg-amber-900 text-amber-200 border-amber-600"
                }`}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>{toast.message}</span>
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};
