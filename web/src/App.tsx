import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Invoice,
  InvoiceWithOriginal,
  StatusCounts,
} from '@invoice-desk/shared';
import { getInvoices, getInvoice } from './api/client.js';
import { Tabs, type TabKey } from './components/Tabs.js';
import { InvoiceList, formatCurrency } from './components/InvoiceList.js';
import { InvoiceDetail } from './components/InvoiceDetail.js';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('processing');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [counts, setCounts] = useState<StatusCounts>({
    processing: 0,
    needs_review: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithOriginal | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Map active tab to status filter query parameter
  const getFilterForTab = (tab: TabKey): string => {
    switch (tab) {
      case 'processing':
        return 'processing';
      case 'needs_review':
        return 'needs_review';
      case 'decided':
        return 'approved,rejected';
    }
  };

  // Load invoices for the current active tab
  const loadInvoices = useCallback(async (tab: TabKey) => {
    setIsLoadingList(true);
    setGlobalError(null);
    try {
      const response = await getInvoices(getFilterForTab(tab));
      setInvoices(response.data);
      setCounts(response.counts);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load invoices';
      setGlobalError(msg);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  // Fetch invoices when active tab changes
  useEffect(() => {
    if (selectedInvoiceId === null) {
      loadInvoices(activeTab);
    }
  }, [activeTab, selectedInvoiceId, loadInvoices]);

  // Load single invoice details when an invoice is selected
  const loadInvoiceDetail = useCallback(async (id: number) => {
    setIsLoadingDetail(true);
    setGlobalError(null);
    try {
      const response = await getInvoice(id);
      setSelectedInvoice(response.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to load invoice #${id}`;
      setGlobalError(msg);
      setSelectedInvoice(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (selectedInvoiceId !== null) {
      loadInvoiceDetail(selectedInvoiceId);
    } else {
      setSelectedInvoice(null);
    }
  }, [selectedInvoiceId, loadInvoiceDetail]);

  const handleSelectInvoice = (id: number) => {
    setSelectedInvoiceId(id);
  };

  const handleBackToList = () => {
    setSelectedInvoiceId(null);
    setSelectedInvoice(null);
    loadInvoices(activeTab);
  };

  const handleInvoiceUpdated = (updated: InvoiceWithOriginal) => {
    setSelectedInvoice(updated);
    // Refresh background list & tab counts
    loadInvoices(activeTab);
  };

  const totalValueInView = useMemo(() => {
    return invoices.reduce((acc, inv) => acc + inv.amount_cents, 0);
  }, [invoices]);

  return (
    <div className="app-container">
      <header className="app-header glass-header">
        <div className="brand-group">
          <div className="brand-logo-glow">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <div>
            <div className="brand-title">
              <span className="brand-gradient-text">Invoice Approval Desk</span>
            </div>
            <div className="brand-subtitle">
              Accounts Payable review &bull; Decision Queue &bull; Duplicate Sentinel
            </div>
          </div>
        </div>
      </header>

      {/* Metric KPI Summary Cards */}
      <section className="metrics-grid" aria-label="System KPI summary">
        <div className="metric-card glass-panel 3d-metric">
          <div className="metric-header">
            <span className="metric-title">Total Invoices</span>
            <span className="metric-icon total">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </span>
          </div>
          <div className="metric-number font-mono">{counts.total}</div>
          <div className="metric-footer text-muted">Audited SQLite Records</div>
        </div>

        <div className="metric-card glass-panel 3d-metric">
          <div className="metric-header">
            <span className="metric-title">Processing Queue</span>
            <span className="metric-icon processing">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
          </div>
          <div className="metric-number font-mono text-cyan">{counts.processing}</div>
          <div className="metric-footer text-cyan">Awaiting Reviewer Action</div>
        </div>

        <div className="metric-card glass-panel 3d-metric">
          <div className="metric-header">
            <span className="metric-title">Needs Review (Duplicates)</span>
            <span className="metric-icon warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
          </div>
          <div className="metric-number font-mono text-amber">{counts.needs_review}</div>
          <div className="metric-footer text-amber">Duplicate Rule Triggered</div>
        </div>

        <div className="metric-card glass-panel 3d-metric">
          <div className="metric-header">
            <span className="metric-title">Decided (Approved/Rejected)</span>
            <span className="metric-icon success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </div>
          <div className="metric-number font-mono text-emerald">
            {counts.approved + counts.rejected}
          </div>
          <div className="metric-footer text-emerald">
            {counts.approved} Approved &bull; {counts.rejected} Rejected
          </div>
        </div>
      </section>

      {globalError && (
        <div className="feedback-banner feedback-error animate-slide-down" role="alert">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{globalError}</span>
        </div>
      )}

      {selectedInvoiceId !== null ? (
        isLoadingDetail ? (
          <div className="content-card glass-panel">
            <div className="empty-state">
              <div className="spinner-glow" />
              <p className="loading-text">Loading invoice #{selectedInvoiceId} details...</p>
            </div>
          </div>
        ) : selectedInvoice ? (
          <InvoiceDetail
            invoice={selectedInvoice}
            onBack={handleBackToList}
            onInvoiceUpdated={handleInvoiceUpdated}
            onSelectInvoice={handleSelectInvoice}
          />
        ) : (
          <div className="content-card glass-panel">
            <div className="empty-state">
              <p className="empty-title">Invoice not found or could not be loaded.</p>
              <button
                type="button"
                className="btn-back glass-button"
                onClick={handleBackToList}
                style={{ marginTop: '1.25rem' }}
              >
                Return to queue
              </button>
            </div>
          </div>
        )
      ) : (
        <main className="main-content-area">
          <div className="tab-control-bar">
            <Tabs
              activeTab={activeTab}
              onTabChange={(tab) => {
                setActiveTab(tab);
              }}
              counts={counts}
            />

            <div className="tab-side-summary">
              <span className="summary-label">Tab Value:</span>
              <span className="summary-value font-mono">{formatCurrency(totalValueInView)}</span>
            </div>
          </div>

          <InvoiceList
            invoices={invoices}
            onSelectInvoice={handleSelectInvoice}
            isLoading={isLoadingList}
          />
        </main>
      )}
    </div>
  );
};
export default App;
