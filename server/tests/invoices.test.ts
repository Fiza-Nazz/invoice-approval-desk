import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initSchema } from '../src/db/connection.js';
import { openSqliteDatabase, type DatabaseAdapter } from '../src/db/sqliteAdapter.js';
import { InvoicesRepository } from '../src/db/invoicesRepository.js';
import { InvoicesService } from '../src/services/invoicesService.js';

describe('Invoices API Tests', () => {
  let app: ReturnType<typeof createApp>;
  let db: DatabaseAdapter;
  let repo: InvoicesRepository;

  beforeEach(() => {
    // Create an isolated in-memory database for each test run
    db = openSqliteDatabase(':memory:');
    initSchema(db);
    repo = new InvoicesRepository(db);

    // Seed test data using repository
    repo.insert({
      id: 1,
      invoice_number: 'INV-2026-101',
      vendor_name: 'Apex Concrete & Aggregates',
      amount_cents: 1425000,
      currency: 'USD',
      invoice_date: '2026-10-01',
      due_date: '2026-10-31',
      description: 'Ready-mix batch concrete delivery for Foundation Sector B',
      status: 'processing',
      duplicate_of_id: null,
      review_reason: null,
      decided_at: null,
      created_at: '2026-10-01T08:30:00.000Z',
    });

    repo.insert({
      id: 2,
      invoice_number: 'INV-2026-102',
      vendor_name: 'Titan Steel Fabricators',
      amount_cents: 890000,
      currency: 'USD',
      invoice_date: '2026-10-03',
      due_date: '2026-11-02',
      description: 'Structural steel I-beams',
      status: 'processing',
      duplicate_of_id: null,
      review_reason: null,
      decided_at: null,
      created_at: '2026-10-03T09:15:00.000Z',
    });

    repo.insert({
      id: 3,
      invoice_number: 'INV-2026-103',
      vendor_name: 'BuildRight Timber Supply',
      amount_cents: 345000,
      currency: 'USD',
      invoice_date: '2026-10-05',
      due_date: '2026-11-04',
      description: 'Framing lumber 2x4',
      status: 'processing',
      duplicate_of_id: null,
      review_reason: null,
      decided_at: null,
      created_at: '2026-10-05T11:45:00.000Z',
    });

    repo.insert({
      id: 4,
      invoice_number: 'INV-2026-101',
      vendor_name: 'Apex Concrete & Aggregates',
      amount_cents: 1425000,
      currency: 'USD',
      invoice_date: '2026-10-01',
      due_date: '2026-10-31',
      description: 'Duplicate submission: Ready-mix batch concrete delivery',
      status: 'needs_review',
      duplicate_of_id: 1,
      review_reason: 'Suspected duplicate of INV-2026-101',
      decided_at: null,
      created_at: '2026-10-06T14:20:00.000Z',
    });

    repo.insert({
      id: 5,
      invoice_number: 'INV-2026-095',
      vendor_name: 'Metro Electrical Wholesale',
      amount_cents: 512000,
      currency: 'USD',
      invoice_date: '2026-09-25',
      due_date: '2026-10-25',
      description: 'Commercial 3-phase switchboard conduits',
      status: 'approved',
      duplicate_of_id: null,
      review_reason: null,
      decided_at: '2026-09-28T16:00:00.000Z',
      created_at: '2026-09-25T10:00:00.000Z',
    });

    repo.insert({
      id: 6,
      invoice_number: 'INV-2026-098',
      vendor_name: 'Vanguard Heavy Equipment Rental',
      amount_cents: 780000,
      currency: 'USD',
      invoice_date: '2026-09-28',
      due_date: '2026-10-28',
      description: 'Hydraulic excavator 14-day rental',
      status: 'rejected',
      duplicate_of_id: null,
      review_reason: 'Rate disputed',
      decided_at: '2026-09-30T13:45:00.000Z',
      created_at: '2026-09-28T09:00:00.000Z',
    });

    const service = new InvoicesService(repo);
    app = createApp(service);
  });

  it('GET /api/health should return ok: true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('GET /api/invoices should list all invoices with counts', async () => {
    const res = await request(app).get('/api/invoices');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(6);
    expect(res.body.counts).toEqual({
      processing: 3,
      needs_review: 1,
      approved: 1,
      rejected: 1,
      total: 6,
    });
  });

  it('GET /api/invoices?status=processing should filter by status', async () => {
    const res = await request(app).get('/api/invoices?status=processing');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
    for (const inv of res.body.data) {
      expect(inv.status).toBe('processing');
    }
    // Counts should still reflect full system counts
    expect(res.body.counts.total).toBe(6);
  });

  it('GET /api/invoices?status=approved,rejected should support comma-separated filters', async () => {
    const res = await request(app).get('/api/invoices?status=approved,rejected');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const statuses = res.body.data.map((inv: { status: string }) => inv.status);
    expect(statuses).toContain('approved');
    expect(statuses).toContain('rejected');
  });

  it('GET /api/invoices/:id returns single invoice with all fields', async () => {
    const res = await request(app).get('/api/invoices/1');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: 1,
      invoice_number: 'INV-2026-101',
      vendor_name: 'Apex Concrete & Aggregates',
      amount_cents: 1425000,
      currency: 'USD',
      status: 'processing',
    });
    expect(res.body.data.original_invoice).toBeNull();
  });

  it('GET /api/invoices/:id includes original invoice summary when duplicate_of_id is present', async () => {
    const res = await request(app).get('/api/invoices/4');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(4);
    expect(res.body.data.duplicate_of_id).toBe(1);
    expect(res.body.data.original_invoice).toEqual({
      id: 1,
      invoice_number: 'INV-2026-101',
      vendor_name: 'Apex Concrete & Aggregates',
      amount_cents: 1425000,
      currency: 'USD',
      status: 'processing',
    });
  });

  it('GET /api/invoices/:id returns 404 for missing invoice', async () => {
    const res = await request(app).get('/api/invoices/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('PATCH /api/invoices/:id/status allows valid status change (processing -> approved)', async () => {
    const res = await request(app)
      .patch('/api/invoices/1/status')
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.decided_at).not.toBeNull();
  });

  it('PATCH /api/invoices/:id/status allows valid status change (needs_review -> rejected)', async () => {
    const res = await request(app)
      .patch('/api/invoices/4/status')
      .send({ status: 'rejected', note: 'Confirmed duplicate, rejected' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('rejected');
    expect(res.body.data.decided_at).not.toBeNull();
  });

  it('PATCH /api/invoices/:id/status returns 409 Conflict for invalid transition on finalized invoice', async () => {
    // Invoice 5 is already approved
    const res = await request(app)
      .patch('/api/invoices/5/status')
      .send({ status: 'rejected' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
    expect(res.body.error.message).toContain('final');
  });

  it('PATCH /api/invoices/:id/status returns 409 Conflict when setting identical status', async () => {
    const res = await request(app)
      .patch('/api/invoices/1/status')
      .send({ status: 'needs_review' });
    expect(res.status).toBe(200);

    // Try setting needs_review again
    const repeatRes = await request(app)
      .patch('/api/invoices/1/status')
      .send({ status: 'needs_review' });

    expect(repeatRes.status).toBe(409);
    expect(repeatRes.body.error.code).toBe('CONFLICT');
  });

  it('PATCH /api/invoices/:id/status returns 404 for missing invoice', async () => {
    const res = await request(app)
      .patch('/api/invoices/999/status')
      .send({ status: 'approved' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('PATCH /api/invoices/:id/status returns 400 for invalid body', async () => {
    const res = await request(app)
      .patch('/api/invoices/1/status')
      .send({ status: 'unknown_status' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
