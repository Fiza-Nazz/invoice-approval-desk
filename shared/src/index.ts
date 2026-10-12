export type InvoiceStatus = 'processing' | 'needs_review' | 'approved' | 'rejected';

export const INVOICE_STATUSES: readonly InvoiceStatus[] = [
  'processing',
  'needs_review',
  'approved',
  'rejected',
] as const;

export interface Invoice {
  id: number;
  invoice_number: string;
  vendor_name: string;
  amount_cents: number;
  currency: string;
  invoice_date: string;
  due_date: string;
  description: string;
  status: InvoiceStatus;
  duplicate_of_id: number | null;
  review_reason: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OriginalInvoiceSummary {
  id: number;
  invoice_number: string;
  vendor_name: string;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
}

export interface InvoiceWithOriginal extends Invoice {
  original_invoice?: OriginalInvoiceSummary | null;
}

export interface StatusCounts {
  processing: number;
  needs_review: number;
  approved: number;
  rejected: number;
  total: number;
}

export interface InvoiceListResponse {
  data: Invoice[];
  counts: StatusCounts;
}

export interface InvoiceDetailResponse {
  data: InvoiceWithOriginal;
}

export interface UpdateStatusRequest {
  status: 'approved' | 'rejected' | 'needs_review';
  note?: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

export interface TransitionValidationResult {
  allowed: boolean;
  message?: string;
}

export const ALLOWED_TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  processing: ['needs_review', 'approved', 'rejected'],
  needs_review: ['approved', 'rejected'],
  approved: [],
  rejected: [],
};

/**
 * Validates whether an invoice can transition from one status to another.
 * Returns { allowed: true } or { allowed: false, message: string }.
 */
export function validateStatusTransition(
  currentStatus: InvoiceStatus,
  targetStatus: InvoiceStatus
): TransitionValidationResult {
  if (currentStatus === targetStatus) {
    return {
      allowed: false,
      message: `Invoice is already in status '${currentStatus}'. Cannot set identical status.`,
    };
  }

  if (currentStatus === 'approved' || currentStatus === 'rejected') {
    return {
      allowed: false,
      message: `Status '${currentStatus}' is final. Invoices cannot be transitioned once decided.`,
    };
  }

  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedTargets.includes(targetStatus)) {
    return {
      allowed: false,
      message: `Invalid transition: '${currentStatus}' cannot be changed to '${targetStatus}'.`,
    };
  }

  return { allowed: true };
}
