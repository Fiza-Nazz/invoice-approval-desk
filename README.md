# 🏢 Invoice Approval Desk

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite_3-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

**A high-precision, full-stack Accounts Payable review desk with automated duplicate detection, strict status lifecycle state machines, and SQLite persistence.**

[Quick Start](#-quick-start) &bull;
[Architecture](#-architecture--monorepo-layout) &bull;
[REST API](#-rest-api-reference) &bull;
[Schema & Workflow](docs/SCHEMA.md) &bull;
[Testing](#-automated-testing)

</div>

---

## 📌 Project Overview

**Invoice Approval Desk** is an accounts payable review workspace designed to eliminate billing errors, catch duplicate supplier submissions, and commit irrevocable human decisions to an auditable database. 

Built with **TypeScript in strict mode** across both the backend and frontend, it features:
- **Zero-Setup Database:** SQLite single-file storage (`data/invoices.db`) using an adaptive driver that runs seamlessly on Node.js 22+ native `node:sqlite` or `better-sqlite3` without native build tool hurdles.
- **Enforced State Machine:** Invoices transition strictly through `processing` &rarr; `needs_review` &rarr; terminal `approved`/`rejected`. Modifying decided invoices returns HTTP `409 Conflict`.
- **Duplicate Sentinel:** Automatically links suspected duplicates (`duplicate_of_id`) when matching vendor/invoice number or amount/date combinations occur.
- **Navy Blue Executive UI:** Responsive React 18 SPA with real-time client search, tab metric counts, duplicate comparison panels, and accessible action buttons.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js (v20+ or v22+)**
- **npm (v9+)**

### 1. Clone & Install
```bash
git clone https://github.com/Fiza-Nazz/invoice-approval-desk.git
cd invoice-approval-desk
npm install
```

### 2. Seed Database
Initializes the SQLite schema and populates **6 realistic invoices** (including exactly 1 duplicate candidate):
```bash
npm run seed
```

### 3. Run Development Servers
Starts both the Express REST API (`:4000`) and the Vite React frontend (`:5173`) concurrently:
```bash
npm run dev
```

| Service | URL | Notes |
|---|---|---|
| **Web UI** | [http://localhost:5173](http://localhost:5173) | Single-page review interface |
| **REST API** | [http://localhost:4000/api](http://localhost:4000/api) | Express JSON endpoints |
| **Health Check** | [http://localhost:4000/api/health](http://localhost:4000/api/health) | Uptime status verification |

*(Note: Vite automatically proxies `/api` requests to `http://localhost:4000` during local development).*

### 4. Run Automated Tests
```bash
npm test
```

### 5. Run Typecheck Across All Workspaces
```bash
npm run typecheck
```

---

## 🏗 Architecture & Monorepo Layout

The application utilizes native **npm workspaces** to cleanly separate shared domain contracts, server API logic, and UI client code:

```
invoice-approval-desk/
├── docs/
│   └── SCHEMA.md               # Data model, status lifecycles, and design writeup
├── data/
│   └── invoices.db             # Persisted SQLite database file (created on seed)
├── shared/                     # Shared TypeScript domain contracts
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts            # DTOs, InvoiceStatus enums, transition validation
├── server/                     # Backend Express REST API
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── app.ts              # Express factory with CORS & error middleware
│   │   ├── index.ts            # Server port binding (default 4000)
│   │   ├── db/
│   │   │   ├── connection.ts   # SQLite connection manager & schema DDL
│   │   │   ├── sqliteAdapter.ts# Universal driver (node:sqlite / better-sqlite3)
│   │   │   ├── invoicesRepository.ts # Data access layer (DAL)
│   │   │   └── seed.ts         # Idempotent database seeder (6 sample records)
│   │   ├── middleware/
│   │   │   └── errorHandler.ts # Uniform { error: { code, message } } formatter
│   │   ├── routes/
│   │   │   ├── health.ts       # GET /api/health
│   │   │   └── invoices.ts     # Invoices REST endpoints
│   │   ├── services/
│   │   │   └── invoicesService.ts # Business rules & state transition validation
│   │   └── validators/
│   │       └── invoiceValidators.ts # Zod request schemas
│   └── tests/
│       └── invoices.test.ts    # Vitest automated test suite (13 integration tests)
├── web/                        # React 18 + Vite Frontend SPA
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts          # Dev server and /api proxy configuration
│   ├── index.html              # HTML shell
│   └── src/
│       ├── main.tsx            # React root mount
│       ├── App.tsx             # State coordinator for tabs and views
│       ├── index.css           # Clean white & Navy Blue styling
│       ├── api/
│       │   └── client.ts       # Typed fetch client with error normalization
│       └── components/
│           ├── Tabs.tsx        # Processing, Needs review, Decided tabs with counts
│           ├── InvoiceList.tsx # Table display with formatted currency and badges
│           ├── InvoiceDetail.tsx # Detailed view, duplicate warning, Approve/Reject
│           └── StatusBadge.tsx # Accessible color-coded badge tags
├── package.json                # Root package with monorepo scripts
└── README.md
```

---

## 🔄 Status Workflow & Business Rules

Invoices progress through a strict, tamper-resistant lifecycle:

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

### Transition Enforcement

| Current Status | `processing` | `needs_review` | `approved` | `rejected` |
|---|:---:|:---:|:---:|:---:|
| **`processing`** | ❌ 409 Conflict | ✅ Allowed | ✅ Sets `decided_at` | ✅ Sets `decided_at` |
| **`needs_review`** | ❌ 409 Conflict | ❌ 409 Conflict | ✅ Sets `decided_at` | ✅ Sets `decided_at` |
| **`approved`** | ❌ 409 (Final) | ❌ 409 (Final) | ❌ 409 (Final) | ❌ 409 (Final) |
| **`rejected`** | ❌ 409 (Final) | ❌ 409 (Final) | ❌ 409 (Final) | ❌ 409 (Final) |

- **Terminal States Are Immutable:** Once an invoice is marked `approved` or `rejected`, any subsequent change attempts return `409 Conflict`.
- **Duplicate Linking:** Duplicates feature `duplicate_of_id` referencing the original invoice, rendering a side-by-side comparison box with a direct inspection link.

---

## 📡 REST API Reference

Base URL: `/api`  
All responses use standard HTTP status codes and JSON payloads. Errors follow the format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error description"
  }
}
```

### 1. Health Check
`GET /api/health`

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
`GET /api/invoices`

**Query Parameters:**
- `status` *(optional)*: Single status or comma-separated list (e.g. `processing`, `needs_review`, `approved,rejected`).

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

### 3. Get Single Invoice
`GET /api/invoices/:id`

If the invoice has `duplicate_of_id`, an `original_invoice` summary is embedded:

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
`PATCH /api/invoices/:id/status`

**Request Body:**
```json
{
  "status": "approved",
  "note": "PO matched with signed delivery receipt"
}
```

```bash
curl -X PATCH http://localhost:4000/api/invoices/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "approved", "note": "Approved by AP Reviewer"}'
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
    "decided_at": "2026-10-12T15:25:28.641Z",
    "updated_at": "2026-10-12T15:25:28.641Z"
  }
}
```

*(Attempting to transition an already approved invoice returns HTTP `409 Conflict`).*

---

## 🧪 Automated Testing

The API includes 13 integration tests executed against an in-memory SQLite database instance:

```bash
npm test
```

```
 ✓ tests/invoices.test.ts (13 tests)
   ✓ Invoices API Tests > GET /api/health should return ok: true
   ✓ Invoices API Tests > GET /api/invoices should list all invoices with counts
   ✓ Invoices API Tests > GET /api/invoices?status=processing should filter by status
   ✓ Invoices API Tests > GET /api/invoices?status=approved,rejected should support comma-separated filters
   ✓ Invoices API Tests > GET /api/invoices/:id returns single invoice with all fields
   ✓ Invoices API Tests > GET /api/invoices/:id includes original invoice summary when duplicate_of_id is present
   ✓ Invoices API Tests > GET /api/invoices/:id returns 404 for missing invoice
   ✓ Invoices API Tests > PATCH /api/invoices/:id/status allows valid status change (processing -> approved)
   ✓ Invoices API Tests > PATCH /api/invoices/:id/status allows valid status change (needs_review -> rejected)
   ✓ Invoices API Tests > PATCH /api/invoices/:id/status returns 409 Conflict for invalid transition on finalized invoice
   ✓ Invoices API Tests > PATCH /api/invoices/:id/status returns 409 Conflict when setting identical status
   ✓ Invoices API Tests > PATCH /api/invoices/:id/status returns 404 for missing invoice
   ✓ Invoices API Tests > PATCH /api/invoices/:id/status returns 400 for invalid body
```

---

## 📑 Detailed Documentation

Comprehensive database schema documentation, column specifications, duplicate detection rules, and design rationale can be found in [`docs/SCHEMA.md`](docs/SCHEMA.md).

---

## ⚖️ Design Decisions & Trade-offs

1. **Monetary Values in Integer Cents (`amount_cents`):** Completely eliminates floating-point rounding errors common in financial calculations.
2. **Universal SQLite Adapter:** Dynamically bridges Node.js 22+ native `node:sqlite` and `better-sqlite3`, guaranteeing reliable zero-dependency execution across Windows, Linux, and macOS without requiring Visual Studio or C++ compilers.
3. **Database-Driven Aggregations:** Status tab counters are queried directly from SQLite `COUNT(*) GROUP BY status`, guaranteeing that refreshing the page always reflects the persistent database state.

---

## 📄 License

MIT &bull; Created for Accounts Payable Engineering Desk.
