import { getDb, createDatabaseConnection } from './connection.js';
import { InvoicesRepository } from './invoicesRepository.js';

export function runSeed(customDbPath?: string): void {
  const db = customDbPath ? createDatabaseConnection(customDbPath) : getDb();
  const repo = new InvoicesRepository(db);

  console.log('Resetting invoices table...');
  repo.clear();

  console.log('Seeding 6 realistic invoices (with exactly 1 duplicate)...');

  // 1. Processing invoice 1 (The original invoice)
  const origId = repo.insert({
    id: 1,
    invoice_number: 'INV-2026-101',
    vendor_name: 'Apex Concrete & Aggregates',
    amount_cents: 1425000, // $14,250.00
    currency: 'USD',
    invoice_date: '2026-10-01',
    due_date: '2026-10-31',
    description: 'Ready-mix batch concrete delivery for Foundation Sector B (60 cubic yards)',
    status: 'processing',
    duplicate_of_id: null,
    review_reason: null,
    decided_at: null,
    created_at: '2026-10-01T08:30:00.000Z',
    updated_at: '2026-10-01T08:30:00.000Z',
  });

  // 2. Processing invoice 2
  repo.insert({
    id: 2,
    invoice_number: 'INV-2026-102',
    vendor_name: 'Titan Steel Fabricators',
    amount_cents: 890000, // $8,900.00
    currency: 'USD',
    invoice_date: '2026-10-03',
    due_date: '2026-11-02',
    description: 'Structural steel I-beams (W12x26) and 20mm rebar bundles for column cages',
    status: 'processing',
    duplicate_of_id: null,
    review_reason: null,
    decided_at: null,
    created_at: '2026-10-03T09:15:00.000Z',
    updated_at: '2026-10-03T09:15:00.000Z',
  });

  // 3. Processing invoice 3
  repo.insert({
    id: 3,
    invoice_number: 'INV-2026-103',
    vendor_name: 'BuildRight Timber Supply',
    amount_cents: 345000, // $3,450.00
    currency: 'USD',
    invoice_date: '2026-10-05',
    due_date: '2026-11-04',
    description: 'Pressure-treated framing lumber 2x4 (500 units) and exterior plywood sheathing',
    status: 'processing',
    duplicate_of_id: null,
    review_reason: null,
    decided_at: null,
    created_at: '2026-10-05T11:45:00.000Z',
    updated_at: '2026-10-05T11:45:00.000Z',
  });

  // 4. Needs Review (DUPLICATE of Invoice 1)
  repo.insert({
    id: 4,
    invoice_number: 'INV-2026-101',
    vendor_name: 'Apex Concrete & Aggregates',
    amount_cents: 1425000, // $14,250.00
    currency: 'USD',
    invoice_date: '2026-10-01',
    due_date: '2026-10-31',
    description: 'Duplicate submission: Ready-mix batch concrete delivery for Foundation Sector B',
    status: 'needs_review',
    duplicate_of_id: origId,
    review_reason: 'Possible duplicate of INV-1001 (Same vendor, invoice number, and identical amount $14,250.00)',
    decided_at: null,
    created_at: '2026-10-06T14:20:00.000Z',
    updated_at: '2026-10-06T14:20:00.000Z',
  });

  // 5. Approved invoice
  repo.insert({
    id: 5,
    invoice_number: 'INV-2026-095',
    vendor_name: 'Metro Electrical Wholesale',
    amount_cents: 512000, // $5,120.00
    currency: 'USD',
    invoice_date: '2026-09-25',
    due_date: '2026-10-25',
    description: 'Commercial 3-phase switchboard conduits, copper cabling, and breakers',
    status: 'approved',
    duplicate_of_id: null,
    review_reason: null,
    decided_at: '2026-09-28T16:00:00.000Z',
    created_at: '2026-09-25T10:00:00.000Z',
    updated_at: '2026-09-28T16:00:00.000Z',
  });

  // 6. Rejected invoice
  repo.insert({
    id: 6,
    invoice_number: 'INV-2026-098',
    vendor_name: 'Vanguard Heavy Equipment Rental',
    amount_cents: 780000, // $7,800.00
    currency: 'USD',
    invoice_date: '2026-09-28',
    due_date: '2026-10-28',
    description: 'Hydraulic excavator 14-day rental (Disputed rate: contract specified $6,500)',
    status: 'rejected',
    duplicate_of_id: null,
    review_reason: 'Disputed rate above contracted master agreement rate',
    decided_at: '2026-09-30T13:45:00.000Z',
    created_at: '2026-09-28T09:00:00.000Z',
    updated_at: '2026-09-30T13:45:00.000Z',
  });

  const counts = repo.getCounts();
  console.log('Seeding completed successfully!');
  console.log('Current invoice counts:', counts);
}

// If executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  runSeed();
}
