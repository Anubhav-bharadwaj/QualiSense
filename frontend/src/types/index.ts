export type Severity = "Critical" | "High" | "Medium" | "Info";
export type AlertStatus = "Open" | "Acknowledged" | "Investigating" | "Resolved";
export type BatchStatus = "In Progress" | "Quality Review" | "Released" | "Rework" | "Rejected";
export type ActionStatus = "Open" | "In Progress" | "Completed" | "Verified";
export type ActionPriority = "Critical" | "High" | "Medium" | "Low";
export type CauseStatus = "Suspected" | "Under Investigation" | "Engineer-Confirmed" | "Ruled Out";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "Administrator" | "Quality Engineer" | "Production Manager" | "Viewer" | string;
  organisation?: string;
  avatar?: string;
  is_active?: boolean;
  is_verified?: boolean;
  created_at?: string;
  last_login_at?: string;
  permissions?: string[];
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuditLogEntry {
  id: number;
  actor_user_id?: number;
  actor_name?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  timestamp: string;
  metadata_json?: Record<string, any>;
}

export interface ParameterSpec {
  min: number;
  max: number;
  critical_min?: number;
  critical_max?: number;
  unit: string;
  near_limit_margin?: number;
  description?: string;
}

export interface ProductProfile {
  id: number;
  name: string;
  code: string;
  category: string;
  target_units: number;
  parameter_limits: Record<string, ParameterSpec>;
  is_demo_profile: boolean;
}

export interface ProductionLine {
  id: number;
  name: string;
  code: string;
  location_label: string;
  status: string;
}

export interface ProductionReading {
  id: number;
  batch_id: number;
  stage: string;
  parameter: string;
  value: number;
  unit: string;
  recorded_at: string;
  operator_name: string;
  source: string;
}

