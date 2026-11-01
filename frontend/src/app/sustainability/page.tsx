"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { KPICard } from "@/components/KPICard";
import { api } from "@/lib/api";
import { SustainabilitySummary } from "@/types";
import {
  Leaf,
  Droplets,
  Zap,
  Trash2,
  Sliders,
  TrendingDown,
  Info,
  RefreshCw,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckSquare
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

interface InterventionOption {
  id: string;
  name: string;
  targetParameter: string;
  defectReductionPct: number;
  waterSavingsFactor: number;
  energySavingsFactor: number;
  description: string;
}

const INTERVENTIONS: InterventionOption[] = [
  {
    id: "thermal_cooling_trim",
    name: "Automated In-Line Cooling Jacket Controller",
    targetParameter: "Cooling Temperature (35–40 °C)",
    defectReductionPct: 85,
    waterSavingsFactor: 0.85,
    energySavingsFactor: 0.85,
    description: "Proactive pneumatic valve modulation intercepts cooling jacket thermal overshoot before bulk emulsion destabilizes."
  },
  {
    id: "shear_vfd_inverter",
    name: "High-Shear Rotor-Stator VFD Agitation Inverter",
    targetParameter: "Bulk Viscosity (2,800–3,500 cP)",
    defectReductionPct: 75,
    waterSavingsFactor: 0.75,
    energySavingsFactor: 0.70,
    description: "Variable frequency drive dynamically stabilizes agitation torque to prevent viscosity collapse during high-shear phases."
  },
  {
    id: "cip_turbidity_recirc",
    name: "Turbidity-Sensing CIP Recirculation Loop",
    targetParameter: "Clean-In-Place Water & CIP Detergents",
    defectReductionPct: 65,
    waterSavingsFactor: 0.90,
    energySavingsFactor: 0.75,
    description: "Optical turbidity sensors recover pre-rinse washdown water, drastically reducing clean water consumption during CIP."
  },
  {
    id: "raw_material_premix",
    name: "Standardized Raw Material Pre-Mixing Protocol",
    targetParameter: "Emulsion Phase Separation",
    defectReductionPct: 80,
    waterSavingsFactor: 0.80,
    energySavingsFactor: 0.80,
    description: "Standardized surfactant hydration timing eliminates polymer clump formation and reduces vessel wall scraping."
  }
];

export default function SustainabilityPage() {
  const [data, setData] = useState<SustainabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Intervention Simulator state
  const [selectedInterventionId, setSelectedInterventionId] = useState(INTERVENTIONS[0].id);
  const [campaignUnits, setCampaignUnits] = useState(20000); // 20,000 units campaign
  const [baselineDefectRate, setBaselineDefectRate] = useState(6.5); // 6.5% typical benchmark

  // Interactive Scenario Simulator state
  const [simUnits, setSimUnits] = useState(5000);
  const [avoidancePct, setAvoidancePct] = useState(85);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.getSustainabilitySummary();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Transparent calculation factors
  const matFactor = 0.045; // kg/unit
  const waterFactor = 1.80; // L/unit
  const energyFactor = 0.22; // kWh/unit
  const co2Factor = 0.095; // kg CO2e/unit

  // Active intervention calculations
  const activeIntervention = INTERVENTIONS.find((i) => i.id === selectedInterventionId) || INTERVENTIONS[0];
  const baselineReworkUnits = Math.round(campaignUnits * (baselineDefectRate / 100));
  const postInterventionReworkUnits = Math.round(baselineReworkUnits * (1 - activeIntervention.defectReductionPct / 100));
  const avoidedReworkUnits = baselineReworkUnits - postInterventionReworkUnits;

  // Before vs After values
  const beforeMat = Math.round(baselineReworkUnits * matFactor);
  const afterMat = Math.round(postInterventionReworkUnits * matFactor);

  const beforeWater = Math.round(baselineReworkUnits * waterFactor);
  const afterWater = Math.round(postInterventionReworkUnits * waterFactor * (1 - (activeIntervention.waterSavingsFactor - (1 - activeIntervention.defectReductionPct / 100))));

  const beforeEnergy = Math.round(baselineReworkUnits * energyFactor);
  const afterEnergy = Math.round(postInterventionReworkUnits * energyFactor);

  const beforeCo2 = Math.round(baselineReworkUnits * co2Factor);
  const afterCo2 = Math.round(postInterventionReworkUnits * co2Factor);

  const interventionComparisonChart = [
    {
      metric: "Material Waste (kg)",
      "Before Intervention": beforeMat,
      "With Intervention": afterMat,
      saved: beforeMat - afterMat
    },
    {
      metric: "CIP Water (x10 L)",
      "Before Intervention": Math.round(beforeWater / 10),
      "With Intervention": Math.round(afterWater / 10),
      saved: Math.round((beforeWater - afterWater) / 10)
    },
    {
      metric: "Energy (kWh)",
      "Before Intervention": beforeEnergy,
      "With Intervention": afterEnergy,
      saved: beforeEnergy - afterEnergy
    },
    {
      metric: "Emissions (kg CO2e)",
      "Before Intervention": beforeCo2,
      "With Intervention": afterCo2,
      saved: beforeCo2 - afterCo2
    }
  ];

  return (
    <AppShell title="Sustainability & Avoidable Rework Resource Accounting" onRefreshData={fetchSummary}>
      {loading && !data ? (
        <div className="p-16 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
          Loading sustainability accounting records...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Banner Notice */}
          <div className="p-4 bg-teal-900 text-white rounded-xl border border-teal-800 shadow-md flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-800 text-teal-300 mt-0.5 shrink-0">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Getting Quality Right First Time — Resource Conservation</h3>
                <span className="text-[10px] font-semibold uppercase bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
                  Option 02 Methodology
                </span>
              </div>
              <p className="text-xs text-teal-200 mt-0.5 leading-relaxed">
                By intercepting thermal and viscosity excursions during early compounding rather than discovering defects during packaging or laboratory release, QualiSense AI enables targeted process trimming. Preventing batch dumps eliminates secondary Clean-In-Place (CIP) washdowns and cosmetic bulk scrapping.
              </p>
            </div>
          </div>

          {/* KPI RECONCILIATION & SCOPE SEPARATION (Requirement 7) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Measured Demonstration History */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      1. Logged Demonstration Consumption
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    Recorded Actuals
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Material and resource burdens incurred from historical rework executed on Batch <strong>LOT-2026-HYD-039</strong> (600 units reprocessed).
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-100">
                    <span className="text-slate-500 block text-[10px]">Material Scrapped</span>
                    <strong className="text-base font-bold font-mono text-rose-900">{data?.total_material_waste_kg || 27.0} kg</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">0.045 kg/unit bulk scrap</span>
                  </div>
                  <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100">
                    <span className="text-slate-500 block text-[10px]">CIP Water Used</span>
                    <strong className="text-base font-bold font-mono text-blue-900">{(data?.total_water_consumption_l || 1080).toLocaleString()} L</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">3-stage tank rinse</span>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
                    <span className="text-slate-500 block text-[10px]">Process Energy</span>
                    <strong className="text-base font-bold font-mono text-amber-900">{data?.total_energy_consumption_kwh || 132} kWh</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Re-heating & shear</span>
                  </div>
                  <div className="p-3 bg-slate-100/60 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Carbon Footprint</span>
                    <strong className="text-base font-bold font-mono text-slate-800">{data?.total_co2_kg || 57.0} kg CO₂e</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Grid + detergent factor</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>Scope: Historical campaign runs</span>
                <span className="font-mono text-rose-700 font-semibold">600 reworked units</span>
              </div>
            </div>

            {/* 2. Prospective Avoidable Waste (Batch LOT-041) */}
            <div className="bg-white border border-teal-200 bg-teal-50/20 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-teal-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                      2. Potential Avoidable Waste (Active Incident)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-300">
                    Prospective Avoidance
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Potential bulk loss prevented if early cooling intervention succeeds on quarantined batch <strong>LOT-2026-HYD-041</strong> (5,000 units).
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-slate-500 block text-[10px]">Avoidable Bulk Scrap</span>
                    <strong className="text-base font-bold font-mono text-emerald-950">{data?.avoided_material_kg || 225.0} kg</strong>
                    <span className="text-[10px] text-emerald-700 block mt-0.5">5,000-unit lot saved</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-slate-500 block text-[10px]">Avoidable CIP Water</span>
                    <strong className="text-base font-bold font-mono text-blue-950">{(data?.avoided_water_l || 9000).toLocaleString()} L</strong>
                    <span className="text-[10px] text-blue-700 block mt-0.5">Zero tank washdown</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-slate-500 block text-[10px]">Avoidable Energy</span>
                    <strong className="text-base font-bold font-mono text-amber-950">{(data?.avoided_energy_kwh || 1100).toLocaleString()} kWh</strong>
                    <span className="text-[10px] text-amber-700 block mt-0.5">Zero re-homogenization</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Avoidable Emissions</span>
                    <strong className="text-base font-bold font-mono text-slate-900">{data?.avoided_co2_kg || 475.0} kg CO₂e</strong>
                    <span className="text-[10px] text-slate-600 block mt-0.5">Avoided greenhouse gas</span>
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-slate-600 pt-2 border-t border-teal-100 flex items-center justify-between">
                <span>Scope: Batch LOT-2026-HYD-041</span>
                <span className="font-mono text-teal-800 font-semibold">5,000 units in scope</span>
              </div>
            </div>
          </div>

          {/* HYPOTHETICAL INTERVENTION COMPARISON SIMULATOR (Requirement 8) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Hypothetical Intervention Simulator: Before vs After Impact Comparison
                  </h3>
                  <span className="text-[10px] font-semibold uppercase bg-teal-100 text-teal-800 px-2 py-0.5 rounded border border-teal-300">
                    Scenario Model
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Evaluate resource conservation dividends for potential plant quality engineering projects.
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Transparent Reference Multipliers (0.045 kg/u, 1.80 L/u, 0.22 kWh/u, 0.095 kg CO₂e/u)
              </span>
            </div>

            {/* Selector and Parameter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-xs font-semibold text-slate-800 block">
                  Select Engineering Intervention:
                </label>
                <select
                  value={selectedInterventionId}
                  onChange={(e) => setSelectedInterventionId(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:ring-1 focus:ring-teal-500"
                >
                  {INTERVENTIONS.map((inter) => (
                    <option key={inter.id} value={inter.id}>
                      {inter.name} (-{inter.defectReductionPct}%)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 pt-1 leading-snug">
                  {activeIntervention.description}
                </p>
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Annual Plant Production Volume:</span>
                  <span className="font-mono text-teal-700 font-bold">{campaignUnits.toLocaleString()} units</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="5000"
                  value={campaignUnits}
                  onChange={(e) => setCampaignUnits(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>5,000 (Single line)</span>
                  <span>20,000 (Bay default)</span>
                  <span>100,000 (Facility-wide)</span>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Baseline Defect Excursion Rate:</span>
                  <span className="font-mono text-teal-700 font-bold">{baselineDefectRate}%</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="15.0"
                  step="0.5"
                  value={baselineDefectRate}
                  onChange={(e) => setBaselineDefectRate(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>2.0% (Tight control)</span>
                  <span>6.5% (Benchmark)</span>
                  <span>15.0% (High drift)</span>
                </div>
              </div>
            </div>

            {/* Before vs After Comparison Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Defect Units</span>
                <div className="mt-1">
                  <span className="text-xs text-slate-400 line-through block font-mono">{baselineReworkUnits}</span>
                  <span className="text-base font-bold font-mono text-slate-900">{postInterventionReworkUnits}</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                  -{avoidedReworkUnits} units avoided
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Material Scrap</span>
                <div className="mt-1">
                  <span className="text-xs text-slate-400 line-through block font-mono">{beforeMat} kg</span>
                  <span className="text-base font-bold font-mono text-slate-900">{afterMat} kg</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                  -{beforeMat - afterMat} kg saved
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">CIP Rinse Water</span>
                <div className="mt-1">
                  <span className="text-xs text-slate-400 line-through block font-mono">{beforeWater.toLocaleString()} L</span>
                  <span className="text-base font-bold font-mono text-slate-900">{afterWater.toLocaleString()} L</span>
                </div>
                <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">
                  -{(beforeWater - afterWater).toLocaleString()} L saved
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Process Energy</span>
                <div className="mt-1">
                  <span className="text-xs text-slate-400 line-through block font-mono">{beforeEnergy.toLocaleString()} kWh</span>
                  <span className="text-base font-bold font-mono text-slate-900">{afterEnergy.toLocaleString()} kWh</span>
                </div>
                <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">
                  -{(beforeEnergy - afterEnergy).toLocaleString()} kWh saved
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">CO₂e Emissions</span>
                <div className="mt-1">
                  <span className="text-xs text-slate-400 line-through block font-mono">{beforeCo2.toLocaleString()} kg</span>
                  <span className="text-base font-bold font-mono text-slate-900">{afterCo2.toLocaleString()} kg</span>
                </div>
                <span className="text-[10px] text-slate-700 font-semibold mt-0.5 block">
                  -{(beforeCo2 - afterCo2).toLocaleString()} kg CO₂e
                </span>
              </div>

              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between">
                <span className="text-[10px] text-emerald-800 uppercase block font-semibold">Intervention Efficacy</span>
                <span className="text-xl font-bold font-mono text-emerald-900">
                  -{activeIntervention.defectReductionPct}%
                </span>
                <span className="text-[10px] text-emerald-700 block">Reduction in rework</span>
              </div>
            </div>

            {/* Grouped Bar Chart: Before vs After */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interventionComparisonChart} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="metric" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "12px" }}
                  />
                  <Legend />
                  <Bar dataKey="Before Intervention" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  <Bar dataKey="With Intervention" fill="#0d9488" radius={[4, 4, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Methodology & Disclosure Callout */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
              <p>
                <strong>SCENARIO ESTIMATE — UNVERIFIED PROTOTYPE MODEL:</strong> All calculated savings are decision-support projections calculated using transparent baseline engineering reference multipliers (0.045 kg bulk loss/unit, 1.80 L CIP rinse/unit, 0.22 kWh re-shear/unit, 0.095 kg CO₂e/unit).
              </p>
              <p className="text-[11px] text-slate-400">
                These estimates do not represent certified L&apos;Oréal corporate carbon accounting or third-party audited Life Cycle Assessment (LCA).
              </p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
