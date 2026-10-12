# Invoice Approval Desk

**Invoice Approval Desk** is a streamlined full-stack accounts payable application designed for reviewing incoming supplier invoices, detecting duplicate billing, and committing final approval or rejection decisions to an SQLite database. Reviewers can filter invoices by workflow state, inspect line-item details with audit metadata, view flagged duplicate alerts with direct cross-references to original submissions, and execute tamper-resistant status transitions.

---

## Tech Stack

- **Language:** TypeScript 5.7+ (`strict` mode enabled across API, shared types, and UI).
- **Backend API:** Node.js (v20+) with Express, CORS, and Zod runtime schema validation.
- **Database:** SQLite (persisted to `data/invoices.db`) using a universal adapter supporting Node 22+ built-in `node:sqlite` and `better-sqlite3` with zero external service requirements.
- **Frontend Web UI:** React 18, Vite 6, and modern accessible CSS with tab-based navigation, responsive tables, and instant feedback banners.
- **Testing:** Vitest and Supertest for automated REST endpoint and transition rule verification.
- **Monorepo Layout:** npm workspaces (`server`, `web`, `shared`).

---

## Getting Started

The project requires only **Node.js (v20+)** and **npm (v9+)**.

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
Initializes the database schema and seeds 6 realistic invoices (including exactly 1 duplicate):
```bash
npm run seed
```

### 3. Run Development Environment
Starts both the Express REST API (port `4000`) and the Vite web client (port `5173`):
```bash
npm run dev
```

- **Web Application:** [http://localhost:5173](http://localhost:5173)
- **API Base URL:** [http://localhost:4000/api](http://localhost:4000/api)
- **API Health Check:** [http://localhost:4000/api/health](http://localhost:4000/api/health)

*(Note: During development, Vite proxies `/api` requests to `http://localhost:4000` automatically).*

### 4. Run Automated Tests
```bash
npm test
```

### 5. Run Typecheck Across All Workspaces
```bash
npm run typecheck
```

---

## REST API Reference

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

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/health
```

**Response (200 OK):**
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

**Example Request:**
```bash
curl -X GET "http://localhost:4000/api/invoices?status=processing"
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 3,
      "invoice_number": "INV-2026-103",
      "vendor_name": "BuildRight Timber Supply",
      "amount_cents": 345000,
      "currency": "USD",
      "invoice_date": "2026-10-05",
      "due_date": "2026-11-04",
      "description": "Pressure-treated framing lumber 2x4 (500 units) and exterior plywood sheathing",
      "status": "processing",
      "duplicate_of_id": null,
      "review_reason": null,
      "decided_at": null,
      "created_at": "2026-10-05T11:45:00.000Z",
      "updated_at": "2026-10-05T11:45:00.000Z"
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

If the invoice is flagged as a duplicate (`duplicate_of_id`), the response includes an `original_invoice` summary object.

**Example Request:**
```bash
curl -X GET http://localhost:4000/api/invoices/4
```

**Response (200 OK):**
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

**Error Response for Missing Invoice (404 Not Found):**
```bash
curl -X GET http://localhost:4000/api/invoices/999
```
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Invoice with ID 999 not found"
  }
}
```

---

### 4. Update Invoice Status
`PATCH /api/invoices/:id/status`

**Request Body:**
```json
{
  "status": "approved", // "approved" | "rejected" | "needs_review"
  "note": "Verified delivery receipt matches contract items" // optional
}
```

**Example Request (Approve Invoice):**
```bash
curl -X PATCH http://localhost:4000/api/invoices/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "approved", "note": "Approved by AP Lead"}'
```

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "invoice_number": "INV-2026-101",
    "vendor_name": "Apex Concrete & Aggregates",
    "amount_cents": 1425000,
    "currency": "USD",
    "invoice_date": "2026-10-01",
    "due_date": "2026-10-31",
    "description": "Ready-mix batch concrete delivery for Foundation Sector B",
    "status": "approved",
    "duplicate_of_id": null,
    "review_reason": "Note: Approved by AP Lead",
    "decided_at": "2026-10-12T14:45:00.000Z",
    "created_at": "2026-10-01T08:30:00.000Z",
    "updated_at": "2026-10-12T14:45:00.000Z",
    "original_invoice": null
  }
}
```

**Error Response for Invalid Transition (409 Conflict):**
```bash
curl -X PATCH http://localhost:4000/api/invoices/5/status \
  -H "Content-Type: application/json" \
  -d '{"status": "rejected"}'
```
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Status 'approved' is final. Invoices cannot be transitioned once decided."
  }
}
```

**Error Response for Invalid Body (400 Bad Request):**
```bash
curl -X PATCH http://localhost:4000/api/invoices/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "invalid_status"}'
```
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Target status must be one of: 'approved', 'rejected', or 'needs_review'"
  }
}
```

