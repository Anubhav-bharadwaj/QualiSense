"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { NewBatchModal } from "@/components/NewBatchModal";
import { api } from "@/lib/api";
import { Batch, ProductionLine, ProductProfile } from "@/types";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock
} from "lucide-react";

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [products, setProducts] = useState<ProductProfile[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedLine, setSelectedLine] = useState("All");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const lineId = selectedLine === "All" ? undefined : Number(selectedLine);
      const [batchList, lineList, prodList] = await Promise.all([
        api.getBatches({ lineId, status: selectedStatus, search }),
        api.getLines(),
        api.getProducts(),
      ]);
      setBatches(batchList);
      setLines(lineList);
      setProducts(prodList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedLine, selectedStatus, search]);

  const handleBatchCreated = (newBatch: Batch) => {
    setBatches([newBatch, ...batches]);
  };

  return (
    <AppShell
      title="Production Batches"
      selectedLine={selectedLine}
      onLineChange={setSelectedLine}
      onRefreshData={fetchData}
    >
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by lot or batch code (e.g. LOT-2026)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Quality Review">Quality Review</option>
              <option value="Released">Released</option>
              <option value="Rework">Rework</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Batch</span>
        </button>
      </div>

      {/* Batches Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Batch Identifier</th>
                <th className="py-3 px-4">Product Profile</th>
                <th className="py-3 px-4">Assigned Line</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">First-Pass</th>
                <th className="py-3 px-4">Alerts</th>
                <th className="py-3 px-4">Target Units</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && batches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                    Loading production batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No production batches found matching the selected filters.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/batches/${batch.id}`}
                        className="font-mono font-semibold text-teal-700 hover:text-teal-900 underline-offset-2 hover:underline"
                      >
                        {batch.batch_code}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{batch.product_name}</div>
                      <div className="text-[11px] text-slate-500">{batch.product_category}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{batch.line_name}</td>
                    <td className="py-3 px-4">
                      <StatusBadge type="batch" value={batch.status} />
                    </td>
                    <td className="py-3 px-4">
                      {batch.first_pass_quality ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          First-Time Right
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Deviation Flagged
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {batch.alert_count > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">
                          {batch.alert_count} alert{batch.alert_count > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {batch.target_quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(batch.started_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/batches/${batch.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 font-semibold text-xs transition-colors border border-slate-200 hover:border-teal-200"
                      >
                        <span>Telemetry</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewBatchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lines={lines}
        products={products}
        onBatchCreated={handleBatchCreated}
      />
    </AppShell>
  );
}

