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
      <div className="content-card glass-panel">
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
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search vendor, invoice #, or description..."
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
          Showing <strong>{filteredInvoices.length}</strong> of <strong>{invoices.length}</strong> invoices
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="content-card glass-panel">
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
                ? 'Try adjusting your search criteria or clear the filter.'
                : 'All invoices in this queue have been processed.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="content-card glass-panel">
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
                      <span className="date-cell">{formatDate(inv.invoice_date)}</span>
                    </td>
                    <td>
                      <span className="date-cell">{formatDate(inv.due_date)}</span>
                    </td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="row-action-btn">
                        <span>Inspect</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
