"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { KPICard } from "@/components/KPICard";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { DashboardSummary } from "@/types";
import {
  Boxes,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Trash2,
  ArrowRight,
  TrendingUp,
  Activity,
  ShieldAlert,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from "recharts";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [selectedLine, setSelectedLine] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const lineId = selectedLine === "All" ? undefined : Number(selectedLine);
      const summary = await api.getDashboardSummary(lineId);
      setData(summary);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedLine]);

  return (
    <AppShell
      title="Plant Quality Overview"
      selectedLine={selectedLine}
      onLineChange={setSelectedLine}
      onRefreshData={fetchData}
    >
      {/* Synthetic Demo Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 mt-0.5">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-white">L&apos;Oréal Sustainability Challenge — Option 02 Demonstrator</h3>
              <span className="text-[10px] font-semibold uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                Synthetic Prototype
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Decision support prototype for early process deviation detection, 5 Whys / fishbone cause tracking, and avoidable rework calculation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <Link
            href="/batches/1"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
          >
            <span>Investigate Demo Incident</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center p-16">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
          <span className="ml-2 text-sm text-slate-500">Loading plant telemetry...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchData}
            className="underline font-semibold hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {data && (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KPICard
              title="Batches Monitored"
              value={data.batches_monitored}
              badge="Live Telemetry"
              subtitle="6 completed, 2 active runs"
              icon={Boxes}
              accent="slate"
            />
            <KPICard
              title="Active Deviations"
              value={data.active_deviations}
              subtitle={data.active_deviations > 0 ? "Requires quality review" : "Process within limits"}
              icon={AlertTriangle}
              accent={data.active_deviations > 0 ? "rose" : "emerald"}
              badge={data.active_deviations > 0 ? "Action Required" : "Optimal"}
            />
            <KPICard
              title="Held for Review"
              value={data.batches_needing_review}
              badge="Quarantine Hold"
              subtitle="Quarantine hold (LOT-041)"
              icon={ClipboardCheck}
              accent="amber"
            />
            <KPICard
              title="First-Pass Quality"
              value={`${data.first_pass_quality_rate}%`}
              subtitle="Completed FPY (5/6 released)"
              icon={CheckCircle2}
              accent="emerald"
              badge="Completed FPY"
            />
            <KPICard
              title="Avoidable Waste Est."
              value={`${data.potential_avoidable_waste_kg ?? data.estimated_avoidable_waste_kg} kg`}
              subtitle={`Logged demo rework: ${data.logged_material_waste_kg ?? 27.0} kg`}
              icon={Trash2}
              accent="blue"
              badge="Scenario Est."
            />
          </div>

          {/* RECOMMENDED ACTIONS TODAY (Compact Dynamic Decision Support) */}
          {data.recommended_actions_today && data.recommended_actions_today.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Recommended Actions Today
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Dynamic Priority Queue ({data.recommended_actions_today.length})
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal">
                  Generated from active deviation alerts, review holds, and CAPA tasks
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                {data.recommended_actions_today.map((rec) => {
                  const isUrgent = rec.priority === "P0 Urgent" || rec.priority === "Critical";
                  const isHigh = rec.priority === "High";
                  return (
                    <div
                      key={rec.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              isUrgent
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : isHigh
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {rec.priority}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {rec.source_badge}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 leading-snug">
                          {rec.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {rec.rationale}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100/80">
                        <Link
                          href={rec.target_url}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          <span>{rec.target_label}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">First-Pass Quality Trend (% By Shift)</h3>
                  <p className="text-xs text-slate-500">Historical shift performance across monitored production lines (Capped at 100%)</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-3 h-3 rounded-full bg-teal-500 inline-block"></span>
                  <span>FPQ %</span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.quality_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fpqGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis domain={[70, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                      formatter={(val: any) => [`${Math.min(100, Number(val))}%`, "First-Pass Quality"]}
                    />
                    <Area type="monotone" dataKey="first_pass_rate" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#fpqGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Deterministic metrics from stored batch records</span>
                <span className="font-medium text-teal-700">Target Benchmark: ≥ 95.0%</span>
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Alert Severity Distribution</h3>
                <p className="text-xs text-slate-500">Rule-based deviation severity counts</p>
              </div>

              <div className="space-y-4 my-auto">
                {Object.entries(data.severity_distribution).map(([sev, count]) => {
                  let barColor = "bg-slate-400";
                  let textColor = "text-slate-700";
                  if (sev === "Critical") {
                    barColor = "bg-rose-500";
                    textColor = "text-rose-700";
                  } else if (sev === "High") {
                    barColor = "bg-amber-500";
                    textColor = "text-amber-700";
                  } else if (sev === "Medium") {
                    barColor = "bg-yellow-500";
                    textColor = "text-yellow-700";
                  } else if (sev === "Info") {
                    barColor = "bg-sky-500";
                    textColor = "text-sky-700";
                  }

                  const total = Object.values(data.severity_distribution).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);

                  return (
                    <div key={sev} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className={textColor}>{sev}</span>
                        <span className="text-slate-600">{count} events ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link
                  href="/alerts"
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center justify-between"
                >
                  <span>Open Quality Alert Center</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Tables Row: Recent Batches & Recent Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Batches */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Recent Batches</h3>
                  <p className="text-xs text-slate-500">Live & recently concluded production lots</p>
                </div>
                <Link
                  href="/batches"
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  View All Batches
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-4">Batch Code</th>
                      <th className="py-2.5 px-4">Product Profile</th>
                      <th className="py-2.5 px-4">Line</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recent_batches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {b.batch_code}
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-[180px] truncate">
                          {b.product_name}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{b.line_name}</td>
                        <td className="py-3 px-4">
                          <StatusBadge type="batch" value={b.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href={`/batches/${b.id}`}
                            className="font-medium text-teal-600 hover:text-teal-800"
                          >
                            Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Quality Alerts */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Rule-Based Deviation Alerts</h3>
                  <p className="text-xs text-slate-500">Triggered by physical boundary excursions</p>
                </div>
                <Link
                  href="/alerts"
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  All Alerts
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-4">Severity</th>
                      <th className="py-2.5 px-4">Batch & Param</th>
                      <th className="py-2.5 px-4">Observed vs Spec</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Investigate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recent_alerts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No active quality deviation alerts.
                        </td>
                      </tr>
                    ) : (
                      data.recent_alerts.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <StatusBadge type="severity" value={a.severity} />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono font-medium text-slate-900">{a.batch_code}</div>
                            <div className="text-[11px] text-slate-500">{a.parameter}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-rose-600">{a.observed_value} {a.unit}</span>
                            <span className="text-[11px] text-slate-400 block">
                              [{a.lower_limit} – {a.upper_limit} {a.unit}]
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge type="alert" value={a.status} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/investigations?alert_id=${a.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium text-[11px] transition-colors border border-teal-200"
                            >
                              5 Whys
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
