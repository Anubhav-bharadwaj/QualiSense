"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  FlaskConical,
  ShieldCheck,
  ArrowRight,
  Activity,
  AlertTriangle,
  GitBranch,
  CheckSquare,
  BarChart3,
  Leaf,
  Cpu,
  ChevronRight,
  Sparkles,
  Lock,
  CheckCircle2,
  TrendingDown,
  Clock,
  ExternalLink
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "alerts" | "investigation" | "capa" | "sustainability" | "secom">("dashboard");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Banner: Competition & Synthetic Notice */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 border-b border-teal-500/20 px-4 py-2 text-center text-xs text-slate-300 flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 font-semibold text-[10px] uppercase tracking-wide border border-teal-500/30">
          <ShieldCheck className="w-3 h-3 text-teal-400" />
          Challenge Option 02
        </span>
        <span>
          <strong>Getting Quality Right First Time:</strong> Preventing recurring cosmetic quality problems earlier in the process.
        </span>
        <span className="hidden md:inline text-slate-500">•</span>
        <span className="hidden md:inline text-amber-300/90 text-[11px] font-medium">
          Demonstration Prototype with Simulated Cosmetics & Real UCI SECOM Dataset
        </span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-sm shadow-teal-950">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-white text-lg tracking-tight">QualiSense AI</span>
            <span className="block text-[11px] text-teal-400 font-medium">Cosmetic Defect Prevention</span>
          </div>
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#challenge" className="hover:text-teal-400 transition-colors">The Challenge</a>
          <a href="#capabilities" className="hover:text-teal-400 transition-colors">Capabilities</a>
          <a href="#workflow" className="hover:text-teal-400 transition-colors">6-Stage Flow</a>
          <a href="#preview" className="hover:text-teal-400 transition-colors">Interactive Demo</a>
          <a href="#architecture" className="hover:text-teal-400 transition-colors">Architecture</a>
        </nav>

        {/* Auth CTA Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 font-semibold text-xs tracking-wide shadow-md shadow-teal-500/20 transition-all"
            >
              Enter Plant Console
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md shadow-teal-600/30 transition-all"
              >
                Request Access
                <ArrowRight className="w-3 h-3" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 px-6 lg:px-12 border-b border-slate-800/80">
        {/* Glow ambient background lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-teal-500/10 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-teal-500/40 text-teal-300 text-xs font-medium shadow-inner shadow-teal-950">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>PREDICTIVE QUALITY MONITORING & DEFECT PREVENTION</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
            Catch Quality Deviations <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400">
              Before They Become Manufacturing Waste.
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            QualiSense AI empowers cosmetics manufacturing plants to shift from reactive end-of-line rejection to proactive in-process defect prevention. Track live process anomalies, trace root causes with structured 5 Whys & Fishbone diagrams, and quantify environmental savings from eliminated rework.
          </p>

          {/* Hero CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/20 transition-all hover:scale-[1.02]"
            >
              <span>Explore Live Platform Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm transition-all"
            >
              <Lock className="w-4 h-4 text-teal-400" />
              <span>Sign In with Demo Accounts</span>
            </Link>
          </div>

          {/* Quick Demo Accounts Pill */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="text-slate-500">Quick Demo Roles:</span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-teal-300">
              Admin
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-teal-300">
              Quality Engineer
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-teal-300">
              Production Manager
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-teal-300">
              Viewer
            </span>
          </div>

          {/* Hero Live Preview Card */}
          <div className="pt-10 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-5 md:p-7 text-left space-y-5 backdrop-blur-xl">
              {/* Card top bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-teal-500/80" />
                  </div>
                  <span className="text-xs font-mono text-slate-400">Plant 04 • High-Precision Emulsion Line 01</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-semibold border border-rose-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                    P0 Deviation Active
                  </span>
                  <span className="text-[11px] text-slate-400">LOT-2026-HYD-041</span>
                </div>
              </div>

              {/* Card 4 KPI Highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">Monitored Batches</span>
                  <p className="text-xl font-extrabold text-white">8 Batches</p>
                  <span className="text-[10px] text-teal-400 font-medium">100% telemetry coverage</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">First-Pass Quality</span>
                  <p className="text-xl font-extrabold text-teal-400">83.3%</p>
                  <span className="text-[10px] text-slate-400">Unified calculation across app</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">Active Alerts</span>
                  <p className="text-xl font-extrabold text-rose-400">1 Critical</p>
                  <span className="text-[10px] text-rose-300/80">Cooling Temp 42.8 °C &gt; 42.0</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">CO₂ Rework Avoided</span>
                  <p className="text-xl font-extrabold text-emerald-400">18.4 kg</p>
                  <span className="text-[10px] text-emerald-400/80">62.0 kWh energy saved</span>
                </div>
              </div>

              {/* Mini Interactive Preview Callout */}
              <div className="p-3.5 rounded-xl bg-teal-950/30 border border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-300 space-y-0.5">
                  <span className="font-semibold text-teal-300">Live Guided Scenario:</span>
                  <p className="text-slate-400 text-[11px]">
                    Inspect how operator Elena Rossi&apos;s early sensor reading triggered a high-temperature warning, initiated a 5 Whys dossier, executed CAPA, and verified heat exchanger valve maintenance.
                  </p>
                </div>
                <Link
                  href={user ? "/batches/1" : "/login?redirect=/batches/1"}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold transition-colors"
                >
                  Inspect Incident
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: The Challenge (Problem Statement) */}
      <section id="challenge" className="py-20 px-6 lg:px-12 bg-slate-900/40 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              The Manufacturing Dilemma
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Why Traditional Cosmetic Inspection Fails
            </h2>
            <p className="max-w-2xl mx-auto text-sm text-slate-400">
              Cosmetics production involves delicate balance: emulsions require precise cooling rates, phase transitions, and viscosity windows. Waiting for final QC yields catastrophic rework.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Late Defect Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Relying exclusively on post-packaging lab tests means deviations in mixing or cooling go unnoticed until hundreds of units are filled, forcing complete batch dumps or intense reprocessing.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <GitBranch className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Unidentified Root Causes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Without structured fishbone categorization (Man, Machine, Material, Method, Measurement, Milieu), teams fix symptoms instead of systemic root causes, creating recurring quality leaks.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingDown className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Avoidable Carbon & Water Waste</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rework consumes massive thermal energy, boiler water for vessel washouts, and discarded primary packaging. QualiSense connects quality control directly to ESG sustainability metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Platform Capabilities */}
      <section id="capabilities" className="py-20 px-6 lg:px-12 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Core Platform Capabilities
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              End-to-End Decision Support for Factory Quality
            </h2>
            <p className="max-w-2xl mx-auto text-sm text-slate-400">
              Every tool quality engineers and plant operators need to guarantee first-time manufacturing excellence.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-teal-500/40 transition-all">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Early Anomaly Detection</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rule-based upper/lower threshold checking evaluated instantly on stage sensor readings.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-teal-500/40 transition-all">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Quality Alerts & Severity</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated Critical, High, and Medium triage with acknowledged and investigating lifecycle states.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-teal-500/40 transition-all">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <GitBranch className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">5 Whys & Ishikawa Fishbone</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Structured root-cause investigation module classifying causes into standard industrial 6M categories.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-teal-500/40 transition-all">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Action Centre (CAPA)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Corrective and preventive action tracking with assignee, priority, due date, and stage transitions.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-teal-500/40 transition-all">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Effectiveness Verification</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Independent verification stage ensuring interventions permanently solved deviations without recurrence.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-teal-500/40 transition-all">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Unified Quality Analytics</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rigorous first-pass quality formulas, Pareto distribution, and stage-by-stage defect breakdowns.
              </p>
            </div>

            {/* Card 7 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-teal-500/40 transition-all">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Leaf className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">Sustainability Accounting</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct calculation of avoided thermal energy (kWh), boiler steam water (L), and GHG emissions (kg CO₂e).
              </p>
            </div>

            {/* Card 8 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3 hover:border-amber-500/40 transition-all">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-sm">UCI SECOM Research Lab</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated real-world semiconductor benchmark with 590 sensors, class imbalance analysis, and Random Forest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: 6-Stage Prevention Flow */}
      <section id="workflow" className="py-20 px-6 lg:px-12 bg-slate-900/40 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Operational Methodology
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              The 6-Stage Closed-Loop Prevention Flow
            </h2>
            <p className="max-w-2xl mx-auto text-sm text-slate-400">
              How QualiSense moves plant operators from reactive troubleshooting to permanent defect eradication.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {[
              { step: "01", name: "MONITOR", desc: "Continuous sensor telemetry tracking across stages", color: "teal" },
              { step: "02", name: "DETECT", desc: "Rule engine flags out-of-spec readings immediately", color: "rose" },
              { step: "03", name: "INVESTIGATE", desc: "5 Whys root-cause dossier & fishbone hypothesis", color: "amber" },
              { step: "04", name: "ACT (CAPA)", desc: "Assigned corrective interventions with deadlines", color: "indigo" },
              { step: "05", name: "VERIFY", desc: "Independent confirmation of defect non-recurrence", color: "emerald" },
              { step: "06", name: "MEASURE", desc: "Real-time updates to First-Pass Quality & ESG savings", color: "cyan" },
            ].map((s, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 relative">
                <span className="text-[10px] font-bold tracking-widest text-teal-400">STAGE {s.step}</span>
                <h4 className="font-extrabold text-white text-sm">{s.name}</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Interactive Product Preview */}
      <section id="preview" className="py-20 px-6 lg:px-12 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Interactive System Preview
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Explore the Core Console Interfaces
            </h2>
            <p className="max-w-2xl mx-auto text-sm text-slate-400">
              Click through the tabs below to preview the actual functional modules available in the platform.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-3xl mx-auto">
            {[
              { id: "dashboard", label: "Overview Dashboard" },
              { id: "alerts", label: "Quality Alerts" },
              { id: "investigation", label: "5 Whys Dossier" },
              { id: "capa", label: "Action Centre" },
              { id: "sustainability", label: "ESG & Rework" },
              { id: "secom", label: "SECOM Real Data" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === t.id
                    ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Interactive Preview Canvas */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 space-y-6">
            {activeTab === "dashboard" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">Plant Quality Overview & Trends</h3>
                  <span className="text-xs text-teal-400 font-mono font-medium">8 Monitored Batches</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Overall First-Pass Quality</span>
                    <p className="text-2xl font-extrabold text-teal-400 mt-1">83.3%</p>
                    <p className="text-[10px] text-slate-500 mt-1">5 Released First Time / 6 Completed</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Active High/Crit Alerts</span>
                    <p className="text-2xl font-extrabold text-rose-400 mt-1">1 Critical</p>
                    <p className="text-[10px] text-slate-500 mt-1">Line 01 Emulsion Cooling Valve</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400">Avoidable Rework Deficit</span>
                    <p className="text-2xl font-extrabold text-emerald-400 mt-1">18.4 kg CO₂e</p>
                    <p className="text-[10px] text-slate-500 mt-1">Prevented via in-process catch</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-2">
                  <span className="font-semibold text-slate-200">Recommended Next Action:</span>
                  <p>
                    Review Batch <strong>LOT-2026-HYD-041</strong>. Thermal reading of 42.8 °C exceeds critical limit of 42.0 °C. Fishbone investigation indicates Heat Exchanger Valve Solenoid drift.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "alerts" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">Rule-Based Alert Management</h3>
                  <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                    1 Open P0
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-rose-900/40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-400">RULE_CRIT_HIGH_TEMPERATURE</span>
                    <span className="text-[11px] font-mono text-slate-400">LOT-2026-HYD-041</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Cooling Stage: Actual temperature reached <strong>42.8 °C</strong>, breaching standard threshold window of 25.0 °C – 42.0 °C.
                  </p>
                  <div className="text-[11px] text-slate-400 flex items-center gap-4">
                    <span>Severity: <strong>Critical</strong></span>
                    <span>Status: <strong>Open</strong></span>
                    <span>Source: <strong>Inline Sensor Probe</strong></span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "investigation" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">5 Whys Root-Cause Analysis Dossier</h3>
                  <span className="text-xs text-teal-400 font-mono">Dossier INV-2026-041</span>
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    "Why 1: Emulsion bulk cooling took 42 minutes instead of standard 28 minutes?",
                    "Why 2: Chilled water coolant flow through the vessel jacket was 40% below target.",
                    "Why 3: The pneumatic proportional control valve on the secondary circuit failed to open beyond 35%.",
                    "Why 4: Solenoid positioner feedback voltage drifted over 800 hours of continuous operation.",
                    "Why 5: Calibration cycle was scheduled at 1,000 hours without intermediate drift monitoring.",
                  ].map((w, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded bg-teal-500/10 text-teal-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "capa" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">CAPA & Effectiveness Verification</h3>
                  <span className="text-xs text-emerald-400 font-mono">Status: Verified</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Replace coolant proportional valve positioner & recalibrate</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                      Effectiveness Verified
                    </span>
                  </div>
                  <p className="text-slate-400">
                    Assigned to: <strong>Marc Dupont (Maintenance Lead)</strong> • Priority: <strong>Critical</strong>
                  </p>
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1">
                    <span className="font-bold">Verification Evidence:</span>
                    <p>Post-intervention batches ran within 28.2 °C cooling limits with 0 recurrence over 48 hours.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sustainability" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">Resource Conservation & Avoidable Rework</h3>
                  <span className="text-xs text-emerald-400 font-medium">L&apos;Oréal Sustainability Alignment</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400">Avoided Electricity</span>
                    <p className="text-xl font-bold text-teal-400">62.0 kWh</p>
                    <p className="text-[10px] text-slate-500">Agitator + chiller pump run-hours</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400">Avoided CIP Water</span>
                    <p className="text-xl font-bold text-cyan-400">320 Litres</p>
                    <p className="text-[10px] text-slate-500">Clean-in-Place cycle elimination</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-slate-400">Estimated CO₂e Saving</span>
                    <p className="text-xl font-bold text-emerald-400">18.4 kg</p>
                    <p className="text-[10px] text-slate-500">Grid carbon intensity factor</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "secom" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">UCI SECOM Manufacturing Dataset Lab</h3>
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    Real Research Data
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-slate-300">
                  <p>
                    Integrates <strong>1,567 manufacturing observations</strong> across <strong>590 sensor signals</strong> from the UCI Machine Learning Repository.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block">Pass Rate:</span>
                      <strong className="text-teal-400">93.36% (1,463)</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block">Defect Rate:</span>
                      <strong className="text-rose-400">6.64% (104)</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block">Class Imbalance:</span>
                      <strong className="text-amber-400">14 : 1 Ratio</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block">ML Benchmark:</span>
                      <strong className="text-indigo-400">Balanced RF AUC 0.73</strong>
                    </div>
                  </div>
                  <p className="text-[10px] text-amber-300/80 italic">
                    Note: Rigorously segregated from cosmetics data. Demonstrates scalable high-dimensional sensor analysis.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 font-semibold transition-colors"
              >
                Open Full Interactive Experience
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Architecture & Security Badges */}
      <section id="architecture" className="py-20 px-6 lg:px-12 bg-slate-900/40 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Modern Enterprise Architecture
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Built with Modern Standards & Hardened Security
            </h2>
            <p className="max-w-2xl mx-auto text-sm text-slate-400">
              Engineered with clean separation of concerns, robust cryptography, and responsive UI.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Next.js 15", desc: "React 19 App Router & SSR" },
              { name: "FastAPI", desc: "Python async REST API" },
              { name: "Argon2id", desc: "Modern password hashing" },
              { name: "JWT + Cookies", desc: "HTTP-only session tokens" },
              { name: "SQLite / Postgres", desc: "SQLAlchemy ORM models" },
              { name: "Recharts", desc: "Dynamic interactive analytics" },
            ].map((tech, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
                <p className="font-extrabold text-white text-sm">{tech.name}</p>
                <p className="text-[11px] text-slate-400">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Final CTA */}
      <section className="py-24 px-6 lg:px-12 relative overflow-hidden text-center">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Prevent Quality Defects Before They Happen?
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Experience the decision-support platform built for factory supervisors, quality engineers, and plant leadership.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-teal-500/20 transition-all hover:scale-[1.02]"
            >
              Launch Plant Console
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 font-semibold text-sm transition-all"
            >
              Create Viewer Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 px-6 lg:px-12 py-10 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-teal-400" />
              <span className="font-bold text-white">QualiSense AI</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Developed for the L&apos;Oréal Sustainability Challenge — Option 02: Getting Quality Right First Time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <Link href="/dashboard" className="hover:text-teal-400 transition-colors">Dashboard</Link>
            <Link href="/batches" className="hover:text-teal-400 transition-colors">Batches</Link>
            <Link href="/alerts" className="hover:text-teal-400 transition-colors">Alerts</Link>
            <Link href="/investigations" className="hover:text-teal-400 transition-colors">5 Whys</Link>
            <Link href="/actions" className="hover:text-teal-400 transition-colors">CAPA</Link>
            <Link href="/sustainability" className="hover:text-teal-400 transition-colors">Sustainability</Link>
            <Link href="/dataset-lab" className="hover:text-teal-400 transition-colors">SECOM Lab</Link>
            <Link href="/login" className="hover:text-teal-400 transition-colors">Sign In</Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2026 QualiSense AI. Prototype decision-support system. All cosmetics manufacturing data is illustrative.</p>
          <p className="text-slate-400">SECOM dataset courtesy of UCI Machine Learning Repository.</p>
        </div>
      </footer>
    </div>
  );
}
