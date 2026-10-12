import React, { useState, useEffect, useCallback } from 'react';
import type {
  Invoice,
  InvoiceWithOriginal,
  StatusCounts,
} from '@invoice-desk/shared';
import { getInvoices, getInvoice } from './api/client.js';
import { Tabs, type TabKey } from './components/Tabs.js';
import { InvoiceList } from './components/InvoiceList.js';
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

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <div className="brand-title">
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
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            <span>Invoice Approval Desk</span>
          </div>
          <div className="brand-subtitle">
            Accounts Payable review & decision queue
          </div>
        </div>
      </header>

      {globalError && (
        <div className="feedback-banner feedback-error" role="alert">
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
          <span>{globalError}</span>
        </div>
      )}

      {selectedInvoiceId !== null ? (
        isLoadingDetail ? (
          <div className="content-card">
            <div className="empty-state">
              <div
                className="spinner"
                style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }}
              />
              <p style={{ marginTop: '0.75rem' }}>Loading invoice #{selectedInvoiceId}...</p>
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
          <div className="content-card">
            <div className="empty-state">
              <p>Invoice not found or could not be loaded.</p>
              <button
                type="button"
                className="btn-back"
                onClick={handleBackToList}
                style={{ marginTop: '1rem' }}
              >
                Return to list
              </button>
            </div>
          </div>
        )
      ) : (
        <main>
          <Tabs
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
            }}
            counts={counts}
          />

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
