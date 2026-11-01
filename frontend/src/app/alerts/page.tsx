"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { QualityAlert, Severity, AlertStatus } from "@/types";
import {
  AlertTriangle,
  Filter,
  CheckCircle,
  Eye,
  GitBranch,
  ArrowRight,
  RefreshCw,
  Search,
  Check
} from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts({
        severity: selectedSeverity,
        status: selectedStatus,
      });
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedSeverity, selectedStatus]);

  const handleUpdateStatus = async (alertId: number, newStatus: AlertStatus) => {
    setUpdatingId(alertId);
    try {
      const updated = await api.updateAlert(alertId, {
        status: newStatus,
        resolved_by: newStatus === "Resolved" ? "Dr. Sarah Chen (Senior Quality Eng)" : undefined,
      });
      setAlerts(alerts.map((a) => (a.id === alertId ? updated : a)));
    } catch (err: any) {
      alert("Failed to update alert: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AppShell title="Quality Deviation Alerts" onRefreshData={fetchAlerts}>
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-600">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Info">Info</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-600">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{alerts.length}</strong> deviation events
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Batch & Line</th>
                <th className="py-3 px-4">Parameter</th>
                <th className="py-3 px-4">Observed vs Spec</th>
                <th className="py-3 px-4">Rule Explanation & Root Warning</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Loading quality deviation alerts...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No deviation alerts found matching the current filters.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <StatusBadge type="severity" value={alert.severity} />
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/batches/${alert.batch_id}`}
                        className="font-mono font-bold text-teal-700 hover:text-teal-900 block"
                      >
                        {alert.batch_code}
                      </Link>
                      <div className="text-[11px] text-slate-500">{alert.line_name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {alert.parameter}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-rose-600 font-mono text-sm">
                        {alert.observed_value} {alert.unit}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Spec: {alert.lower_limit} – {alert.upper_limit} {alert.unit}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-md">
                      <p className="text-slate-700 font-medium leading-relaxed">{alert.explanation}</p>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">{alert.rule_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge type="alert" value={alert.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {alert.status === "Open" && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, "Acknowledged")}
                            disabled={updatingId === alert.id}
                            className="px-2.5 py-1 text-[11px] font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md border border-amber-200 transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}

                        <Link
                          href={`/investigations?alert_id=${alert.id}`}
                          className="px-2.5 py-1 text-[11px] font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors flex items-center gap-1"
                        >
                          <GitBranch className="w-3 h-3" />
                          <span>5 Whys</span>
                        </Link>

                        {alert.status !== "Resolved" && (
                          <button
                            onClick={() => handleUpdateStatus(alert.id, "Resolved")}
                            disabled={updatingId === alert.id}
                            className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Resolve</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

