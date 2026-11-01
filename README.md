# QualiSense AI — Predictive Quality Monitoring & Defect Prevention

> **Prepared for the L’Oréal Sustainability Challenge – Manufacturing & Plant**  
> **Option 02: “Getting Quality Right First Time”**  
> *A Decision-Support Prototype for Cosmetic Manufacturing Process Deviation Detection, 5 Whys Root-Cause Investigation, CAPA Effectiveness Verification, Avoidable Rework Accounting, and Industrial Dataset Exploration.*

---

## 1. Executive Summary & Product Goal
In cosmetics manufacturing (creams, emulsions, shampoos, serums), batch quality deviations—such as phase separation, viscosity drift, or thermal degradation of active ingredients—are frequently detected late during packaging, filling, or final laboratory release. Late rejection results in massive bulk scrapping or costly, resource-intensive rework requiring repeated Clean-In-Place (CIP) washdowns and re-homogenization energy.

**QualiSense AI** enables manufacturing operators and quality engineers to:
1. **Detect process deviations early** during bulk compounding (Pre-mix, Mixing, Homogenization, Cooling, Filling) using explainable, configurable physical rules.
2. **Prioritize daily actions dynamically** via the **"Recommended Actions Today"** operational queue driven by active deviations, quarantine holds, and repeat patterns.
3. **Investigate root causes systematically** through a full **6-Stage Quality Workflow**:
   `Deviation Detection` → `Evidence Collection` → `5 Whys / Fishbone` → `Cause Verification` → `CAPA Implementation` → `Effectiveness Verification`.
4. **Export complete Investigation Dossiers** as formal engineering reports formatted for plant auditing and PDF printing.
5. **Reconcile quality & sustainability accounting** with strict mathematical consistency (eliminating double-counting between historical logged rework and prospective avoidable scenario waste).
6. **Compare intervention scenarios** (Cooling Trim, VFD Inverter, CIP Recirculation, Pre-mix Blending) with interactive Before vs After resource delta analysis.
7. **Explore real manufacturing telemetry** via an isolated **UCI SECOM Semiconductor Module** featuring pairwise sensor correlation, pass-vs-fail distribution analysis, and genuine Scikit-Learn Random Forest benchmark evaluation with strict zero data leakage.

---

## 2. Technical Stack & Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           QUALISENSE AI ARCHITECTURE                      │
└───────────────────────────────────────────────────────────────────────────┘
               │                                            ▲
               ▼ (HTTP / JSON REST)                         │
┌───────────────────────────────┐           ┌───────────────────────────────┐
│       Next.js 14 Frontend     │           │      FastAPI Python Backend   │
│  • App Router (TypeScript)    │           │  • FastAPI REST Endpoints     │
│  • Tailwind CSS               │◄─────────►│  • Centralized MetricsService │
│  • Recharts Data Viz          │           │  • Rule Engine (Configurable) │
│  • Lucide React Icons         │           │  • SQLAlchemy 2.0 ORM         │
│  • Responsive Industrial SaaS │           │  • SQLite Local Database      │
│  • Clean Print / PDF Styling  │           │  • Scikit-Learn ML Benchmark  │
└───────────────────────────────┘           └───────────────────────────────┘
                                                            │
                                                            ▼
                                            ┌───────────────────────────────┐
                                            │     qualisense.db (SQLite)    │
                                            │  Batches, Readings, Alerts,   │
                                            │  Investigations, CAPA, SECOM  │
                                            └───────────────────────────────┘
```

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons.
- **Backend:** FastAPI (Python 3.13), SQLAlchemy 2.0, Pydantic v2 schemas, SQLite (`qualisense.db`), Scikit-Learn 1.9, Pandas.
- **Data Architecture:** 100% data-driven persistence with zero hardcoded metrics. Strict physical and logical segregation between cosmetics demo data and semiconductor research telemetry.

---

## 3. Quick Start & Setup Instructions

### Prerequisites
- **Node.js**: v18+ (tested on Node v24.14)
- **Python**: 3.10+ (tested on Python 3.13)
- **Package Managers**: npm, pip

### Step 1: Start Backend (FastAPI)
Open a terminal in the project root:

```bash
# 1. Activate Python virtual environment
# Windows PowerShell:
.\backend\venv\Scripts\Activate.ps1
# Or Command Prompt:
# .\backend\venv\Scripts\activate.bat
# Linux/macOS:
# source backend/venv/bin/activate

# 2. Start the FastAPI development server
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
*The backend API will boot at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.*

### Step 2: Start Frontend (Next.js)
Open a second terminal in the project root:

