import React, { useState } from 'react';
import type { InvoiceWithOriginal, InvoiceStatus } from '@invoice-desk/shared';
import { StatusBadge } from './StatusBadge.js';
import { formatCurrency, formatDate } from './InvoiceList.js';
import { updateInvoiceStatus, ApiError } from '../api/client.js';

interface InvoiceDetailProps {
  invoice: InvoiceWithOriginal;
  onBack: () => void;
  onInvoiceUpdated: (updatedInvoice: InvoiceWithOriginal) => void;
  onSelectInvoice: (id: number) => void;
}

export const InvoiceDetail: React.FC<InvoiceDetailProps> = ({
  invoice,
  onBack,
  onInvoiceUpdated,
  onSelectInvoice,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const isFinalStatus = invoice.status === 'approved' || invoice.status === 'rejected';

  const handleAction = async (targetStatus: InvoiceStatus) => {
    if (isSubmitting || isFinalStatus) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const response = await updateInvoiceStatus(invoice.id, {
        status: targetStatus as 'approved' | 'rejected' | 'needs_review',
      });
      setFeedback({
        type: 'success',
        message: `Invoice successfully marked as ${targetStatus}!`,
      });
      onInvoiceUpdated(response.data);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setFeedback({
          type: 'error',
          message:
            err.message ||
            'Status conflict: This invoice is already finalized or cannot transition to the selected status.',
        });
      } else if (err instanceof Error) {
        setFeedback({
          type: 'error',
          message: err.message || 'An error occurred while updating the invoice.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'An unexpected error occurred.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="detail-view">
      <div className="detail-nav">
        <button type="button" className="btn-back" onClick={onBack} aria-label="Back to invoices list">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>Back to Invoices</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`feedback-banner feedback-${feedback.type}`}
          role="alert"
          aria-live="polite"
        >
          {feedback.type === 'success' ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Duplicate Warning Callout */}
      {invoice.duplicate_of_id && (
        <div className="callout-warning" role="region" aria-label="Duplicate invoice alert">
          <div className="callout-warning-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="callout-warning-title">Suspected Duplicate Flagged</div>
            <div className="callout-warning-body">
              {invoice.review_reason || 'This invoice has been flagged as a potential duplicate.'}
            </div>

            {invoice.original_invoice ? (
              <div className="original-invoice-box">
                <div>
                  <strong>Original:</strong> {invoice.original_invoice.invoice_number} ({invoice.original_invoice.vendor_name}) &mdash;{' '}
                  {formatCurrency(invoice.original_invoice.amount_cents, invoice.original_invoice.currency)}
                  <span style={{ marginLeft: '0.6rem' }}>
                    <StatusBadge status={invoice.original_invoice.status} />
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => onSelectInvoice(invoice.original_invoice!.id)}
                >
                  View Original Invoice &rarr;
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-link"
                onClick={() => onSelectInvoice(invoice.duplicate_of_id!)}
              >
                View Original Invoice (ID #{invoice.duplicate_of_id}) &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Detail Card */}
      <div className="detail-card">
        <div className="detail-header">
          <div className="detail-header-left">
            <h2>
              <span>{invoice.invoice_number}</span>
              <StatusBadge status={invoice.status} />
            </h2>
            <div className="detail-vendor">{invoice.vendor_name}</div>
          </div>
          <div>
            <div className="detail-amount">
              {formatCurrency(invoice.amount_cents, invoice.currency)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
              Currency: {invoice.currency}
            </div>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="detail-grid">
          <div>
            <div className="detail-item-label">Invoice Date</div>
            <div className="detail-item-value">{formatDate(invoice.invoice_date)}</div>
          </div>
          <div>
            <div className="detail-item-label">Due Date</div>
            <div className="detail-item-value">{formatDate(invoice.due_date)}</div>
          </div>
          <div>
            <div className="detail-item-label">Database ID</div>
            <div className="detail-item-value">#{invoice.id}</div>
          </div>
          <div>
            <div className="detail-item-label">Created At</div>
            <div className="detail-item-value">
              {new Date(invoice.created_at).toLocaleString()}
            </div>
          </div>
          {invoice.decided_at && (
            <div>
              <div className="detail-item-label">Decision Recorded At</div>
              <div className="detail-item-value">
                {new Date(invoice.decided_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Line Items / Description */}
        <div className="detail-item-label">Description / Line Items Summary</div>
        <div className="detail-description-box">
          <div className="detail-description-text">{invoice.description}</div>
        </div>

        {/* Action Controls */}
        {!isFinalStatus ? (
          <div className="action-bar">
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginRight: 'auto' }}>
              Review decision:
            </span>
            <button
              type="button"
              className="btn btn-reject"
              onClick={() => handleAction('rejected')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <span className="spinner" /> : null}
              <span>Reject Invoice</span>
            </button>
            <button
              type="button"
              className="btn btn-approve"
              onClick={() => handleAction('approved')}
              disabled={isSubmitting}
            >
              {isSubmitting ? <span className="spinner" /> : null}
              <span>Approve Invoice</span>
            </button>
          </div>
        ) : (
          <div className="action-bar" style={{ justifyContent: 'flex-start' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Decision finalized as <strong>{invoice.status}</strong> on{' '}
              {invoice.decided_at ? new Date(invoice.decided_at).toLocaleString() : 'earlier date'}. Status is permanent.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
