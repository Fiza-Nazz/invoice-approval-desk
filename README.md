<div align="center">

# 🏢 Invoice Approval Desk

### *Enterprise Accounts Payable Review Desk & Automated Duplicate Sentinel*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B_%7C_v24-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Vitest](https://img.shields.io/badge/Tests-13%2F13_Passing-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

<p align="center">
  <a href="#-key-features">Features</a> &bull;
  <a href="#-system-architecture">Architecture</a> &bull;
  <a href="#-quick-start">Quick Start</a> &bull;
  <a href="#-state-machine--business-rules">State Machine</a> &bull;
  <a href="#-api-documentation">API Reference</a> &bull;
  <a href="#-test-suite">Testing</a> &bull;
  <a href="docs/SCHEMA.md">Schema Docs</a>
</p>

</div>

---

## 📖 Executive Summary

**Invoice Approval Desk** is an audit-grade accounts payable workflow platform designed to streamline vendor billing verification, detect duplicate invoice submissions, and record permanent approval/rejection decisions to an ACID-compliant database.

Built from the ground up in **TypeScript strict mode**, the application features:
- **Zero-Setup Database Engine:** Single-file SQLite storage (`data/invoices.db`) powered by an adaptive abstraction layer supporting Node 22+ built-in `node:sqlite` and `better-sqlite3` with zero native C++ compiler requirements.
- **Tamper-Resistant State Machine:** Enforces strict transition legality (`processing` &rarr; `needs_review` &rarr; `approved`/`rejected`). Final decisions are strictly immutable, returning HTTP `409 Conflict` on re-decision attempts.
- **Automated Duplicate Detection:** Flags matching vendor submissions, links candidates via foreign keys (`duplicate_of_id`), and provides a side-by-side reconciliation interface.
- **Executive Navy Blue & White UI:** Clean, responsive React 18 interface with real-time client search, live tab counters, multi-color functional action triggers, and reviewer audit trails.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🛡️ **Duplicate Sentinel** | Automated matching engine flags duplicate candidate submissions based on `(vendor, invoice_number)` and `(vendor, amount, date)`. |
| 🔒 **Immutable Terminal States** | Finalized statuses (`approved`, `rejected`) cannot be reverted or overwritten, preserving audit integrity with explicit `409 Conflict` responses. |
| 💰 **Cents-Exact Accounting** | All monetary amounts are stored strictly as integer cents (`amount_cents`), eliminating floating-point rounding inaccuracies. |
| ⚡ **Universal SQLite Adapter** | Dual-driver engine automatically utilizes Node 22/24 native `node:sqlite` or `better-sqlite3`, eliminating compilation errors on fresh machines. |
| 🗂️ **Shared Domain Contracts** | Types, DTOs, and transition validation rules live in a shared workspace package (`@invoice-desk/shared`) guaranteeing compile-time type alignment. |
| 🔍 **Live Search & Filter** | Instant client-side search across vendor names, invoice numbers, and line-item descriptions without breaking active tab filters. |
| 📝 **Reviewer Audit Trails** | Captures optional reviewer decision notes and timestamps (`decided_at`, `updated_at`) directly into SQLite. |

---

## 🏛 System Architecture

The project is structured as a clean **npm workspace monorepo**:

