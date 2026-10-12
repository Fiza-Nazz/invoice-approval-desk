import type {
  InvoiceListResponse,
  InvoiceStatus,
  InvoiceWithOriginal,
} from '@invoice-desk/shared';
import { validateStatusTransition } from '@invoice-desk/shared';
import { InvoicesRepository } from '../db/invoicesRepository.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Invoice not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class InvoicesService {
  private repo: InvoicesRepository;

  constructor(repo?: InvoicesRepository) {
    this.repo = repo || new InvoicesRepository();
  }

  getInvoices(statuses?: InvoiceStatus[]): InvoiceListResponse {
    const data = this.repo.list(statuses);
    const counts = this.repo.getCounts();
    return { data, counts };
  }

  getInvoiceById(id: number): InvoiceWithOriginal {
    const invoice = this.repo.findById(id);
    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  updateInvoiceStatus(
    id: number,
    targetStatus: InvoiceStatus,
    note?: string
  ): InvoiceWithOriginal {
    const existing = this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError(`Invoice with ID ${id} not found`);
    }

    const validation = validateStatusTransition(existing.status, targetStatus);
    if (!validation.allowed) {
      throw new ConflictError(validation.message || 'Invalid status transition');
    }

    const updated = this.repo.updateStatus(id, targetStatus, note);
    if (!updated) {
      throw new NotFoundError(`Invoice with ID ${id} not found`);
    }

    return updated;
  }
}
