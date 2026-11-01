"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { ReadingModal } from "@/components/ReadingModal";
import { api } from "@/lib/api";
import { BatchDetail, QualityAlert, BatchStatus, MLPrediction } from "@/types";
import {
  Boxes,
  Plus,
  AlertTriangle,
  GitBranch,
  ShieldCheck,
  CheckCircle,
  Clock,
  Gauge,
  Cpu,
  FileText,
  Activity,
  ArrowLeft,
  ChevronRight,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = Number(params?.id);

  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [dispositionNotes, setDispositionNotes] = useState("");
  const [targetStatus, setTargetStatus] = useState<BatchStatus>("Quality Review");
  const [dispositionLoading, setDispositionLoading] = useState(false);
  const [mlPrediction, setMlPrediction] = useState<MLPrediction | null>(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchBatch = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const data = await api.getBatchDetail(batchId);
      setBatch(data);
      setTargetStatus(data.status);
      setDispositionNotes(data.disposition_notes || "");

      // Run ML risk prediction on latest readings if available
      if (data.readings && data.readings.length > 0) {
        fetchMlRisk(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMlRisk = async (batchData: BatchDetail) => {
    setMlLoading(true);
    try {
      // Find latest readings for each parameter
      const findParam = (p: string, defaultVal: number) => {
        const match = [...batchData.readings].reverse().find((r) => r.parameter === p);
        return match ? match.value : defaultVal;
      };

      const pred = await api.predictMLRisk({
        temperature: findParam("Temperature", 37.5),
        ph: findParam("pH", 5.5),
        mixing_speed: findParam("Mixing speed", 800),
        viscosity: findParam("Viscosity", 3150),
        filling_quantity: findParam("Filling quantity", 200),
      });
      setMlPrediction(pred);
    } catch (err) {
      console.error("ML Prediction fetch error:", err);
    } finally {
      setMlLoading(false);
    }
  };

  useEffect(() => {
    fetchBatch();
  }, [batchId]);

  const handleReadingAdded = (alert?: QualityAlert) => {
    fetchBatch();
    if (alert) {
      setToastMessage(`Rule Engine Alert Triggered: ${alert.severity} deviation on ${alert.parameter}!`);
    } else {
      setToastMessage("Reading recorded: Parameter within normal configured limits.");
    }
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleUpdateDisposition = async () => {
    if (!batch) return;
    setDispositionLoading(true);
    try {
      await api.updateBatchDisposition(batch.id, {
        status: targetStatus,
        disposition_notes: dispositionNotes,
      });
      fetchBatch();
      setToastMessage(`Batch disposition status updated to "${targetStatus}".`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert("Error updating disposition: " + err.message);
    } finally {
      setDispositionLoading(false);
    }
  };

  // Prepare chart series from historical readings
  const chartData = (batch?.readings || []).map((r, idx) => ({
    time: new Date(r.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    stage: `${idx + 1}. ${r.stage}`,
    parameter: r.parameter,
    value: r.value,
    unit: r.unit,
  }));

  return (
    <AppShell title={batch ? `Batch ${batch.batch_code}` : "Batch Detail"} onRefreshData={fetchBatch}>
      {/* Back button */}
      <div className="flex items-center gap-2 text-xs">
        <Link
          href="/batches"
          className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Batches
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-mono font-medium">{batch?.batch_code || "Loading..."}</span>
      </div>

      {toastMessage && (
        <div className="p-3 bg-teal-900 text-teal-200 border border-teal-700 rounded-xl text-xs font-medium flex items-center gap-2 shadow-md">
          <CheckCircle className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {loading && !batch && (
        <div className="p-12 text-center text-slate-500">Loading batch details...</div>
      )}

      {batch && (
        <>
          {/* Active Alert Banner if batch has open alert */}
          {batch.alerts.some((a) => a.status !== "Resolved") && (
            <div className="bg-rose-50 border border-rose-200/90 rounded-xl p-4 text-rose-900 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-rose-950">Active Quality Rule Alert Flagged</h3>
                    <span className="text-[10px] font-semibold uppercase bg-rose-200 text-rose-800 px-2 py-0.5 rounded">
                      Action Required
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 mt-0.5">
                    {batch.alerts.find((a) => a.status !== "Resolved")?.explanation}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/investigations?alert_id=${batch.alerts.find((a) => a.status !== "Resolved")?.id || 1}`}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>Launch 5 Whys Root Cause</span>
                </Link>
              </div>
            </div>
          )}

          {/* Batch Summary Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold font-mono text-slate-900">{batch.batch_code}</h1>
                  <StatusBadge type="batch" value={batch.status} />
                  {batch.first_pass_quality ? (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      First-Time Right
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Deviation In-Process
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Product: <strong className="text-slate-800">{batch.product_name}</strong> ({batch.product_category}) • Line: <strong className="text-slate-800">{batch.line_name}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReadingModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Reading</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block">Target Units</span>
                <span className="font-semibold text-slate-800">{batch.target_quantity.toLocaleString()} units</span>
              </div>
              <div>
                <span className="text-slate-400 block">Started At</span>
                <span className="font-semibold text-slate-800">
                  {new Date(batch.started_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Readings</span>
                <span className="font-semibold text-slate-800">{batch.readings.length} recorded</span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Alerts</span>
                <span className="font-semibold text-slate-800">{batch.alerts.length} flagged</span>
              </div>
            </div>
          </div>

          {/* Configured Limits & Reference Guide */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Configured Process Limits Profile</h3>
                <p className="text-xs text-slate-400">Illustrative demonstration boundaries for this formulation profile (Not official specs)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {Object.entries(batch.parameter_limits || {}).map(([param, spec]: [string, any]) => (
                <div key={param} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="text-xs font-semibold text-slate-700">{param}</div>
                  <div className="mt-1 text-base font-bold text-slate-900 font-mono">
                    {spec.min} – {spec.max} <span className="text-xs font-normal text-slate-500">{spec.unit}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 leading-tight">
                    Critical bounds: {spec.critical_min}–{spec.critical_max} {spec.unit}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Telemetry Readings Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Process Parameter Readings History</h3>
                <p className="text-xs text-slate-500">Chronological telemetry evaluated against product profile rules</p>
              </div>
              <button
                onClick={() => setIsReadingModalOpen(true)}
                className="text-xs font-medium text-teal-600 hover:text-teal-800 flex items-center gap-1"
              >
                + Add Reading
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-4">Stage</th>
                    <th className="py-2.5 px-4">Parameter</th>
                    <th className="py-2.5 px-4">Observed Reading</th>
                    <th className="py-2.5 px-4">Configured Spec</th>
                    <th className="py-2.5 px-4">Rule Evaluation</th>
                    <th className="py-2.5 px-4">Operator / Source</th>
                    <th className="py-2.5 px-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batch.readings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No telemetry readings recorded for this batch yet.
                      </td>
                    </tr>
                  ) : (
                    batch.readings.map((r) => {
                      const limits = batch.parameter_limits?.[r.parameter];
                      const isOutOfSpec = limits ? (r.value < limits.min || r.value > limits.max) : false;
                      const isCritical = limits ? (r.value < (limits.critical_min || limits.min) || r.value > (limits.critical_max || limits.max)) : false;

                      return (
                        <tr
                          key={r.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isOutOfSpec ? "bg-rose-50/40" : ""
                          }`}
                        >
                          <td className="py-3 px-4 font-medium text-slate-800">{r.stage}</td>
                          <td className="py-3 px-4 font-medium text-slate-700">{r.parameter}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-mono font-bold text-sm ${
                                isCritical
                                  ? "text-rose-600 underline font-extrabold"
                                  : isOutOfSpec
                                  ? "text-amber-600 font-bold"
                                  : "text-emerald-700"
                              }`}
                            >
                              {r.value} {r.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {limits ? `${limits.min} – ${limits.max} ${r.unit}` : "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            {isCritical ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                CRITICAL EXCURSION
                              </span>
                            ) : isOutOfSpec ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                HIGH DEVIATION
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                IN-RANGE (PASS)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div>{r.operator_name}</div>
                            <div className="text-[10px] text-slate-400">{r.source}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(r.recorded_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Row: Batch Disposition Controls & ML Risk Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Batch Disposition & Quality Signoff */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Batch Quality Disposition Decision</h3>
                <p className="text-xs text-slate-500">
                  Human quality engineer review protocol (Prototype does not auto-release/reject)
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select Disposition Status</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as BatchStatus)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="Quality Review">Quality Review (Hold for engineering review)</option>
                    <option value="In Progress">In Progress (Active processing)</option>
                    <option value="Released">Released (Quality release for packaging)</option>
                    <option value="Rework">Rework (Marked for reprocessing / shear trim)</option>
                    <option value="Rejected">Rejected (Bulk scrapped)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Engineer Disposition Notes & Evidence
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter engineering justification, lab sample IDs, or disposition sign-off remarks..."
                    value={dispositionNotes}
                    onChange={(e) => setDispositionNotes(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    Sign-off: Dr. Sarah Chen (Senior Quality Eng)
                  </span>
                  <button
                    onClick={handleUpdateDisposition}
                    disabled={dispositionLoading}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {dispositionLoading ? "Saving..." : "Save Disposition Sign-off"}
                  </button>
                </div>
              </div>
            </div>

            {/* Optional ML Defect Risk Signal Panel */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-semibold text-slate-900">Defect Risk Estimate (ML Signal)</h3>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                    {mlPrediction?.model_version || "v0.1-synthetic-rf"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Secondary decision-support model trained on synthetic process parameter deviations.
                </p>
              </div>

              {mlLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Evaluating multi-variate feature model...</div>
              ) : mlPrediction ? (
                <div className="space-y-3 my-2">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Predicted Defect Risk Likelihood</span>
                      <span className="text-xl font-bold font-mono text-slate-900">
                        {Math.round(mlPrediction.defect_risk_probability * 100)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block text-right">Risk Classification</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          mlPrediction.risk_level === "Critical"
                            ? "bg-rose-100 text-rose-700 border border-rose-300"
                            : mlPrediction.risk_level === "Elevated"
                            ? "bg-amber-100 text-amber-700 border border-amber-300"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                        }`}
                      >
                        {mlPrediction.risk_level}
                      </span>
                    </div>
                  </div>

                  {/* Feature importance breakdown */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                      Top Contributing Feature Deviations:
                    </span>
                    <div className="space-y-1.5">
                      {mlPrediction.top_contributing_features.slice(0, 3).map((feat, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] text-slate-600">
                          <span>{feat.feature}</span>
                          <span className="font-mono font-medium">Δ {feat.delta} {feat.unit} (weight: {feat.weight})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">ML signal unavailable.</div>
              )}

              <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 leading-normal flex items-start gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Disclaimer:</strong> Synthetic model for technical integration demonstration only. Never overrides configured physical limits or engineer authorization.
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {batch && (
        <ReadingModal
          batch={batch}
          isOpen={isReadingModalOpen}
          onClose={() => setIsReadingModalOpen(false)}
          onReadingAdded={handleReadingAdded}
        />
      )}
    </AppShell>
  );
}

