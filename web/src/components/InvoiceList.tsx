import React from 'react';
import type { Invoice } from '@invoice-desk/shared';
import { StatusBadge } from './StatusBadge.js';

interface InvoiceListProps {
  invoices: Invoice[];
  onSelectInvoice: (invoiceId: number) => void;
  isLoading: boolean;
}

export function formatCurrency(amountCents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amountCents / 100);
}

export function formatDate(isoDateString: string): string {
  if (!isoDateString) return '-';
  try {
    const [year, month, day] = isoDateString.split('-');
    if (year && month && day) {
      return `${month}/${day}/${year}`;
    }
    return new Date(isoDateString).toLocaleDateString();
  } catch {
    return isoDateString;
  }
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onSelectInvoice,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="content-card">
        <div className="empty-state">
          <div className="spinner" style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
          <p style={{ marginTop: '0.75rem' }}>Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="content-card">
        <div className="empty-state">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 9h6" />
            <path d="M9 13h6" />
            <path d="M9 17h4" />
          </svg>
          <p>No invoices found in this view.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-card">
      <div className="table-responsive">
        <table className="invoice-table" aria-label="Invoices list">
          <thead>
            <tr>
              <th scope="col">Invoice #</th>
              <th scope="col">Vendor</th>
              <th scope="col">Amount</th>
              <th scope="col">Invoice Date</th>
              <th scope="col">Due Date</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                onClick={() => onSelectInvoice(inv.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectInvoice(inv.id);
                  }
                }}
                role="button"
                aria-label={`View invoice ${inv.invoice_number} from ${inv.vendor_name}`}
              >
                <td className="invoice-number-cell">{inv.invoice_number}</td>
                <td className="vendor-cell">{inv.vendor_name}</td>
                <td className="amount-cell">
                  {formatCurrency(inv.amount_cents, inv.currency)}
                </td>
                <td>{formatDate(inv.invoice_date)}</td>
                <td>{formatDate(inv.due_date)}</td>
                <td>
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
