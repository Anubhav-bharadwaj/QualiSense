import {
  User,
  TokenResponse,
  AuditLogEntry,
  Batch,
  BatchDetail,
  QualityAlert,
  Investigation,
  InvestigationDossier,
  EffectivenessVerification,
  CorrectiveAction,
  DashboardSummary,
  SustainabilitySummary,
  ProductionLine,
  ProductProfile,
  MLPrediction,
  SecomDatasetSummary,
  SecomRecordSummary,
  SecomRecordDetail,
  SecomFeatureStat,
  SecomDistribution,
  SecomMetadata,
  SecomMLReadiness,
  SecomImportResponse,
  SecomCorrelationResult,
  SecomPassFailComparison,
  SecomMLEvaluation
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

let inMemoryToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  inMemoryToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("qualisense_access_token", token);
    } else {
      localStorage.removeItem("qualisense_access_token");
    }
  }
}

export function getApiAccessToken(): string | null {
  if (inMemoryToken) return inMemoryToken;
  if (typeof window !== "undefined") {
    return localStorage.getItem("qualisense_access_token");
  }
  return null;
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getApiAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      let message = `Request failed: ${res.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) message = errorJson.detail;
      } catch {
        if (errorText) message = errorText;
      }
      throw new Error(message);
    }

    return await res.json();
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Demo Reset
  resetDemoData: () => fetchJson<{ message: string }>("/api/demo/reset", { method: "POST" }),

  // Master Data
  getLines: () => fetchJson<ProductionLine[]>("/api/lines"),
  getProducts: () => fetchJson<ProductProfile[]>("/api/products"),

  // Dashboard
  getDashboardSummary: (lineId?: number) =>
    fetchJson<DashboardSummary>(lineId ? `/api/dashboard/summary?line_id=${lineId}` : "/api/dashboard/summary"),

  // Batches
  getBatches: (params?: { lineId?: number; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.lineId) searchParams.append("line_id", params.lineId.toString());
    if (params?.status && params.status !== "All") searchParams.append("status_filter", params.status);
    if (params?.search) searchParams.append("search", params.search);
    const qs = searchParams.toString();
    return fetchJson<Batch[]>(`/api/batches${qs ? `?${qs}` : ""}`);
  },

  getBatchDetail: (id: number) => fetchJson<BatchDetail>(`/api/batches/${id}`),

  createBatch: (data: { batch_code: string; product_profile_id: number; line_id: number; target_quantity: number }) =>
    fetchJson<Batch>("/api/batches", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateBatchDisposition: (id: number, data: { status: string; disposition_notes?: string }) =>
    fetchJson<Batch>(`/api/batches/${id}/disposition`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Production Readings & Rules Engine
  addReading: (batchId: number, data: {
    stage: string;
    parameter: string;
    value: number;
    unit: string;
    operator_name?: string;
    source?: string;
  }) =>
    fetchJson<{ reading: any; alert?: QualityAlert; message: string }>(`/api/batches/${batchId}/readings`, {
      method: "POST",
      body: JSON.stringify({ batch_id: batchId, ...data }),
    }),

  // Quality Alerts
  getAlerts: (params?: { severity?: string; status?: string; batchId?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.severity && params.severity !== "All") searchParams.append("severity", params.severity);
    if (params?.status && params.status !== "All") searchParams.append("status_filter", params.status);
    if (params?.batchId) searchParams.append("batch_id", params.batchId.toString());
    const qs = searchParams.toString();
    return fetchJson<QualityAlert[]>(`/api/alerts${qs ? `?${qs}` : ""}`);
  },

  updateAlert: (id: number, data: { status: string; resolved_by?: string }) =>
    fetchJson<QualityAlert>(`/api/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Investigation
  getInvestigationByAlert: (alertId: number) => fetchJson<Investigation>(`/api/investigations/${alertId}`),

  getInvestigationDossier: (investigationId: number) =>
    fetchJson<InvestigationDossier>(`/api/investigations/${investigationId}/dossier`),

  saveInvestigation: (data: {
    alert_id: number;
    batch_id: number;
    notes?: string;
    cause_status?: string;
    investigator_name?: string;
    five_whys?: any[];
    fishbone?: any;
    effectiveness_verification?: EffectivenessVerification;
  }) =>
    fetchJson<Investigation>("/api/investigations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Corrective Actions
  getActions: (params?: { status?: string; priority?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== "All") searchParams.append("status_filter", params.status);
    if (params?.priority && params.priority !== "All") searchParams.append("priority", params.priority);
    const qs = searchParams.toString();
    return fetchJson<CorrectiveAction[]>(`/api/actions${qs ? `?${qs}` : ""}`);
  },

  createAction: (data: {
    investigation_id?: number;
    batch_id: number;
    title: string;
    description: string;
    owner_name: string;
    owner_role?: string;
    priority?: string;
    due_date: string;
  }) =>
    fetchJson<CorrectiveAction>("/api/actions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAction: (id: number, data: {
    status?: string;
    owner_name?: string;
    priority?: string;
    due_date?: string;
    completion_note?: string;
  }) =>
    fetchJson<CorrectiveAction>(`/api/actions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Quality Analytics
  getQualityAnalytics: () => fetchJson<{
    total_batches: number;
    first_pass_rate: number;
    reworked_batches_count: number;
    pareto_distribution: Array<{
      parameter: string;
      count: number;
      percentage: number;
      cumulative_percentage: number;
    }>;
    line_breakdown: Array<{
      line_name: string;
      total_batches: number;
      fpq_rate: number;
      open_deviations: number;
    }>;
    disclaimer: string;
  }>("/api/analytics/quality"),

  // Sustainability Summary
  getSustainabilitySummary: () => fetchJson<SustainabilitySummary>("/api/sustainability/summary"),

  // ML Signal Prediction
  predictMLRisk: (data: {
    temperature: number;
    ph: number;
    mixing_speed: number;
    viscosity: number;
    filling_quantity: number;
    product_category?: string;
  }) =>
    fetchJson<MLPrediction>("/api/ml/predict", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // ==========================================
  // SECOM REAL MANUFACTURING DATASET MODULE
  // ==========================================
  getSecomSummary: () => fetchJson<SecomDatasetSummary>("/api/datasets/secom/summary"),

  getSecomRecords: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    searchId?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.pageSize) searchParams.append("page_size", params.pageSize.toString());
    if (params?.status && params.status !== "All") searchParams.append("status", params.status);
    if (params?.searchId !== undefined && !isNaN(params.searchId)) searchParams.append("search_id", params.searchId.toString());
    if (params?.sortBy) searchParams.append("sort_by", params.sortBy);
    if (params?.sortOrder) searchParams.append("sort_order", params.sortOrder);
    const qs = searchParams.toString();
    return fetchJson<{
      items: SecomRecordSummary[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }>(`/api/datasets/secom/records${qs ? `?${qs}` : ""}`);
  },

  getSecomRecordDetail: (id: number) =>
    fetchJson<SecomRecordDetail>(`/api/datasets/secom/records/${id}`),

  getSecomFeatures: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    onlyConstant?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.pageSize) searchParams.append("page_size", params.pageSize.toString());
    if (params?.search) searchParams.append("search", params.search);
    if (params?.onlyConstant !== undefined) searchParams.append("only_constant", params.onlyConstant.toString());
    if (params?.sortBy) searchParams.append("sort_by", params.sortBy);
    if (params?.sortOrder) searchParams.append("sort_order", params.sortOrder);
    const qs = searchParams.toString();
    return fetchJson<{
      items: SecomFeatureStat[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }>(`/api/datasets/secom/features${qs ? `?${qs}` : ""}`);
  },

  getSecomDistribution: () =>
    fetchJson<SecomDistribution>("/api/datasets/secom/distribution"),

  getSecomMetadata: () =>
    fetchJson<SecomMetadata>("/api/datasets/secom/metadata"),

  getSecomMLReadiness: () =>
    fetchJson<SecomMLReadiness>("/api/datasets/secom/ml-readiness"),

  getSecomCorrelation: (featX: string, featY: string) =>
    fetchJson<SecomCorrelationResult>(`/api/datasets/secom/correlation?feat_x=${featX}&feat_y=${featY}`),

  getSecomPassFailComparison: (feature: string) =>
    fetchJson<SecomPassFailComparison>(`/api/datasets/secom/comparison?feature=${feature}`),

  getSecomMLEvaluation: () =>
    fetchJson<SecomMLEvaluation>("/api/datasets/secom/ml/evaluation"),

  trainAndEvaluateSecomML: () =>
    fetchJson<SecomMLEvaluation>("/api/datasets/secom/ml/train-evaluate", {
      method: "POST",
    }),

  triggerSecomImport: (forceReload: boolean = false) =>
    fetchJson<SecomImportResponse>(`/api/datasets/secom/import?force_reload=${forceReload}`, {
      method: "POST",
    }),

  // Authentication & Session
  login: (data: { email: string; password: string; remember_me?: boolean }) =>
    fetchJson<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  register: (data: { full_name: string; email: string; password: string; organisation?: string }) =>
    fetchJson<TokenResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    fetchJson<{ message: string }>("/api/auth/logout", {
      method: "POST",
    }),

  refreshToken: () =>
    fetchJson<TokenResponse>("/api/auth/refresh", {
      method: "POST",
    }),

  getMe: () => fetchJson<User>("/api/auth/me"),

  updateProfile: (data: { name?: string; organisation?: string }) =>
    fetchJson<User>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  changePassword: (data: { current_password: string; new_password: string }) =>
    fetchJson<{ message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  forgotPassword: (data: { email: string }) =>
    fetchJson<{ message: string; recovery_token?: string; reset_url_example?: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { token: string; new_password: string }) =>
    fetchJson<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Admin User Management & Audit Logs
  adminListUsers: (params?: { search?: string; role?: string; is_active?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append("search", params.search);
    if (params?.role && params.role !== "All") searchParams.append("role", params.role);
    if (params?.is_active !== undefined) searchParams.append("is_active", params.is_active.toString());
    const qs = searchParams.toString();
    return fetchJson<User[]>(`/api/auth/admin/users${qs ? `?${qs}` : ""}`);
  },

  adminCreateUser: (data: { name: string; email: string; password: string; role: string; organisation?: string }) =>
    fetchJson<User>("/api/auth/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  adminUpdateUser: (id: number, data: { name?: string; role?: string; organisation?: string; is_active?: boolean }) =>
    fetchJson<User>(`/api/auth/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  adminResetUserPassword: (id: number, data: { new_password?: string }) =>
    fetchJson<{ message: string; temporary_password?: string }>(`/api/auth/admin/users/${id}/reset-password`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  adminGetAuditLogs: (limit: number = 50) =>
    fetchJson<AuditLogEntry[]>(`/api/auth/admin/audit-logs?limit=${limit}`),
};