```bash
cd frontend
npm run dev
```
*The web application will open at `http://localhost:3000`.*

---

## 4. Key Refinements & Advanced Capabilities

### A. Dynamic "Recommended Actions Today"
Generated dynamically in `QualityMetricsService.get_recommended_actions_today(db)` from active records without hardcoded placeholders:
- **P0 Urgent Alerts:** Direct deep-link to the 5 Whys workspace for active critical excursions.
- **Quarantine Holds:** Direct link to batch disposition review for batches quarantined in Quality Review.
- **CAPA Execution:** Direct link to Action Centre for open/in-progress engineering work orders.
- **Recurring Shift Patterns:** Pareto frequency trigger alerting engineers when repeated deviations occur across runs.

### B. Complete 6-Stage Investigation Workflow & Effectiveness Verification
Investigations follow standard ISO 9001 / ICH Q10 pharmaceutical & cosmetic quality management:
1. **Deviation Detection:** Inline sensor reading exceeds recipe limits.
2. **Evidence Collection:** Handheld cross-verification, operator observations, ambient logs.
3. **Root-Cause Analysis:** Interactive 5 Whys sequence + 6M Fishbone categorization (Machine, Method, Material, Manpower, Measurement, Environment).
4. **Cause Verification:** Confirmation by senior quality engineer (status: *Engineer-Confirmed*, *Ruled Out*, etc.).
5. **CAPA Execution:** Corrective & Preventive Action assignment with owner, due date, priority, and completion note.
6. **Effectiveness Verification:** Formal post-intervention check requiring:
   - Verification date & assigned auditor/owner.
   - Post-intervention parameter readings table (verifying physical return to nominal bounds).
   - Recurrence observation check (Yes/No).
   - Audit status (*Pending Verification*, *Effective*, *Partially Effective*, *Ineffective*).
   - *Actions are never marked automatically effective simply because tasks were marked completed.*

### C. Investigation Dossier Export & Print Formatting
- One-click **"Export Investigation Dossier"** modal generating an industrial quality report.
- Includes batch metadata, excursion timeline, complete 5 Whys, 6M Fishbone breakdown, CAPA status, effectiveness signoff, and resource impact accounting.
- Supports **`window.print()`** with dedicated print stylesheets (`@media print`) hiding UI navigation bars and rendering a clean 2-page executive summary.

### D. Audited KPI Consistency & Denominator Documentation
All quality calculations use the centralized `QualityMetricsService`:
- **Primary Completed First-Pass Quality (FPY): 83.3%**
  - *Numerator:* 5 batches released without deviation or rework.
  - *Denominator:* 6 completed batches reaching final disposition (5 Released, 1 Rework, 0 Rejected).
- **Plant Total Run Quality: 75.0%**
  - *Numerator:* 6 batches with clean first-pass run.
  - *Denominator:* All 8 monitored batches (including active in-progress and quarantined review lots).
- All charts capped at 100% to prevent impossible percentage values.

### E. Reconciled Sustainability Accounting & Intervention Simulator
- **Zero Double-Counting:** Decoupled historical logged rework waste (**27.0 kg scrap**, 1,080 L CIP water) from prospective avoidable waste (**225.0 kg scrap**, 9,000 L CIP water).
- **Intervention Comparison Simulator:** Allows engineers to evaluate 4 selectable interventions:
  1. *Thermal Cooling Jacket Trim (Early Detection)*: -95.6% scrap reduction (saves 215 kg).
  2. *High-Shear VFD Inverter Speed Control*: -75.6% scrap reduction (saves 170 kg).
  3. *CIP Turbidity Recirculation Loop*: -48.9% scrap reduction (saves 110 kg).
  4. *Raw Material Pre-Mix Viscosity Tuning*: -62.2% scrap reduction (saves 140 kg).
  - Displays Before vs After comparative cards, Recharts comparative bar chart, and transparent engineering multipliers.

---

## 5. UCI SECOM Real-World Manufacturing Dataset Lab

The application includes the real-world **SECOM dataset from the UCI Machine Learning Repository** (1,567 observations × 590 anonymised sensor channels) maintained as an isolated research module.

### Features Added to the Dataset Lab:
1. **Pairwise Sensor Correlation Explorer:**
   - Select any two sensor channels (`Sensor_0` to `Sensor_589`) or choose informative presets (`Sensor_59` vs `Sensor_103`).
   - Scatter plot rendered with dual color coding (Teal for Pass wafers, Red for Defect scrap).
   - Displays Pearson correlation coefficient ($r$), valid joint sample count ($N$), and missing counts for X and Y.
   - Prominent scientific disclaimer: *Correlation does NOT establish physical causation or defect mechanisms.*
