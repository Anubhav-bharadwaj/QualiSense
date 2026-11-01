"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { ActionModal } from "@/components/ActionModal";
import { api } from "@/lib/api";
import { CorrectiveAction, ActionStatus, ActionPriority } from "@/types";
import {
  CheckSquare,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  RefreshCw,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function ActionsPage() {
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [completionNote, setCompletionNote] = useState("");

  const fetchActions = async () => {
    setLoading(true);
    try {
      const data = await api.getActions({
        status: selectedStatus,
        priority: selectedPriority,
      });
      setActions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [selectedStatus, selectedPriority]);

  const handleUpdateStatus = async (actionId: number, newStatus: ActionStatus, note?: string) => {
    try {
      const updated = await api.updateAction(actionId, {
        status: newStatus,
        completion_note: note || undefined,
      });
      setActions(actions.map((a) => (a.id === actionId ? updated : a)));
      setCompletingId(null);
      setCompletionNote("");
    } catch (err: any) {
      alert("Failed to update action: " + err.message);
    }
  };

  const handleActionCreated = (newAction: CorrectiveAction) => {
    setActions([newAction, ...actions]);
  };

  return (
    <AppShell title="Corrective & Preventive Action Centre (CAPA)" onRefreshData={fetchActions}>
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-600">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Verified">Verified</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-600">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Action Plan</span>
        </button>
      </div>

      {/* Actions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Action Title & Scope</th>
                <th className="py-3 px-4">Target Lot</th>
                <th className="py-3 px-4">Assigned Owner</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && actions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Loading corrective actions...
                  </td>
                </tr>
              ) : actions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No corrective actions found matching criteria.
                  </td>
                </tr>
              ) : (
                actions.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          act.priority === "Critical"
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : act.priority === "High"
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-blue-100 text-blue-800 border border-blue-300"
                        }`}
                      >
                        {act.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900">{act.title}</div>
                      <p className="text-slate-500 text-[11px] mt-0.5 whitespace-pre-line leading-relaxed">
                        {act.description}
                      </p>
                      {act.completion_note && (
                        <div className="mt-1.5 p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px]">
                          <strong>Verification Note:</strong> {act.completion_note}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      {act.batch_code ? (
                        <Link href={`/batches/${act.batch_id}`} className="text-teal-700 hover:underline">
                          {act.batch_code}
                        </Link>
                      ) : (
                        `#${act.batch_id}`
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{act.owner_name}</div>
                      <div className="text-[11px] text-slate-400">{act.owner_role}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono">
                      {act.due_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge type="action" value={act.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {act.status === "Open" && (
                          <button
                            onClick={() => handleUpdateStatus(act.id, "In Progress")}
                            className="px-2.5 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                          >
                            Start Work
                          </button>
                        )}

                        {act.status === "In Progress" && completingId !== act.id && (
                          <button
                            onClick={() => {
                              setCompletingId(act.id);
                              setCompletionNote("Inspected and verified under maintenance protocol.");
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                          >
                            Mark Completed
                          </button>
                        )}

                        {completingId === act.id && (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={completionNote}
                              onChange={(e) => setCompletionNote(e.target.value)}
                              placeholder="Completion note..."
                              className="text-[11px] border border-slate-300 rounded px-2 py-1 w-44"
                            />
                            <button
                              onClick={() => handleUpdateStatus(act.id, "Completed", completionNote)}
                              className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-medium"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setCompletingId(null)}
                              className="px-1 text-slate-400 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        )}

                        {act.status === "Completed" && (
                          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
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

      <ActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        batchId={1}
        batchCode="LOT-2026-HYD-041"
        onActionCreated={handleActionCreated}
      />
    </AppShell>
  );
}

