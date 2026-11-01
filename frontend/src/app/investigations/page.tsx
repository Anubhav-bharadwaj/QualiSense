"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { ActionModal } from "@/components/ActionModal";
import { api } from "@/lib/api";
import {
  Investigation,
  QualityAlert,
  CauseStatus,
  CorrectiveAction,
  FishboneData,
  FiveWhyStep,
  EffectivenessVerification,
  InvestigationDossier
} from "@/types";
import {
  GitBranch,
  Save,
  Plus,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  CheckSquare,
  Trash2,
  Layers,
  Wrench,
  Cog,
  FileCode,
  Users,
  Ruler,
  Wind,
  ShieldAlert,
  RefreshCw,
  FileText,
  Printer,
  Calendar,
  ShieldCheck,
  X,
  ExternalLink,
  Activity,
  ArrowRight
} from "lucide-react";

function InvestigationContent() {
  const searchParams = useSearchParams();
  const alertIdParam = searchParams.get("alert_id");

  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<number>(alertIdParam ? Number(alertIdParam) : 1);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Form state
  const [notes, setNotes] = useState("");
  const [causeStatus, setCauseStatus] = useState<CauseStatus>("Under Investigation");
  const [investigator, setInvestigator] = useState("Dr. Sarah Chen (Senior Quality Eng)");
  const [fiveWhys, setFiveWhys] = useState<FiveWhyStep[]>([]);
  const [fishbone, setFishbone] = useState<FishboneData>({
    Machine: [],
    Method: [],
    Material: [],
    Manpower: [],
    Measurement: [],
    Environment: [],
  });

  // Effectiveness Verification Stage State
  const [verificationDate, setVerificationDate] = useState("2026-11-03");
  const [verificationOwner, setVerificationOwner] = useState("Marc Dupont (Plant Manager)");
  const [effectivenessStatus, setEffectivenessStatus] = useState<"Pending Verification" | "Effective" | "Partially Effective" | "Ineffective">("Pending Verification");
  const [deviationRecurred, setDeviationRecurred] = useState(false);
  const [postReadings, setPostReadings] = useState<Array<{ stage?: string; parameter: string; value: number; unit: string; in_spec: boolean }>>([
    { stage: "Cooling Trim", parameter: "temperature", value: 37.4, unit: "°C", in_spec: true }
  ]);
  const [verificationNotes, setVerificationNotes] = useState("Pneumatic air regulator filter replaced. Target pressure stabilized at 5.6 bar. Awaiting 3 consecutive cooling cycle logs before signing off final effectiveness.");

  // Action Modal & Export Dossier State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [dossierData, setDossierData] = useState<InvestigationDossier | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Load all alerts for dropdown
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const alertList = await api.getAlerts();
        setAlerts(alertList);
        if (!alertIdParam && alertList.length > 0) {
          const target = alertList.find((a) => a.severity === "Critical") || alertList[0];
          setSelectedAlertId(target.id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadAlerts();
  }, [alertIdParam]);

  // Load investigation when selectedAlertId changes
  const fetchInvestigation = async () => {
    if (!selectedAlertId) return;
    setLoading(true);
    try {
      const inv = await api.getInvestigationByAlert(selectedAlertId);
      setInvestigation(inv);
      setNotes(inv.notes || "");
      setCauseStatus(inv.cause_status);
      setInvestigator(inv.investigator_name);
      setFiveWhys(inv.five_whys || []);
      setFishbone(inv.fishbone || {
        Machine: [],
        Method: [],
        Material: [],
        Manpower: [],
        Measurement: [],
        Environment: [],
      });

      if (inv.effectiveness_verification) {
        setVerificationDate(inv.effectiveness_verification.verification_date || "2026-11-03");
        setVerificationOwner(inv.effectiveness_verification.verification_owner || "Marc Dupont (Plant Manager)");
        setEffectivenessStatus(inv.effectiveness_verification.effectiveness_status || "Pending Verification");
        setDeviationRecurred(!!inv.effectiveness_verification.deviation_recurred);
        setPostReadings(inv.effectiveness_verification.post_intervention_readings || []);
        setVerificationNotes(inv.effectiveness_verification.notes || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlertId]);

  const handleSave = async () => {
    if (!investigation) return;
    setSaving(true);
    try {
      const updated = await api.saveInvestigation({
        alert_id: investigation.alert_id,
        batch_id: investigation.batch_id,
        notes,
        cause_status: causeStatus,
        investigator_name: investigator,
        five_whys: fiveWhys,
        fishbone,
        effectiveness_verification: {
          verification_date: verificationDate,
          verification_owner: verificationOwner,
          effectiveness_status: effectivenessStatus,
          deviation_recurred: deviationRecurred,
          post_intervention_readings: postReadings,
          notes: verificationNotes
        }
      });
      setInvestigation(updated);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } catch (err: any) {
      alert("Failed to save investigation: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDossier = async () => {
    if (!investigation) return;
    setIsDossierOpen(true);
    setLoadingDossier(true);
    try {
      const dossier = await api.getInvestigationDossier(investigation.id);
      setDossierData(dossier);
    } catch (err: any) {
      console.error("Error loading dossier:", err);
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleWhyChange = (index: number, answer: string) => {
    const updated = [...fiveWhys];
    updated[index].answer = answer;
    setFiveWhys(updated);
  };

  const handleAddWhyStep = () => {
    const nextStep = fiveWhys.length + 1;
    setFiveWhys([
      ...fiveWhys,
      { step: nextStep, question: `Why (${nextStep})?`, answer: "" },
    ]);
  };

  const handleAddFishboneCause = (category: keyof FishboneData) => {
    const causeText = prompt(`Enter suspected or confirmed cause under ${category}:`);
    if (!causeText || !causeText.trim()) return;

    setFishbone({
      ...fishbone,
      [category]: [
        ...(fishbone[category] || []),
        { cause: causeText.trim(), status: "Suspected" },
      ],
    });
  };

  const handleUpdateFishboneStatus = (category: keyof FishboneData, index: number, newStatus: CauseStatus) => {
    const list = [...(fishbone[category] || [])];
    list[index].status = newStatus;
    setFishbone({
      ...fishbone,
      [category]: list,
    });
  };

  const handleRemoveFishboneCause = (category: keyof FishboneData, index: number) => {
    const list = [...(fishbone[category] || [])];
    list.splice(index, 1);
    setFishbone({
      ...fishbone,
      [category]: list,
    });
  };

  const handleAddPostReading = () => {
    setPostReadings([
      ...postReadings,
      {
        stage: "Cooling Trim",
        parameter: "temperature",
        value: 37.0,
        unit: "°C",
        in_spec: true
      }
    ]);
  };

  const handleRemovePostReading = (idx: number) => {
    const updated = [...postReadings];
    updated.splice(idx, 1);
    setPostReadings(updated);
  };

  const handleActionCreated = (action: CorrectiveAction) => {
    if (investigation) {
      setInvestigation({
        ...investigation,
        actions: [...investigation.actions, action],
      });
    }
  };

  const fishboneCategories: Array<{
    key: keyof FishboneData;
    label: string;
    icon: any;
    desc: string;
  }> = [
    { key: "Machine", label: "Machine (Equipment & Valves)", icon: Cog, desc: "Agitator, jacket bypass valve, chillers, pneumatic line regulators" },
    { key: "Method", label: "Method (Standard Operating Procedures)", icon: FileCode, desc: "Cooling ramp SOP, shear rate parameters, recipe batching order" },
    { key: "Material", label: "Material (Raw Ingredients & Lots)", icon: Wrench, desc: "Polymer water content, emulsifier lot viscosity variance" },
    { key: "Manpower", label: "Manpower (Operator & Handover)", icon: Users, desc: "Shift changeover timing, manual valve overrides" },
    { key: "Measurement", label: "Measurement (Sensors & Inline Probes)", icon: Ruler, desc: "Thermocouple TC-04 calibration, inline viscometer sensor drift" },
    { key: "Environment", label: "Environment (Facility & Ambient Cleanroom)", icon: Wind, desc: "Cleanroom temperature, HVAC relative humidity, cooling water inlet" },
  ];

  const workflowStages = [
    { id: 1, label: "1. Deviation Detected", active: true, done: true },
    { id: 2, label: "2. Evidence Collection", active: true, done: true },
    { id: 3, label: "3. 5 Whys / Fishbone", active: true, done: true },
    { id: 4, label: "4. Cause Verification", active: causeStatus === "Engineer-Confirmed", done: causeStatus === "Engineer-Confirmed" },
    { id: 5, label: "5. CAPA Action", active: (investigation?.actions?.length || 0) > 0, done: (investigation?.actions?.length || 0) > 0 },
    { id: 6, label: "6. Effectiveness Verification", active: true, done: effectivenessStatus === "Effective" },
  ];

  return (
    <AppShell title="Root Cause Investigation Workspace" onRefreshData={fetchInvestigation}>
      {/* 6-Stage Industrial Investigation Workflow Stepper */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] text-xs">
          {workflowStages.map((stage, idx) => (
            <React.Fragment key={stage.id}>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    stage.done
                      ? "bg-teal-600 text-white"
                      : stage.active
                      ? "bg-amber-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {stage.done ? "✓" : stage.id}
                </span>
                <span className={`font-medium ${stage.done ? "text-slate-800" : "text-slate-500"}`}>
                  {stage.label}
                </span>
              </div>
              {idx < workflowStages.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Alert Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Investigating Alert:
          </label>
          <select
            value={selectedAlertId}
            onChange={(e) => setSelectedAlertId(Number(e.target.value))}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:ring-1 focus:ring-teal-500 max-w-md w-full"
          >
            {alerts.map((a) => (
              <option key={a.id} value={a.id}>
                [{a.severity}] Batch {a.batch_code} — {a.parameter} ({a.observed_value} {a.unit})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleOpenDossier}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors border border-slate-300"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Investigation Report</span>
          </button>

          <button
            onClick={() => setIsActionModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Create Corrective Action</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "Saving..." : "Save Analysis"}</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-teal-900 text-teal-200 border border-teal-700 rounded-xl text-xs font-medium flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Investigation notes, 5 Whys, fishbone causes, and effectiveness verification saved.</span>
        </div>
      )}

      {/* Alert Context Summary Banner */}
      {investigation?.alert && (
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-teal-400 text-base">
                  Batch {investigation.alert.batch_code}
                </span>
                <StatusBadge type="severity" value={investigation.alert.severity} />
                <span className="text-xs text-slate-400">
                  Line: <strong className="text-white">{investigation.alert.line_name}</strong>
                </span>
                <span className="text-[10px] uppercase font-semibold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  Demonstration Incident
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed">
                {investigation.alert.explanation}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-right shrink-0">
              <span className="text-[11px] text-slate-400 block">Observed Excursion</span>
              <span className="text-xl font-bold font-mono text-rose-400">
                {investigation.alert.observed_value} {investigation.alert.unit}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Spec: {investigation.alert.lower_limit} – {investigation.alert.upper_limit} {investigation.alert.unit}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Investigation Status & Investigator Notes */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Engineer Cause Determination</h3>
            <p className="text-xs text-slate-500">Structured decision-support workspace</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-700">Root Cause Status:</label>
            <select
              value={causeStatus}
              onChange={(e) => setCauseStatus(e.target.value as CauseStatus)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:ring-1 focus:ring-teal-500"
            >
              <option value="Suspected">Suspected</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Engineer-Confirmed">Engineer-Confirmed</option>
              <option value="Ruled Out">Ruled Out</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Investigation Findings & Observation Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record physical evidence, operator interview testimony, valve inspection logs..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* 5 Whys Analysis Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">5 Whys Root-Cause Sequence</h3>
            <p className="text-xs text-slate-500">Progressive causal drill-down from observed symptom to root system failure</p>
          </div>
          <button
            onClick={handleAddWhyStep}
            className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Why Step
          </button>
        </div>

        <div className="space-y-3">
          {fiveWhys.map((step, idx) => (
            <div key={idx} className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{step.question}</span>
                <span className="text-[10px] text-slate-400 font-mono">Level {idx + 1}</span>
              </div>
              <input
                type="text"
                value={step.answer}
                onChange={(e) => handleWhyChange(idx, e.target.value)}
                placeholder="Answer root hypothesis..."
                className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* 6M Ishikawa Fishbone Diagram Matrix */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Ishikawa 6M Fishbone Cause Matrix</h3>
            <p className="text-xs text-slate-500">Categorize causal vectors across the 6 manufacturing domains</p>
          </div>
          <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
            GMP Root-Cause Methodology
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fishboneCategories.map((cat) => {
            const Icon = cat.icon;
            const causes = fishbone[cat.key] || [];

            return (
              <div key={cat.key} className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-teal-600" />
                      <h4 className="text-xs font-bold text-slate-800">{cat.label}</h4>
                    </div>
                    <button
                      onClick={() => handleAddFishboneCause(cat.key)}
                      className="text-slate-400 hover:text-teal-600"
                      title="Add Cause"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{cat.desc}</p>

                  <div className="mt-3 space-y-2">
                    {causes.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No causes listed</p>
                    ) : (
                      causes.map((c, cIdx) => (
                        <div key={cIdx} className="p-2 bg-white rounded-lg border border-slate-200 text-xs space-y-1 shadow-2xs">
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-slate-800 leading-snug">{c.cause}</span>
                            <button
                              onClick={() => handleRemoveFishboneCause(cat.key, cIdx)}
                              className="text-slate-300 hover:text-rose-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="pt-1 flex items-center justify-between">
                            <select
                              value={c.status}
                              onChange={(e) =>
                                handleUpdateFishboneStatus(cat.key, cIdx, e.target.value as CauseStatus)
                              }
                              className={`text-[10px] font-semibold py-0.5 px-1.5 rounded border ${
                                c.status === "Engineer-Confirmed"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : c.status === "Ruled Out"
                                  ? "bg-slate-100 text-slate-500 border-slate-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              <option value="Suspected">Suspected</option>
                              <option value="Under Investigation">Under Investigation</option>
                              <option value="Engineer-Confirmed">Engineer-Confirmed</option>
                              <option value="Ruled Out">Ruled Out</option>
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Linked Corrective Actions Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Assigned Corrective & Preventive Actions (CAPA)</h3>
            <p className="text-xs text-slate-500">Containment tasks spawned from this investigation</p>
          </div>
          <button
            onClick={() => setIsActionModalOpen(true)}
            className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1"
          >
            + New Action
          </button>
        </div>

        {investigation?.actions && investigation.actions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {investigation.actions.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900">{act.title}</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">{act.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-600 font-medium">Owner: {act.owner_name}</span>
                  <StatusBadge type="action" value={act.status} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-3">No corrective actions assigned yet.</p>
        )}
      </div>

      {/* EFFECTIVENESS VERIFICATION STAGE (Requirement 4) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Stage 6: Effectiveness Verification (Post-CAPA Audit)
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  effectivenessStatus === "Effective"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : effectivenessStatus === "Partially Effective"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : effectivenessStatus === "Ineffective"
                    ? "bg-rose-100 text-rose-800 border-rose-300"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }`}
              >
                {effectivenessStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify intervention effectiveness on subsequent batch runs. Do not mark effective simply because CAPA tasks are closed.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Verification Outcome:</span>
            <select
              value={effectivenessStatus}
              onChange={(e) => setEffectivenessStatus(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-900 focus:ring-1 focus:ring-teal-500"
            >
              <option value="Pending Verification">Pending Verification</option>
              <option value="Effective">Effective (Zero Recurrence)</option>
              <option value="Partially Effective">Partially Effective</option>
              <option value="Ineffective">Ineffective (Recurrence Observed)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Verification Date</label>
            <input
              type="date"
              value={verificationDate}
              onChange={(e) => setVerificationDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Verification Owner / Auditor</label>
            <input
              type="text"
              value={verificationOwner}
              onChange={(e) => setVerificationOwner(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block font-medium text-slate-700 mb-1">Did the Deviation Recur?</label>
            <select
              value={deviationRecurred ? "yes" : "no"}
              onChange={(e) => setDeviationRecurred(e.target.value === "yes")}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-1 focus:ring-teal-500 font-semibold"
            >
              <option value="no">No — Zero Recurrence Across Batches</option>
              <option value="yes">Yes — Temperature / Viscosity Excursion Recurred</option>
            </select>
          </div>
        </div>

        {/* Post-Intervention Telemetry Readings */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-800">Post-Intervention Verification Readings</span>
            <button
              onClick={handleAddPostReading}
              className="text-xs font-medium text-teal-600 hover:text-teal-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Verification Reading
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                  <th className="py-2 px-3">Stage</th>
                  <th className="py-2 px-3">Parameter</th>
                  <th className="py-2 px-3">Observed Value</th>
                  <th className="py-2 px-3">In-Spec Compliance</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {postReadings.map((r, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={r.stage || ""}
                        onChange={(e) => {
                          const updated = [...postReadings];
                          updated[rIdx].stage = e.target.value;
                          setPostReadings(updated);
                        }}
                        className="p-1 border border-slate-300 rounded text-xs bg-white w-32"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={r.parameter}
                        onChange={(e) => {
                          const updated = [...postReadings];
                          updated[rIdx].parameter = e.target.value;
                          setPostReadings(updated);
                        }}
                        className="p-1 border border-slate-300 rounded text-xs bg-white w-28"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          value={r.value}
                          onChange={(e) => {
                            const updated = [...postReadings];
                            updated[rIdx].value = Number(e.target.value);
                            setPostReadings(updated);
                          }}
                          className="p-1 border border-slate-300 rounded text-xs bg-white w-20 font-mono"
                        />
                        <span className="text-slate-500 font-mono">{r.unit}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={r.in_spec}
                          onChange={(e) => {
                            const updated = [...postReadings];
                            updated[rIdx].in_spec = e.target.checked;
                            setPostReadings(updated);
                          }}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className={`text-[11px] font-semibold ${r.in_spec ? "text-emerald-700" : "text-rose-700"}`}>
                          {r.in_spec ? "In Nominal Range" : "Out of Limits"}
                        </span>
                      </label>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleRemovePostReading(rIdx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Verification Auditor Notes & Evidence Sign-Off
          </label>
          <textarea
            rows={2}
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            placeholder="Document physical re-test findings, chiller inlet temperature charts, stability logs..."
            className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Synthetic Demonstration Notice Box */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Decision Support Notice:</strong> QualiSense AI provides structured templates (5 Whys, Ishikawa 6M, Effectiveness Audits) to assist quality and manufacturing personnel in documenting hypotheses. The software does not prove legal or physical causation; final verification rests with certified plant engineers and laboratory tests.
        </p>
      </div>

      {/* Action Modal */}
      {investigation && (
        <ActionModal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          batchId={investigation.batch_id}
          batchCode={investigation.batch_code}
          investigationId={investigation.id}
          defaultTitle="Service Pneumatic Chiller Valve & Update CMMS Auxiliary PM Schedule"
          onActionCreated={handleActionCreated}
        />
      )}

      {/* EXPORTABLE INVESTIGATION DOSSIER MODAL (Requirement 9) */}
      {isDossierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold tracking-tight">
                  Industrial Quality Dossier & CAPA Report (Export View)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setIsDossierOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dossier Printable Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-800 bg-white" id="printable-dossier">
              {/* Header with Plant & Prototype Metadata */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">QUALISENSE AI — QUALITY INVESTIGATION DOSSIER</h1>
                  <p className="text-xs text-slate-500 font-medium">Cosmetic Manufacturing Decision-Support Incident Record</p>
                  <p className="text-[11px] text-teal-700 font-mono mt-1 font-semibold">
                    Document Ref: QIR-2026-041-REV2 | Plant Line: Line 01 (Bulk Compounding Bay)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                    Synthetic Demo Scenario
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">Date: {dossierData?.generated_at || "2026-11-02"}</p>
                </div>
              </div>

              {/* Section 1: Incident & Excursion Context */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1">
                  1. Deviation Identification & Parameter Excursion
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Batch Lot Code</span>
                    <strong className="font-mono text-slate-900">{dossierData?.batch_code || "LOT-2026-HYD-041"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Product Profile</span>
                    <strong className="text-slate-900">{dossierData?.product_name || "Hydra-Luxe Rich Cream"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Observed Reading</span>
                    <strong className="font-mono text-rose-700">{dossierData?.observed_value} °C (Spike)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Configured Bounds</span>
                    <strong className="font-mono text-slate-700">{dossierData?.configured_bounds || "35.0 – 40.0 °C"}</strong>
                  </div>
                </div>
              </div>

              {/* Section 2: 5 Whys Root-Cause Sequence */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1">
                  2. 5 Whys Causal Drill-Down
                </h2>
                <div className="space-y-1.5 text-xs">
                  {fiveWhys.map((step, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200 flex items-start gap-2">
                      <span className="font-bold text-teal-700 whitespace-nowrap">Why {idx + 1}:</span>
                      <span className="text-slate-700">{step.answer || "Hypothesis pending validation."}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: 6M Ishikawa Fishbone Analysis */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1">
                  3. Ishikawa 6M Fishbone Analysis Findings
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {fishboneCategories.map((cat) => (
                    <div key={cat.key} className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <h4 className="font-bold text-[11px] text-slate-800 mb-1">{cat.label.split("(")[0]}</h4>
                      <ul className="space-y-1">
                        {(fishbone[cat.key] || []).length > 0 ? (
                          (fishbone[cat.key] || []).map((c, i) => (
                            <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1">
                              <span className="text-teal-600 font-bold">•</span>
                              <span>{c.cause} ({c.status})</span>
                            </li>
                          ))
                        ) : (
                          <li className="text-[11px] text-slate-400 italic">Ruled out</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Corrective & Preventive Actions */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1">
                  4. Corrective & Preventive Actions (CAPA)
                </h2>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 font-semibold text-slate-700 text-[10px]">
                    <tr>
                      <th className="p-2">Action Description</th>
                      <th className="p-2">Owner</th>
                      <th className="p-2">Priority</th>
                      <th className="p-2">Target Date</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {investigation?.actions?.map((act) => (
                      <tr key={act.id}>
                        <td className="p-2">{act.title}</td>
                        <td className="p-2 font-medium">{act.owner_name}</td>
                        <td className="p-2">{act.priority}</td>
                        <td className="p-2 font-mono">{act.due_date}</td>
                        <td className="p-2 font-semibold text-teal-700">{act.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section 5: Effectiveness Verification */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1">
                  5. Effectiveness Verification & Sign-Off
                </h2>
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>Audit Status: <strong className="text-teal-700">{effectivenessStatus}</strong></span>
                    <span>Auditor: <strong>{verificationOwner}</strong></span>
                    <span>Date: <strong className="font-mono">{verificationDate}</strong></span>
                  </div>
                  <p className="text-slate-600 pt-1">
                    <strong>Auditor Remarks:</strong> {verificationNotes}
                  </p>
                </div>
              </div>

              {/* Section 6: Avoidable Sustainability Dividends */}
              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1">
                  6. Resource Impact Accounting (Avoided Rework Scenario)
                </h2>
                <div className="grid grid-cols-4 gap-3 p-3 bg-teal-50/50 rounded border border-teal-200 text-xs text-center">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Avoided Material Scrap</span>
                    <strong className="text-teal-800 font-mono text-sm">225.0 kg</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Avoided CIP Water</span>
                    <strong className="text-teal-800 font-mono text-sm">9,000 L</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Avoided Energy</span>
                    <strong className="text-teal-800 font-mono text-sm">1,100 kWh</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Avoided CO₂e</span>
                    <strong className="text-teal-800 font-mono text-sm">475.0 kg</strong>
                  </div>
                </div>
              </div>

              {/* Formal Prototype Disclosure */}
              <div className="p-3 bg-slate-100 rounded border border-slate-300 text-[10px] text-slate-500 leading-relaxed">
                <strong>PROTOTYPE SCENARIO DISCLOSURE:</strong> This report is generated from the QualiSense AI competition demonstrator for the L&apos;Oréal Sustainability Challenge. Measurements, 5 Whys causal connections, and rework resource calculations are transparent engineering models for decision-support evaluation; they do not represent audited plant certifications.
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function InvestigationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="p-8 text-center text-slate-500 text-sm">
            Loading investigation workspace...
          </div>
        </div>
      }
    >
      <InvestigationContent />
    </Suspense>
  );
}