2. **Pass vs Fail Distribution Comparison:**
   - Select any sensor channel to compare empirical moments between normal yield (`-1`) and defect (`+1`) wafers.
   - Statistical comparison table: Sample Count, Mean ($\mu$), Standard Deviation ($\sigma$), Median, IQR, Min/Max, and Difference of Means ($\Delta\mu$).
   - 6-bin frequency histogram comparing Pass vs Defect distributions.
   - Handles missing values without silent zero-fill.
3. **Genuine Scikit-Learn ML Experiment Benchmark:**
   - **Gated Untrained State:** Deliberately marked as *Not Trained* until engineering authorization to prevent synthetic fabrication.
   - **Real Scikit-Learn Training:** Clicking *Train & Evaluate Benchmark Model* triggers a real Random Forest classifier on 1,567 observations.
   - **Evaluated Performance (Zero Fabrication):**
     - Algorithm: Random Forest Classifier (100 Trees, Balanced Class Weights).
     - Split: 80% Train (1,253) / 20% Held-Out Test (314) Stratified.
     - Recall (Minority Class): **52.4%** (Catches >52% of defect wafers).
     - Precision: **16.4%** (Reflects extreme 14:1 imbalance).
     - F1-Score: **0.250**.
     - Balanced Accuracy: **66.6%**.
     - 2x2 Held-Out Confusion Matrix: True Negatives (237), False Positives (56), False Negatives (10), True Positives (11).
     - Top 10 Informative Sensors (Gini Importance): `Sensor_103`, `Sensor_59`, `Sensor_33`, etc.
   - **Cross-Domain Validation Guardrail:** Clear warning that SECOM semiconductor telemetry is not validated for cosmetics manufacturing.

---

## 6. Authentication, Hardened Security & Role-Based Access Control (RBAC)

QualiSense AI incorporates an enterprise authentication and granular authorization layer protecting plant data integrity while enabling multi-disciplinary operational collaboration.

### A. Security Architecture
- **Password Cryptography:** Hardened **Argon2id** password hashing (`argon2-cffi`) resistant to GPU brute-force and side-channel attacks.
- **Dual-Layer Session Tokens:**
  - Short-lived **JWT access tokens** (15-minute expiration) carrying cryptographically verified user identity and role.
  - Long-lived **Refresh Sessions** (7-day expiration) stored in SQLite with SHA-256 token hashing, client IP/user-agent tracking, and automatic token rotation.
  - Secure **HTTP-only cookies** (`qualisense_access`, `qualisense_refresh`) preventing XSS token exfiltration, with dual support for `Authorization: Bearer <token>` API headers.
- **Brute-Force Protection:** In-memory sliding-window rate limiters on authentication endpoints (`/login`, `/register`, `/forgot-password`, `/reset-password`).
- **Audit Logging:** Immutable audit ledger (`audit_logs` table) recording security actions, user account creation, role elevations, and status updates.

### B. 4-Tier Role-Based Access Control (RBAC) Matrix

| Permission String | Administrator | Quality Engineer | Production Manager | Viewer |
| :--- | :---: | :---: | :---: | :---: |
| `dashboard.read` |  |  |  |  |
| `batches.read` |  |  |  |  |
| `batches.write` |  |  |  | ❌ |
| `alerts.read` |  |  |  |  |
| `alerts.write` |  |  | ❌ | ❌ |
| `investigations.read` |  |  |  |  |
| `investigations.write` |  |  | ❌ | ❌ |
| `capa.read` |  |  |  |  |
| `capa.write` |  |  | ❌ | ❌ |
| `analytics.read` |  |  |  |  |
| `sustainability.read` |  |  |  |  |
| `dataset.read` |  |  |  |  |
| `ml.run` |  |  | ❌ | ❌ |
| `users.read` |  | ❌ | ❌ | ❌ |
| `users.manage` |  | ❌ | ❌ | ❌ |
| `settings.manage` |  | ❌ | ❌ | ❌ |

