"use client";

import React, { useState } from "react";
import { X, CheckSquare, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { CorrectiveAction, ActionPriority } from "@/types";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: number;
  batchCode?: string;
  investigationId?: number;
  defaultTitle?: string;
  onActionCreated: (action: CorrectiveAction) => void;
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  batchId,
  batchCode,
  investigationId,
  defaultTitle = "",
  onActionCreated,
}) => {
  const [title, setTitle] = useState(defaultTitle || "Inspect Pneumatic Chiller Valve Actuator & Air Filtration");
  const [description, setDescription] = useState(
    "1. Replace clogged pneumatic filter cartridge on Line 01.\n2. Recalibrate chiller return valve actuator pressure to 5.5 bar.\n3. Verify emulsion cooling ramp curve before releasing batch."
  );
  const [owner, setOwner] = useState("Marc Dupont");
  const [role, setRole] = useState("Plant Manager");
  const [priority, setPriority] = useState<ActionPriority>("Critical");
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const action = await api.createAction({
        batch_id: batchId,
        investigation_id: investigationId,
        title: title.trim(),
        description: description.trim(),
        owner_name: owner,
        owner_role: role,
        priority,
        due_date: dueDate,
      });

      onActionCreated(action);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create corrective action.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Create Corrective / Preventive Action (CAPA)</h3>
            <p className="text-xs text-slate-500">
              Assign verifiable engineering containment for {batchCode ? `Batch ${batchCode}` : `Batch #${batchId}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Action Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Detailed Containment & Prevention Plan</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Owner</label>
              <select
                value={owner}
                onChange={(e) => {
                  const val = e.target.value;
                  setOwner(val);
                  if (val === "Dr. Sarah Chen") setRole("Quality Engineer");
                  else if (val === "Marc Dupont") setRole("Plant Manager");
                  else if (val === "Elena Rossi") setRole("Production Operator");
                }}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-teal-500"
              >
                <option value="Marc Dupont">Marc Dupont (Process Lead / Plant Manager)</option>
                <option value="Dr. Sarah Chen">Dr. Sarah Chen (Senior Quality Eng)</option>
                <option value="Elena Rossi">Elena Rossi (Production Operator)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ActionPriority)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-teal-500"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Target Completion Due Date</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <CheckSquare className="w-4 h-4" />
              {loading ? "Assigning..." : "Assign Action"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