```
invoice-approval-desk/
├── 📁 shared/                  # Domain contracts & transition state engine
│   ├── src/index.ts            # Invoice models, DTOs, transition validator
│   └── package.json
├── 📁 server/                  # Backend Express REST API
│   ├── src/
│   │   ├── db/                 # Database layer & migrations
│   │   │   ├── connection.ts   # SQLite connection manager & schema DDL
│   │   │   ├── sqliteAdapter.ts# Universal driver adapter (node:sqlite / better-sqlite3)
│   │   │   ├── invoicesRepository.ts # Data Access Layer (DAL)
│   │   │   └── seed.ts         # Idempotent database seeder (6 sample records)
│   │   ├── routes/             # Express API endpoints (/api/health, /api/invoices)
│   │   ├── services/           # InvoicesService (business rules & state machine)
│   │   ├── validators/         # Zod schemas for query, params, and body payloads
│   │   ├── middleware/         # Uniform JSON error handler { error: { code, message } }
│   │   ├── app.ts              # Express application factory & middleware setup
│   │   └── index.ts            # Entrypoint listening on port 4000
│   └── tests/                  # Integration test suite (Vitest + Supertest)
├── 📁 web/                     # React 18 + Vite frontend SPA
│   ├── src/
│   │   ├── api/client.ts       # Typed API client with response/error normalization
│   │   ├── components/         # Tabs, InvoiceList, InvoiceDetail, StatusBadge
│   │   ├── App.tsx             # State coordinator for tabs and views
│   │   └── index.css           # Clean Navy Blue + White responsive styling
│   └── vite.config.ts          # Dev server with /api proxy to port 4000
├── 📁 docs/
│   └── SCHEMA.md               # Data model writeup, columns, and design decisions
├── 📁 data/
│   └── invoices.db             # Persisted SQLite database file (WAL mode)
└── package.json                # Root package with monorepo scripts
```

---

## 🚀 Quick Start

The repository is built to run out-of-the-box on a fresh machine with only **Node.js (v20+)** installed.

### 1. Installation
```bash
git clone https://github.com/Fiza-Nazz/invoice-approval-desk.git
cd invoice-approval-desk
npm install
```

### 2. Seed Database
Resets and seeds the SQLite database with **6 realistic invoices** (3 processing, 1 duplicate needs_review, 1 approved, 1 rejected):
```bash
npm run seed
```

### 3. Start Development Servers
Runs both the Express API and Vite Web UI concurrently:
```bash
npm run dev
```

