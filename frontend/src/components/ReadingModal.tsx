"use client";

import React, { useState } from "react";
import { X, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { BatchDetail, QualityAlert } from "@/types";

interface ReadingModalProps {
  batch: BatchDetail;
  isOpen: boolean;
  onClose: () => void;
  onReadingAdded: (alert?: QualityAlert) => void;
}

export const ReadingModal: React.FC<ReadingModalProps> = ({
  batch,
  isOpen,
  onClose,
  onReadingAdded,
}) => {
  const [stage, setStage] = useState("Cooling");
  const [parameter, setParameter] = useState("Temperature");
  const [value, setValue] = useState<string>("41.5");
  const [operator, setOperator] = useState("Elena Rossi");
  const [source, setSource] = useState("Inline Sensor Probe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Derive unit and bounds from product profile
  const limits = batch.parameter_limits?.[parameter] || { min: 35, max: 40, unit: "°C" };
  const unit = limits.unit || "°C";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError("Please enter a valid numeric value.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.addReading(batch.id, {
        stage,
        parameter,
        value: numValue,
        unit,
        operator_name: operator,
        source,
      });

      onReadingAdded(res.alert);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit reading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Record Production Reading</h3>
            <p className="text-xs text-slate-500">
              Batch: <span className="font-mono font-medium text-slate-800">{batch.batch_code}</span> ({batch.product_name})
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Process Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-teal-500"
              >
                <option value="Pre-mix">1. Pre-mix</option>
                <option value="Mixing & Heating">2. Mixing & Heating</option>
                <option value="Homogenization">3. Homogenization</option>
                <option value="Cooling">4. Cooling</option>
                <option value="Filling">5. Filling</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Parameter</label>
              <select
                value={parameter}
                onChange={(e) => {
                  const newParam = e.target.value;
                  setParameter(newParam);
                  // Provide sensible demo defaults
                  if (newParam === "Temperature") setValue("42.5");
                  else if (newParam === "pH") setValue("5.45");
                  else if (newParam === "Mixing speed") setValue("820");
                  else if (newParam === "Viscosity") setValue("3150");
                  else if (newParam === "Filling quantity") setValue("200.0");
                }}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-teal-500"
              >
                <option value="Temperature">Temperature (°C)</option>
                <option value="pH">pH (pH)</option>
                <option value="Mixing speed">Mixing speed (RPM)</option>
                <option value="Viscosity">Viscosity (cP)</option>
                <option value="Filling quantity">Filling quantity (ml)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">Observed Value ({unit})</label>
              <span className="text-[11px] text-slate-500">
                Target Limits: <strong className="text-slate-700">{limits.min} – {limits.max} {unit}</strong>
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg p-2.5 pr-12 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">{unit}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Entering a value outside <span className="font-mono font-medium">{limits.min}–{limits.max}</span> will trigger the backend Rule Engine and generate an alert.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Operator on Duty</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800"
              >
                <option value="Inline Sensor Probe">Inline Sensor Probe</option>
                <option value="Manual Sensor Check">Manual Sensor Check</option>
                <option value="Lab Verification">Lab Verification</option>
              </select>
            </div>
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
              <CheckCircle2 className="w-4 h-4" />
              {loading ? "Evaluating Rules..." : "Record & Evaluate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