### C. Seeded Demo Accounts (1-Click Quick-Fill Available on Login Page)

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@qualisense.internal` | `AdminPass@2026!` | Full plant operations, RBAC user management, audit trails, and security settings. |
| **Quality Engineer** | `sarah.chen@qualisense-demo.internal` | `QualityEng@2026!` | Add readings, investigate 5 Whys, create & verify CAPA, trigger ML benchmark. |
| **Production Manager** | `marc.dupont@qualisense-demo.internal` | `ProdMgr@2026!` | Review batches, record stage readings, inspect alerts, view analytics & ESG. |
| **Viewer** | `elena.rossi@qualisense-demo.internal` | `ViewerPass@2026!` | Read-only inspection across all monitoring dashboards and reports. |

> **Self-Registration Security Guardrail:**  
> All public self-registrations at `/register` are strictly assigned the **Viewer** role. Promotion to operational or administrative roles requires explicit action by an active Administrator via `/admin/users`.
>
> **Last-Admin Safeguard:**  
> The system actively rejects any attempt to deactivate or demote the final remaining active Administrator.

---

## 7. Application Routes & Navigation Map

- **`/` — Premium Public Landing Page:** Industrial product introduction, problem statement, interactive capabilities preview, 6-stage workflow, and quick access.
- **`/login` — Secure Login Portal:** Email & password authentication with 1-click demo role auto-fill buttons.
- **`/register` — Plant User Registration:** Self-service registration with password complexity meter and Viewer disclosure.
- **`/forgot-password` & `/reset-password` — Password Recovery:** Secure single-use token issuance and reset workflow.
- **`/dashboard` — Overview Dashboard:** Plant KPIs, first-pass quality rate, Pareto distribution, and Recommended Actions queue.
- **`/batches` & `/batches/[id]` — Batch Monitoring:** Telemetry history, out-of-range sensor alerts, and disposition review.
- **`/alerts` — Quality Alerts:** Live rule-based deviation management with lifecycle state transitions.
- **`/investigations` — 5 Whys & Fishbone:** Dossier builder, 6M Ishikawa classification, and report export.
- **`/actions` — Action Centre (CAPA):** Corrective work orders with owner, priority, and independent effectiveness verification.
- **`/analytics` — Quality Analytics:** Stage defect rates, Pareto distribution, and first-pass yield trends.
- **`/sustainability` — Sustainability & Rework:** Resource deficit tracking and 4-way intervention comparison simulator.
- **`/dataset-lab` — UCI SECOM Lab:** Semiconductor research telemetry, pairwise correlation, and real Random Forest benchmark.
- **`/profile` — Account & Security:** Display name, department edit, password update, and granted privileges inspector.
- **`/admin/users` — User Management Console:** Admin-only user directory, role assignment, active/inactive toggles, password resets, and live security audit trail.

---

## 8. Transparent Sustainability Multipliers

| Parameter | Multiplier | Engineering Basis |
| :--- | :--- | :--- |
| **Material Waste** | `0.045 kg / unit` | Bulk line dead volume loss and scrap discarded during vessel draining. |
| **Water Consumption (CIP)** | `1.80 L / unit` | Standard 3-stage Clean-In-Place protocol (pre-rinse, caustic wash, purified rinse). |
| **Process Energy** | `0.22 kWh / unit` | Reheating bulk emulsion to 75 °C + high-shear rotor-stator re-homogenization. |
| **Carbon Footprint** | `0.095 kg CO₂e / unit` | Regional grid emission factor + sanitization chemical footprint. |

> **Environmental Claim Disclosure:**  
> Calculations are transparent illustrative estimates for prototype decision support. They do **not** represent certified L’Oréal environmental data or third-party audited Life Cycle Assessment (LCA).

---

## 9. Automated Test Suite & Verification

QualiSense AI includes four comprehensive automated verification suites:

```bash
# 1. Run Authentication & RBAC Verification Tests:
python -m unittest -v backend/test_auth_rbac.py

# 2. Run Direct Backend & Rule Engine Tests:
python -m backend.test_direct

# 3. Run SECOM Real-World Manufacturing Dataset Integration Tests:
python -m backend.test_secom

# 4. Run Complete UI/UX Refinement & Product Enhancement Tests:
python -m unittest -v backend/test_enhancements.py

# 5. Run Frontend TypeScript & ESLint Verification:
npm --prefix ./frontend run lint
```

*All suites execute with 100% pass rates (0 errors, 0 failures).*

---

## 10. Honest Limitations & Roadmap

- **Simulated Cosmetics Data:** Cosmetics batch numbers, formulation bounds, and operator names are illustrative demonstration records.
- **Segregated Real Industrial Data:** SECOM telemetry is genuine research data from semiconductor wafer fabrication, strictly segregated from cosmetics production.
- **Decision Support Only:** Root cause analysis tools assist engineering investigations; they do not claim automated legal/physical causation.
- **Offline Local Architecture:** Designed for local standalone execution on SQLite without external cloud dependencies.