---

## Project Structure Overview

```
├── docs/
│   └── SCHEMA.md               # Data model, status lifecycles, and architecture writeup
├── data/
│   └── invoices.db             # Persisted SQLite database file (created on seed/start)
├── shared/                     # Shared TypeScript contracts & domain rules
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts            # DTOs, status enums, transition validation logic
├── server/                     # Backend Express REST API
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── app.ts              # Express application factory & middleware configuration
│   │   ├── index.ts            # Server entrypoint & port binding
│   │   ├── db/
│   │   │   ├── connection.ts   # SQLite connection manager & schema initializer
│   │   │   ├── sqliteAdapter.ts# Universal adapter (node:sqlite / better-sqlite3)
│   │   │   ├── invoicesRepository.ts # Data access layer (DAL)
│   │   │   └── seed.ts         # Idempotent database seeder (6 sample records)
│   │   ├── middleware/
│   │   │   └── errorHandler.ts # Uniform JSON error formatter
│   │   ├── routes/
│   │   │   ├── health.ts       # GET /api/health endpoint
│   │   │   └── invoices.ts     # Invoices REST endpoints
│   │   ├── services/
│   │   │   └── invoicesService.ts # Status transition enforcement & business rules
│   │   └── validators/
│   │       └── invoiceValidators.ts # Zod request schemas
│   └── tests/
│       └── invoices.test.ts    # Vitest automated test suite (13 passing tests)
├── web/                        # React + Vite frontend SPA
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts          # Dev server and /api proxy configuration
│   ├── index.html              # HTML shell
│   └── src/
│       ├── main.tsx            # React root mount
│       ├── App.tsx             # State coordinator for tabs and views
│       ├── index.css           # Clean, accessible styling
│       ├── api/
│       │   └── client.ts       # Typed fetch client with error normalization
│       └── components/
│           ├── Tabs.tsx        # Processing, Needs review, Decided tabs with counts
│           ├── InvoiceList.tsx # Table display with formatted currency and badges
│           ├── InvoiceDetail.tsx # Detailed view, duplicate warning, Approve/Reject
│           └── StatusBadge.tsx # Accessible color-coded badge tags
├── package.json                # Root package with monorepo scripts
├── tsconfig.json
└── README.md                   # Project documentation
```

---

## Documentation Link

Detailed documentation of table columns, status lifecycle diagrams, transition rules, duplicate detection mechanisms, and design decisions is available in [`docs/SCHEMA.md`](docs/SCHEMA.md).

---

## Assumptions, Trade-offs & Future Improvements

### Assumptions & Trade-offs
1. **Single-File SQLite:** Chosen for zero-setup execution without external database engines. The custom `sqliteAdapter` bridges Node.js 22+ built-in `node:sqlite` and `better-sqlite3`, ensuring seamless compatibility regardless of whether native C++ compiler tools are present on the host OS.
2. **Deterministic Duplicate Rule:** For the seed dataset, duplicate matching compares `(vendor_name, invoice_number)` and identical `(vendor_name, amount_cents, invoice_date)`. In enterprise production, OCR noise often requires fuzzy string matching and Levenshtein distance heuristics on vendor names.
3. **Tab Preserved Navigation:** When drilling down into an invoice and clicking "Back to Invoices", the active tab state (`Processing`, `Needs review`, or `Approved / Rejected`) is preserved for continuous reviewer throughput.

### What Could Be Improved with More Time
- **Pagination & Sorting:** For enterprise invoice volumes (>10,000 invoices), add cursor-based pagination and column sorting by due date or amount.
- **Audit History Log:** Introduce an `invoice_audit_logs` table tracking every status change timestamp, user identity, and notes.
- **File Attachment Previews:** Integrate PDF viewer or side-by-side OCR image preview to compare line items directly against original documents.
- **Role-Based Permissions:** Implement authentication with separate reviewer vs. finance manager approval tier thresholds (e.g. invoices > $10,000 requiring dual approval).
