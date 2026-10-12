import type {
  Invoice,
  InvoiceStatus,
  InvoiceWithOriginal,
  OriginalInvoiceSummary,
  StatusCounts,
} from '@invoice-desk/shared';
import type { DatabaseAdapter } from './sqliteAdapter.js';
import { getDb } from './connection.js';

export class InvoicesRepository {
  private db: DatabaseAdapter;

  constructor(customDb?: DatabaseAdapter) {
    this.db = customDb || getDb();
  }

  /**
   * Retrieves invoices optionally filtered by an array of statuses.
   * Invoices are sorted newest first.
   */
  list(statuses?: InvoiceStatus[]): Invoice[] {
    if (!statuses || statuses.length === 0) {
      const stmt = this.db.prepare(`
        SELECT * FROM invoices
        ORDER BY created_at DESC, id DESC
      `);
      return stmt.all() as Invoice[];
    }

    const placeholders = statuses.map(() => '?').join(', ');
    const stmt = this.db.prepare(`
      SELECT * FROM invoices
      WHERE status IN (${placeholders})
      ORDER BY created_at DESC, id DESC
    `);
    return stmt.all(...statuses) as Invoice[];
  }

  /**
   * Returns invoice count breakdown across all four statuses.
   */
  getCounts(): StatusCounts {
    const stmt = this.db.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM invoices
      GROUP BY status
    `);
    const rows = stmt.all() as Array<{ status: InvoiceStatus; count: number }>;

    const counts: StatusCounts = {
      processing: 0,
      needs_review: 0,
      approved: 0,
      rejected: 0,
      total: 0,
    };

    for (const row of rows) {
      if (row.status in counts) {
        counts[row.status] = row.count;
      }
      counts.total += row.count;
    }

    return counts;
  }

  /**
   * Retrieves a single invoice by its ID.
   * If it is flagged as a duplicate, also fetches a summary of the original invoice.
   */
  findById(id: number): InvoiceWithOriginal | null {
    const stmt = this.db.prepare(`
      SELECT * FROM invoices
      WHERE id = ?
    `);
    const invoice = stmt.get(id) as Invoice | undefined;

    if (!invoice) {
      return null;
    }

    let originalInvoice: OriginalInvoiceSummary | null = null;
    if (invoice.duplicate_of_id) {
      const origStmt = this.db.prepare(`
        SELECT id, invoice_number, vendor_name, amount_cents, currency, status
        FROM invoices
        WHERE id = ?
      `);
      const original = origStmt.get(invoice.duplicate_of_id) as OriginalInvoiceSummary | undefined;
      originalInvoice = original ?? null;
    }

    return {
      ...invoice,
      original_invoice: originalInvoice,
    };
  }

  /**
   * Updates an invoice's status and timestamp.
   */
  updateStatus(
    id: number,
    newStatus: InvoiceStatus,
    note?: string
  ): InvoiceWithOriginal | null {
    const now = new Date().toISOString();
    const decidedAt = newStatus === 'approved' || newStatus === 'rejected' ? now : null;

    let updateReasonSql = '';
    const params: unknown[] = [newStatus, decidedAt, now];

    if (note && note.trim().length > 0) {
      updateReasonSql = `, review_reason = CASE
        WHEN review_reason IS NULL OR review_reason = '' THEN ?
        ELSE review_reason || ' | Note: ' || ?
      END`;
      params.push(note.trim(), note.trim());
    }

    params.push(id);

    const stmt = this.db.prepare(`
      UPDATE invoices
      SET
        status = ?,
        decided_at = ?,
        updated_at = ?
        ${updateReasonSql}
      WHERE id = ?
    `);

    stmt.run(...params);

    return this.findById(id);
  }

  /**
   * Clears the table and resets autoincrement sequence.
   */
  clear(): void {
    this.db.exec(`
      DELETE FROM invoices;
      DELETE FROM sqlite_sequence WHERE name = 'invoices';
    `);
  }

  /**
   * Inserts an invoice record.
   */
  insert(invoice: {
    id?: number;
    invoice_number: string;
    vendor_name: string;
    amount_cents: number;
    currency: string;
    invoice_date: string;
    due_date: string;
    description: string;
    status: InvoiceStatus;
    duplicate_of_id?: number | null;
    review_reason?: string | null;
    decided_at?: string | null;
    created_at?: string;
    updated_at?: string;
  }): number {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO invoices (
        ${invoice.id ? 'id,' : ''}
        invoice_number,
        vendor_name,
        amount_cents,
        currency,
        invoice_date,
        due_date,
        description,
        status,
        duplicate_of_id,
        review_reason,
        decided_at,
        created_at,
        updated_at
      ) VALUES (
        ${invoice.id ? '?, ' : ''}
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    const values: unknown[] = [];
    if (invoice.id) {
      values.push(invoice.id);
    }
    values.push(
      invoice.invoice_number,
      invoice.vendor_name,
      invoice.amount_cents,
      invoice.currency,
      invoice.invoice_date,
      invoice.due_date,
      invoice.description,
      invoice.status,
      invoice.duplicate_of_id ?? null,
      invoice.review_reason ?? null,
      invoice.decided_at ?? null,
      invoice.created_at || now,
      invoice.updated_at || now
    );

    const result = stmt.run(...values);
    return Number(result.lastInsertRowid);
  }
}
