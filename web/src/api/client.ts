import type {
  InvoiceListResponse,
  InvoiceDetailResponse,
  UpdateStatusRequest,
  ApiErrorResponse,
} from '@invoice-desk/shared';

export class ApiError extends Error {
  public code: string;
  public status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!res.ok) {
    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = `HTTP error ${res.status}: ${res.statusText}`;

    if (isJson) {
      try {
        const errorData = (await res.json()) as ApiErrorResponse;
        if (errorData?.error) {
          errorCode = errorData.error.code || errorCode;
          errorMessage = errorData.error.message || errorMessage;
        }
      } catch {
        // Fallback to default message
      }
    }

    throw new ApiError(res.status, errorCode, errorMessage);
  }

  if (isJson) {
    return (await res.json()) as T;
  }

  return {} as T;
}

export async function getInvoices(statusFilter?: string): Promise<InvoiceListResponse> {
  const url = statusFilter
    ? `/api/invoices?status=${encodeURIComponent(statusFilter)}`
    : '/api/invoices';
  const res = await fetch(url);
  return handleResponse<InvoiceListResponse>(res);
}

export async function getInvoice(id: number): Promise<InvoiceDetailResponse> {
  const res = await fetch(`/api/invoices/${id}`);
  return handleResponse<InvoiceDetailResponse>(res);
}

export async function updateInvoiceStatus(
  id: number,
  payload: UpdateStatusRequest
): Promise<InvoiceDetailResponse> {
  const res = await fetch(`/api/invoices/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<InvoiceDetailResponse>(res);
}
