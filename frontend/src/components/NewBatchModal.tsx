"use client";

import React, { useState } from "react";
import { X, PlusCircle, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { ProductionLine, ProductProfile, Batch } from "@/types";

interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: ProductionLine[];
  products: ProductProfile[];
  onBatchCreated: (batch: Batch) => void;
}

export const NewBatchModal: React.FC<NewBatchModalProps> = ({
  isOpen,
  onClose,
  lines,
  products,
  onBatchCreated,
}) => {
  const [batchCode, setBatchCode] = useState(`LOT-${new Date().getFullYear()}-DEMO-0${Math.floor(Math.random() * 90) + 10}`);
  const [productId, setProductId] = useState<number>(products[0]?.id || 1);
  const [lineId, setLineId] = useState<number>(lines[0]?.id || 1);
  const [quantity, setQuantity] = useState<number>(5000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const created = await api.createBatch({
        batch_code: batchCode.trim(),
        product_profile_id: Number(productId),
        line_id: Number(lineId),
        target_quantity: Number(quantity),
      });

      onBatchCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create batch.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Initiate Production Batch</h3>
            <p className="text-xs text-slate-500">Configure new cosmetic manufacturing run</p>
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
            <label className="block text-xs font-medium text-slate-700 mb-1">Batch Code / Lot Identifier</label>
            <input
              type="text"
              required
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              className="w-full text-xs font-mono font-medium bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Product Formulation Profile</label>
            <select
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-teal-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Production Line</label>
            <select
              value={lineId}
              onChange={(e) => setLineId(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-1 focus:ring-teal-500"
            >
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.location_label})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Target Quantity (Units)</label>
            <input
              type="number"
              min="100"
              step="100"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
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
              <PlusCircle className="w-4 h-4" />
              {loading ? "Starting..." : "Start Batch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

