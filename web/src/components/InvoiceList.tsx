import React, { useState, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase().trim();
    return invoices.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.vendor_name.toLowerCase().includes(q) ||
        inv.description.toLowerCase().includes(q)
    );
  }, [invoices, searchQuery]);

  if (isLoading) {
    return (
      <div className="content-card">
        <div className="empty-state">
          <div className="spinner-glow" />
          <p className="loading-text">Loading invoices from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="list-wrapper">
      <div className="list-toolbar">
        <div className="search-box">
          <svg
            className="search-icon"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by vendor, invoice number, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>
        <div className="list-meta-count">
          Showing <strong>{filteredInvoices.length}</strong> of <strong>{invoices.length}</strong> records
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="content-card">
          <div className="empty-state">
            <svg
              className="empty-icon"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 9h6" />
              <path d="M9 13h6" />
              <path d="M9 17h4" />
            </svg>
            <p className="empty-title">
              {searchQuery ? 'No matching invoices found' : 'No invoices in this queue'}
            </p>
            <p className="empty-subtitle">
              {searchQuery
                ? 'Try adjusting your search criteria or clear the search field.'
                : 'All invoices in this queue have been processed.'}
            </p>
          </div>
        </div>
      ) : (
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
                  <th scope="col" style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
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
                    className="invoice-row"
                    aria-label={`View invoice ${inv.invoice_number} from ${inv.vendor_name}`}
                  >
                    <td>
                      <div className="invoice-number-wrapper">
                        <span className="invoice-number-cell">{inv.invoice_number}</span>
                        {inv.duplicate_of_id && (
                          <span className="mini-dup-badge" title="Flagged as potential duplicate">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 9v4" />
                              <path d="M12 17h.01" />
                              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            </svg>
                            Dup
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="vendor-cell-wrapper">
                        <span className="vendor-cell">{inv.vendor_name}</span>
                        <span className="description-snippet">{inv.description}</span>
                      </div>
                    </td>
                    <td className="amount-cell">
                      <span className="amount-pill">
                        {formatCurrency(inv.amount_cents, inv.currency)}
                      </span>
                    </td>
                    <td>
                      <div className="date-cell">
                        <svg className="date-icon-calendar" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>{formatDate(inv.invoice_date)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <svg className="date-icon-clock" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{formatDate(inv.due_date)}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="row-action-btn">
                        <span>Review</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