export interface QualityAlert {
  id: number;
  batch_id: number;
  batch_code?: string;
  product_name?: string;
  line_name?: string;
  reading_id?: number;
  parameter: string;
  observed_value: number;
  lower_limit: number;
  upper_limit: number;
  unit: string;
  severity: Severity;
  rule_name: string;
  explanation: string;
  status: AlertStatus;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface FishboneCause {
  cause: string;
  status: CauseStatus;
}

export interface FishboneData {
  Machine: FishboneCause[];
  Method: FishboneCause[];
  Material: FishboneCause[];
  Manpower: FishboneCause[];
  Measurement: FishboneCause[];
  Environment: FishboneCause[];
}

export interface FiveWhyStep {
  step: number;
  question: string;
  answer: string;
}

export interface CorrectiveAction {
  id: number;
  investigation_id?: number;
  batch_id: number;
  batch_code?: string;
  title: string;
  description: string;
  owner_name: string;
  owner_role: string;
  priority: ActionPriority;
  due_date: string;
  status: ActionStatus;
  completion_note?: string;
  created_at: string;
  completed_at?: string;
}

export interface EffectivenessVerification {
  verification_date?: string;
  verification_owner?: string;
  effectiveness_status?: "Effective" | "Partially Effective" | "Ineffective" | "Pending Verification";
  deviation_recurred?: boolean;
  post_intervention_readings?: Array<{
    stage?: string;
    parameter: string;
    value: number;
    unit: string;
    in_spec: boolean;
  }>;
  notes?: string;
}

export interface Investigation {
  id: number;
  alert_id: number;
  batch_id: number;
  batch_code?: string;
  alert?: QualityAlert;
  notes?: string;
  cause_status: CauseStatus;
  investigator_name: string;
  five_whys?: FiveWhyStep[];
  fishbone?: FishboneData;
  effectiveness_verification?: EffectivenessVerification;
  actions: CorrectiveAction[];
  created_at: string;
  updated_at: string;
}

export interface RecommendedAction {
  id: string;
  priority: string;
  title: string;
  rationale: string;
  action_type: string;
  target_url: string;
  target_label: string;
  source_badge: string;
}

export interface InvestigationDossier {
  investigation_id: number;
  batch_id: number;
  batch_code: string;
  product_name: string;
  line_name: string;
  deviation_title: string;
  observed_parameter: string;
  observed_value: number;
  configured_bounds: string;
  severity: string;
  root_cause_summary: string;
  cause_status: string;
  investigator_name: string;
  five_whys?: FiveWhyStep[];
  fishbone?: FishboneData;
  corrective_actions: CorrectiveAction[];
  effectiveness_verification?: EffectivenessVerification;
  sustainability_impact: {
    batch_target_units: number;
    potential_material_scrap_kg: number;
    potential_cip_water_l: number;
    potential_energy_kwh: number;
    potential_co2_kg: number;
    basis: string;
  };
  data_source_disclosure: string;
  generated_at: string;
}

export interface Batch {
  id: number;
  batch_code: string;
  product_profile_id: number;
  product_name?: string;
  product_category?: string;
  line_id: number;
  line_name?: string;
  status: BatchStatus;
  started_at: string;
  completed_at?: string;
  target_quantity: number;
  actual_quantity: number;
  first_pass_quality: boolean;
  disposition_notes?: string;
  alert_count: number;
  open_alert_count: number;
}

export interface BatchDetail extends Batch {
  readings: ProductionReading[];
  alerts: QualityAlert[];
  parameter_limits?: Record<string, ParameterSpec>;
}

export interface SustainabilitySummary {
  total_reworked_units: number;
  total_material_waste_kg: number;
  total_water_consumption_l: number;
  total_energy_consumption_kwh: number;
  total_co2_kg: number;
  avoided_material_kg: number;
  avoided_water_l: number;
  avoided_energy_kwh: number;
  avoided_co2_kg: number;
  assumptions: Record<string, any>;
  formula_reference: string;
  disclaimer: string;
}

export interface DashboardSummary {
  batches_monitored: number;
  active_deviations: number;
  batches_needing_review: number;
  first_pass_quality_rate: number;
  total_rework_units: number;
  estimated_avoidable_waste_kg: number;
  logged_material_waste_kg?: number;
  potential_avoidable_waste_kg?: number;
  fpq_basis_note?: string;
  recent_batches: Batch[];
  recent_alerts: QualityAlert[];
  severity_distribution: Record<string, number>;
  quality_trend: Array<{
    period: string;
    first_pass_rate: number;
    alerts_detected: number;
    rework_units: number;
  }>;
  recommended_actions_today?: RecommendedAction[];
  disclaimer: string;
}

export interface MLPrediction {
  batch_id?: number;
  defect_risk_probability: number;
  risk_level: string;
  model_version: string;
  top_contributing_features: Array<{
    feature: string;
    delta: number;
    unit: string;
    weight: number;
  }>;
  is_model_available: boolean;
  disclaimer: string;
}

// ==========================================
// SECOM REAL MANUFACTURING DATASET TYPES
// ==========================================
export type SecomQualityStatus = "Pass" | "Fail";

export interface SecomDatasetSummary {
  dataset_name: string;
  source: string;
  total_records: number;
  total_features: number;
  pass_count: number;
  fail_count: number;
  pass_percentage: number;
  fail_percentage: number;
  missing_values_count: number;
  missing_percentage: number;
  constant_features_count: number;
  import_status: string;
  imported_at: string | null;
  disclaimer: string;
}

export interface SecomRecordSummary {
  id: number;
  original_index: number;
  original_label: number;
  quality_status: SecomQualityStatus;
  recorded_at: string | null;
  missing_count: number;
}

export interface SecomRecordDetail {
  id: number;
  source: string;
  original_index: number;
  original_label: number;
  quality_status: SecomQualityStatus;
  recorded_at: string | null;
  missing_count: number;
  features: Record<string, number | null>;
  imported_at: string;
}

export interface SecomFeatureStat {
  name: string;
  index: number;
  available_count: number;
  missing_count: number;
  missing_percentage: number;
  mean: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  is_constant: boolean;
}

export interface SecomDistribution {
  pass_count: number;
  fail_count: number;
  pass_percentage: number;
  fail_percentage: number;
  imbalance_ratio: string;
  missingness_histogram: Array<{
    bin: string;
    count: number;
    pct: number;
  }>;
  top_missing_features: SecomFeatureStat[];
  constant_features: string[];
}

export interface SecomMetadata {
  dataset_name: string;
  source: string;
  authors: string;
  area: string;
  description: string;
  instances: number;
  features: number;
  label_mapping: Record<string, string>;
  license_attribution: string;
  disclaimer: string;
  last_imported_at: string | null;
}

export interface SecomMLReadiness {
  pipeline_name: string;
  status: string;
  raw_feature_count: number;
  constant_features_detected: number;
  retained_informative_features: number;
  imputation_strategy: string;
  scaling_strategy: string;
  split_strategy: string;
  data_leakage_mitigation: string;
  class_imbalance_mitigation: string;
  disclaimer: string;
}

export interface SecomImportResponse {
  message: string;
  total_records: number;
  total_features: number;
  successful_records: number;
  failed_records: number;
  missing_values_count: number;
  import_status: string;
}

export interface SecomCorrelationResult {
  feature_x: string;
  feature_y: string;
  correlation_r: number;
  valid_sample_count: number;
  missing_count_x: number;
  missing_count_y: number;
  missing_joint_count: number;
  total_samples: number;
  points: Array<{ x: number; y: number; status: string }>;
  causation_caveat: string;
}

export interface SecomPassFailComparison {
  feature_name: string;
  pass_stats: {
    count: number;
    mean: number | null;
    std: number | null;
    median: number | null;
    min: number | null;
    max: number | null;
    iqr: number | null;
  };
  fail_stats: {
    count: number;
    mean: number | null;
    std: number | null;
    median: number | null;
    min: number | null;
    max: number | null;
    iqr: number | null;
  };
  difference_of_means: number | null;
  total_valid_samples: number;
  total_missing_samples: number;
  binned_distribution: Array<{
    range: string;
    pass_count: number;
    fail_count: number;
  }>;
  disclaimer: string;
}

export interface SecomMLEvaluation {
  is_trained: boolean;
  status?: string;
  algorithm: string;
  dataset: string;
  total_samples?: number;
  train_samples?: number;
  test_samples?: number;
  train_test_split?: string;
  features_evaluated?: number;
  constant_features_removed?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  balanced_accuracy?: number;
  confusion_matrix?: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
  top_feature_importance?: Array<{ sensor: string; importance: number }>;
  model_version?: string;
  evaluated_at?: string;
  disclaimer: string;
}
