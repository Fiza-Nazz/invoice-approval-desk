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
  const [note, setNote] = useState('');
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
        note: note.trim() || undefined,
      });
      setFeedback({
        type: 'success',
        message: `Decision recorded: Invoice ${invoice.invoice_number} successfully marked as ${targetStatus.toUpperCase()}!`,
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
    <div className="detail-view animate-fade-in">
      <div className="detail-nav">
        <button type="button" className="btn-back glass-button" onClick={onBack} aria-label="Back to invoices list">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>Back to Invoices Queue</span>
        </button>

        <div className="detail-nav-meta">
          <span className="live-status-pill">
            <span className="live-status-dot" />
            Active Session
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`feedback-banner feedback-${feedback.type} animate-slide-down`}
          role="alert"
          aria-live="polite"
        >
          {feedback.type === 'success' ? (
            <div className="feedback-icon-box success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ) : (
            <div className="feedback-icon-box error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          )}
          <div className="feedback-content">
            <div className="feedback-title">
              {feedback.type === 'success' ? 'Action Completed' : 'Action Blocked (409 Conflict)'}
            </div>
            <div className="feedback-desc">{feedback.message}</div>
          </div>
        </div>
      )}

      {/* Duplicate Warning Holographic Card */}
      {invoice.duplicate_of_id && (
        <div className="callout-warning glass-card-warning" role="region" aria-label="Duplicate invoice alert">
          <div className="callout-warning-header">
            <div className="callout-warning-icon-wrapper">
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
            <div>
              <div className="callout-warning-title">
                AI Duplicate Sentinel &bull; Suspected Duplicate Detected
              </div>
              <div className="callout-warning-body">
                {invoice.review_reason || 'This invoice has been flagged as a potential duplicate.'}
              </div>
            </div>
          </div>

          <div className="comparison-preview-card">
            <div className="comparison-header">
              <span>Matching Reference Record</span>
              <span className="comparison-badge">Original Primary #{invoice.duplicate_of_id}</span>
            </div>

            {invoice.original_invoice ? (
              <div className="comparison-grid">
                <div className="comparison-item">
                  <span className="comp-label">Original Invoice #</span>
                  <span className="comp-val font-mono">{invoice.original_invoice.invoice_number}</span>
                </div>
                <div className="comparison-item">
                  <span className="comp-label">Vendor</span>
                  <span className="comp-val">{invoice.original_invoice.vendor_name}</span>
                </div>
                <div className="comparison-item">
                  <span className="comp-label">Amount</span>
                  <span className="comp-val font-mono text-emerald">
                    {formatCurrency(invoice.original_invoice.amount_cents, invoice.original_invoice.currency)}
                  </span>
                </div>
                <div className="comparison-item">
                  <span className="comp-label">Original Status</span>
                  <StatusBadge status={invoice.original_invoice.status} />
                </div>
                <div className="comparison-action-col">
                  <button
                    type="button"
                    className="btn-inspect-original"
                    onClick={() => onSelectInvoice(invoice.original_invoice!.id)}
                  >
                    <span>Compare Original Invoice</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn-inspect-original"
                onClick={() => onSelectInvoice(invoice.duplicate_of_id!)}
              >
                <span>View Original Invoice Record (#{invoice.duplicate_of_id})</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Detail Card */}
      <div className="detail-card glass-panel 3d-tilt-card">
        <div className="detail-header">
          <div className="detail-header-left">
            <div className="detail-badge-row">
              <span className="db-id-badge">ID #{invoice.id}</span>
              <StatusBadge status={invoice.status} />
            </div>
            <h1 className="detail-invoice-title font-mono">{invoice.invoice_number}</h1>
            <div className="detail-vendor-name">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span>{invoice.vendor_name}</span>
            </div>
          </div>

          <div className="detail-header-right">
            <div className="amount-hero-box">
              <span className="amount-hero-label">Total Payable</span>
              <div className="amount-hero-val font-mono">
                {formatCurrency(invoice.amount_cents, invoice.currency)}
              </div>
              <span className="currency-pill">{invoice.currency} &bull; Verified</span>
            </div>
          </div>
        </div>

        {/* Detailed Grid */}
        <div className="detail-grid">
          <div className="detail-item-card">
            <div className="detail-item-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Invoice Date</span>
            </div>
            <div className="detail-item-value">{formatDate(invoice.invoice_date)}</div>
          </div>

          <div className="detail-item-card">
            <div className="detail-item-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Due Date</span>
            </div>
            <div className="detail-item-value">{formatDate(invoice.due_date)}</div>
          </div>

          <div className="detail-item-card">
            <div className="detail-item-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Ingested At</span>
            </div>
            <div className="detail-item-value text-muted font-mono" style={{ fontSize: '0.85rem' }}>
              {new Date(invoice.created_at).toLocaleString()}
            </div>
          </div>

          {invoice.decided_at && (
            <div className="detail-item-card highlight-decision">
              <div className="detail-item-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>Decision Timestamp</span>
              </div>
              <div className="detail-item-value font-mono text-emerald" style={{ fontSize: '0.85rem' }}>
                {new Date(invoice.decided_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {/* Line Items / Description */}
        <div className="description-section">
          <div className="section-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span>Itemized Description & Deliverables</span>
          </div>
          <div className="detail-description-box">
            <p className="detail-description-text">{invoice.description}</p>
          </div>
        </div>

        {/* Action Controls */}
        {!isFinalStatus ? (
          <div className="decision-desk-panel">
            <div className="decision-desk-header">
              <div className="decision-title">
                <span className="decision-pulse" />
                <span>Reviewer Decision Desk</span>
              </div>
              <span className="decision-note-tip">Add optional note to audit log</span>
            </div>

            <div className="decision-input-row">
              <input
                type="text"
                className="review-note-input"
                placeholder="Optional reviewer note (e.g. 'PO-4091 matched, approved by AP supervisor')..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="action-bar">
              <button
                type="button"
                className="btn btn-reject btn-glow-danger"
                onClick={() => handleAction('rejected')}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="spinner" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
                <span>Reject Invoice</span>
              </button>

              <button
                type="button"
                className="btn btn-approve btn-glow-success btn-shimmer"
                onClick={() => handleAction('approved')}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="spinner" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                <span>Approve & Authorize Payment</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="finalized-stamp-card">
            <div className="stamp-icon-box">
              {invoice.status === 'approved' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
            </div>
            <div>
              <div className="stamp-title">
                Permanent Terminal Status: <strong>{invoice.status.toUpperCase()}</strong>
              </div>
              <div className="stamp-desc">
                This record was finalized on{' '}
                <strong>
                  {invoice.decided_at ? new Date(invoice.decided_at).toLocaleString() : 'prior date'}
                </strong>
                . Per enterprise audit compliance rules, decisions cannot be reverted (HTTP 409 Conflict).
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