| Service | Port | Endpoint |
|---|:---:|---|
| **Web UI** | `5173` | [http://localhost:5173](http://localhost:5173) |
| **REST API** | `4000` | [http://localhost:4000/api](http://localhost:4000/api) |
| **Health Check** | `4000` | [http://localhost:4000/api/health](http://localhost:4000/api/health) |

### 4. Run Automated Tests
```bash
npm test
```

### 5. Run Strict Typechecking
```bash
npm run typecheck
```

---

## 🔄 Status Lifecycle & Business Rules

Invoices follow a unidirectional state machine to prevent unauthorized transition overrides:

```
                    +-----------------------+
                    |      processing       |
                    +-----------+-----------+
                                |
                +---------------+---------------+
                |                               |
                v                               v
       +-----------------+             +-----------------+
       |  needs_review   |             |   Terminal:     |
       +--------+--------+             |  approved /     |
                |                      |   rejected      |
                +--------------------->| (Immutable 409) |
                                       +-----------------+
```

### Transition Matrix

| Current State | Target: `processing` | Target: `needs_review` | Target: `approved` | Target: `rejected` |
|---|:---:|:---:|:---:|:---:|
| **`processing`** | ❌ 409 Conflict | ✅ Allowed | ✅ Sets `decided_at` | ✅ Sets `decided_at` |
| **`needs_review`** | ❌ 409 Conflict | ❌ 409 Conflict | ✅ Sets `decided_at` | ✅ Sets `decided_at` |
| **`approved`** | ❌ 409 (Final) | ❌ 409 (Final) | ❌ 409 (Final) | ❌ 409 (Final) |
| **`rejected`** | ❌ 409 (Final) | ❌ 409 (Final) | ❌ 409 (Final) | ❌ 409 (Final) |

> [!NOTE]
> Setting the identical status again, or attempting any invalid transition, returns **HTTP 409 Conflict** with a descriptive JSON error payload.

---

## 📊 Seed Data Distribution

The seed script (`npm run seed`) guarantees a clean, reproducible database state:

| ID | Invoice # | Vendor Name | Amount | Status | Details |
|:---:|:---:|---|:---:|:---:|---|
| **1** | `INV-2026-101` | Apex Concrete & Aggregates | $14,250.00 | `processing` | Ready-mix batch delivery (Original) |
| **2** | `INV-2026-102` | Titan Steel Fabricators | $8,900.00 | `processing` | Structural I-beams and rebar |
| **3** | `INV-2026-103` | BuildRight Timber Supply | $3,450.00 | `processing` | Pressure-treated lumber & plywood |
| **4** | `INV-2026-101` | Apex Concrete & Aggregates | $14,250.00 | `needs_review` | **Duplicate of #1** (`duplicate_of_id = 1`) |
| **5** | `INV-2026-095` | Metro Electrical Wholesale | $5,120.00 | `approved` | Commercial 3-phase switchboard |
| **6** | `INV-2026-098` | Vanguard Heavy Equipment | $7,800.00 | `rejected` | Disputed rate above master contract |

---

## 📡 REST API Documentation

All endpoints are hosted under `/api`. Responses are standard JSON with uniform error envelopes:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error description"
  }
}
```

### 1. Health Check
- **Endpoint:** `GET /api/health`
- **Purpose:** Verifies server uptime and availability.

```bash
curl -X GET http://localhost:4000/api/health
```

```json
{
  "ok": true
}
```

---

### 2. List Invoices
- **Endpoint:** `GET /api/invoices`
- **Query Parameters:**
  - `status` *(optional)*: Comma-separated status filters (e.g. `processing`, `needs_review`, `approved,rejected`).

```bash
curl -X GET "http://localhost:4000/api/invoices?status=processing"
```

```json
{
  "data": [
    {
      "id": 1,
      "invoice_number": "INV-2026-101",
      "vendor_name": "Apex Concrete & Aggregates",
      "amount_cents": 1425000,
      "currency": "USD",
      "invoice_date": "2026-10-01",
      "due_date": "2026-10-31",
      "description": "Ready-mix batch concrete delivery for Foundation Sector B",
      "status": "processing",
      "duplicate_of_id": null,
      "review_reason": null,
      "decided_at": null,
      "created_at": "2026-10-01T08:30:00.000Z",
      "updated_at": "2026-10-01T08:30:00.000Z"
    }
  ],
  "counts": {
    "processing": 3,
    "needs_review": 1,
    "approved": 1,
    "rejected": 1,
    "total": 6
  }
}
```

---

### 3. Get Invoice by ID
- **Endpoint:** `GET /api/invoices/:id`
- **Purpose:** Returns complete invoice detail. If the record is flagged as a duplicate, an `original_invoice` summary object is embedded.

```bash
curl -X GET http://localhost:4000/api/invoices/4
```

```json
{
  "data": {
    "id": 4,
    "invoice_number": "INV-2026-101",
    "vendor_name": "Apex Concrete & Aggregates",
    "amount_cents": 1425000,
    "currency": "USD",
    "invoice_date": "2026-10-01",
    "due_date": "2026-10-31",
    "description": "Duplicate submission: Ready-mix batch concrete delivery for Foundation Sector B",
    "status": "needs_review",
    "duplicate_of_id": 1,
    "review_reason": "Possible duplicate of INV-1001 (Same vendor, invoice number, and identical amount $14,250.00)",
    "decided_at": null,
    "created_at": "2026-10-06T14:20:00.000Z",
    "updated_at": "2026-10-06T14:20:00.000Z",
    "original_invoice": {
      "id": 1,
      "invoice_number": "INV-2026-101",
      "vendor_name": "Apex Concrete & Aggregates",
      "amount_cents": 1425000,
      "currency": "USD",
      "status": "processing"
    }
  }
}
```

---

### 4. Update Invoice Status
- **Endpoint:** `PATCH /api/invoices/:id/status`
- **Request Body:**
  ```json
  {
    "status": "approved", // "approved" | "rejected" | "needs_review"
    "note": "PO matched with warehouse delivery receipt" // optional
  }
  ```

```bash
curl -X PATCH http://localhost:4000/api/invoices/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "approved", "note": "Verified by AP Supervisor"}'
```

```json
{
  "data": {
    "id": 1,
    "invoice_number": "INV-2026-101",
    "vendor_name": "Apex Concrete & Aggregates",
    "amount_cents": 1425000,
    "currency": "USD",
    "status": "approved",
    "review_reason": "Verified by AP Supervisor",
    "decided_at": "2026-10-12T15:25:28.641Z",
    "created_at": "2026-10-01T08:30:00.000Z",
    "updated_at": "2026-10-12T15:25:28.641Z",
    "original_invoice": null
  }
}
```

#### Error Handling Responses:
- **HTTP 409 Conflict:** When transitioning an already finalized invoice or submitting an identical status.
- **HTTP 400 Bad Request:** When body fails Zod schema validation.
- **HTTP 404 Not Found:** When target invoice ID does not exist.

---

## 🧪 Test Suite

The automated test suite runs via **Vitest** and **Supertest** against an isolated in-memory SQLite database:

```bash
npm test
```

```
 ✓ tests/invoices.test.ts (13 tests) 466ms
   ✓ GET /api/health should return ok: true
   ✓ GET /api/invoices should list all invoices with counts
   ✓ GET /api/invoices?status=processing should filter by status
   ✓ GET /api/invoices?status=approved,rejected should support comma-separated filters
   ✓ GET /api/invoices/:id returns single invoice with all fields
   ✓ GET /api/invoices/:id includes original invoice summary when duplicate_of_id is present
   ✓ GET /api/invoices/:id returns 404 for missing invoice
   ✓ PATCH /api/invoices/:id/status allows valid status change (processing -> approved)
   ✓ PATCH /api/invoices/:id/status allows valid status change (needs_review -> rejected)
   ✓ PATCH /api/invoices/:id/status returns 409 Conflict for invalid transition on finalized invoice
   ✓ PATCH /api/invoices/:id/status returns 409 Conflict when setting identical status
   ✓ PATCH /api/invoices/:id/status returns 404 for missing invoice
   ✓ PATCH /api/invoices/:id/status returns 400 for invalid body

 Test Files  1 passed (1)
      Tests  13 passed (13)
```

---

## 📑 Schema & Architectural Reference

Detailed architectural specifications, DDL statements, duplicate rule execution points, and rationale are documented in:
👉 **[`docs/SCHEMA.md`](docs/SCHEMA.md)**

---

## ⚖️ Trade-offs & Production Roadmap

### Trade-offs & Assumptions
1. **Single-File SQLite:** Chosen for zero-setup execution. The custom `sqliteAdapter` bridges Node.js 22+ native `node:sqlite` and `better-sqlite3`, ensuring compatibility across operating systems without C++ compilation hurdles.
2. **Deterministic Duplicate Rule:** Matches on `(vendor_name, invoice_number)` and identical `(vendor_name, amount_cents, invoice_date)`. In enterprise production, OCR noise often requires fuzzy Levenshtein distance heuristics.
3. **Tab Preserved Navigation:** Navigating from the list to detail view and clicking *"Back to Invoices Queue"* preserves the active tab and client filter state.

### Future Roadmap
- [ ] **Pagination & Sorting:** Cursor-based pagination for high-volume queues (>100k invoices).
- [ ] **Audit Trail Log Table:** Dedicated `invoice_audit_logs` table tracking IP, user ID, and diff history.
- [ ] **PDF & OCR Preview:** Embedded PDF viewer with side-by-side line item highlighting.
- [ ] **Dual Approval Thresholds:** Multi-tier authorization rules for invoices exceeding $10,000.

---

## 📜 License

This project is licensed under the **MIT License** &bull; Created for Accounts Payable Engineering Desk.
