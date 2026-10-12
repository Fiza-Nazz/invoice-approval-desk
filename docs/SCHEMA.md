# Data Model & Status Architecture

This document describes the schema design, status lifecycle, duplicate detection rules, and core architectural decisions for **Invoice Approval Desk**.

---

## 1. The `invoices` Table

The database schema is defined in SQLite with the following structure:

| Column | Type | Constraints | Description & Purpose |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier for each invoice. |
| `invoice_number` | `TEXT` | `NOT NULL` | External reference number issued by the vendor (e.g. `INV-2026-101`). |
| `vendor_name` | `TEXT` | `NOT NULL` | Legal or operating name of the supplier/contractor. |
| `amount_cents` | `INTEGER` | `NOT NULL` | Total invoice payable stored as integer cents to avoid floating-point errors. |
| `currency` | `TEXT` | `NOT NULL` | 3-letter ISO currency code (e.g. `USD`). |
| `invoice_date` | `TEXT` | `NOT NULL` | Billing date in ISO-8601 format (`YYYY-MM-DD`). |
| `due_date` | `TEXT` | `NOT NULL` | Payment due date in ISO-8601 format (`YYYY-MM-DD`). |
| `description` | `TEXT` | `NOT NULL` | Itemized summary or narrative of billable services/goods. |
| `status` | `TEXT` | `NOT NULL CHECK(...)` | Workflow status (`processing`, `needs_review`, `approved`, `rejected`). |
| `duplicate_of_id` | `INTEGER` | `NULL REFERENCES invoices(id)` | Foreign key referencing the primary invoice if flagged as duplicate. |
| `review_reason` | `TEXT` | `NULL` | Explanation of why human review is required or decision rationale. |
| `decided_at` | `TEXT` | `NULL` | ISO timestamp recorded when an invoice is transitioned to a terminal status. |
| `created_at` | `TEXT` | `NOT NULL` | Timestamp when the invoice record was created. |
| `updated_at` | `TEXT` | `NOT NULL` | Timestamp of the most recent modification. |

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_invoices_duplicate_lookup
  ON invoices (vendor_name, invoice_number, amount_cents);

CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON invoices (status);
```

- **`idx_invoices_duplicate_lookup`**: Optimizes ingestion and verification queries when scanning for identical vendor submissions and duplicate amounts.
- **`idx_invoices_status`**: Optimizes tab filtering and status count aggregation queries.

---

## 2. Status Definitions

The system defines exactly four status states:

- **`processing`**: Newly received invoice waiting for initial automated checks and review.
- **`needs_review`**: Flagged invoice requiring human inspection (e.g., suspected duplicate or rate discrepancy).
- **`approved`**: Reviewer confirmed and authorized the invoice for payment release.
- **`rejected`**: Reviewer declined the invoice due to discrepancies, duplicate submission, or billing disputes.

---

## 3. Allowed Status Transitions

Terminal states (`approved` and `rejected`) are immutable. Attempting an invalid or repeated transition returns HTTP `409 Conflict`.

### State Transition Diagram

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

### Transition Table

| Current Status | Target: `processing` | Target: `needs_review` | Target: `approved` | Target: `rejected` |
|---|:---:|:---:|:---:|:---:|
| **`processing`** | ❌ 409 (Identical) | ✅ Allowed | ✅ Allowed (sets `decided_at`) | ✅ Allowed (sets `decided_at`) |
| **`needs_review`** | ❌ 409 (Disallowed) | ❌ 409 (Identical) | ✅ Allowed (sets `decided_at`) | ✅ Allowed (sets `decided_at`) |
| **`approved`** | ❌ 409 (Final) | ❌ 409 (Final) | ❌ 409 (Identical/Final) | ❌ 409 (Final) |
| **`rejected`** | ❌ 409 (Final) | ❌ 409 (Final) | ❌ 409 (Final) | ❌ 409 (Identical/Final) |

---

## 4. Duplicate Detection & Flagging

1. **Rule**: An invoice is identified as a duplicate candidate if another existing invoice shares:
   - Same `vendor_name` AND same `invoice_number`, OR
   - Same `vendor_name`, same `amount_cents`, and identical `invoice_date`.
2. **Where It Runs**: During ingestion / import (and simulated in seed data). The detection engine links the candidate record via `duplicate_of_id`, assigns `status: 'needs_review'`, and records the audit reason in `review_reason`.
3. **Reviewer Visibility**: The API returns `original_invoice` details alongside the duplicate, and the Web UI renders an explicit warning banner with a one-click link to compare against the original invoice.

---

## 5. Architectural & Design Decisions

- **Money Stored in Integer Cents**: Currency amounts are strictly integers (`amount_cents`), avoiding IEEE 754 floating-point rounding inaccuracies in financial calculations.
- **Single-File SQLite with Dual Driver Fallback**: Uses SQLite (`data/invoices.db`) for zero setup. An abstraction layer transparently utilizes Node 22+ built-in `node:sqlite` or `better-sqlite3`, eliminating native C++ build tool dependencies across operating systems.
- **Immutable Terminal States**: Approved and rejected invoices are permanent audit records. Any request attempting to alter a finalized invoice results in an explicit HTTP `409 Conflict`.
- **Shared Type Safety Across Monorepo**: Shared TypeScript domain contracts (`@invoice-desk/shared`) ensure frontend and backend schemas remain in sync at compile time.
- **Database-Backed Aggregations**: Status counts are computed via SQLite `COUNT(*) GROUP BY status`, ensuring UI tab badges always match persistent database state across page refreshes.
