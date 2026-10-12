import React from 'react';
import type { StatusCounts } from '@invoice-desk/shared';

export type TabKey = 'processing' | 'needs_review' | 'decided';

interface TabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  counts: StatusCounts;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, counts }) => {
  const decidedCount = (counts.approved || 0) + (counts.rejected || 0);

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: 'processing', label: 'Processing', count: counts.processing || 0 },
    { key: 'needs_review', label: 'Needs Review', count: counts.needs_review || 0 },
    { key: 'decided', label: 'Approved / Rejected', count: decidedCount },
  ];

  return (
    <nav className="tabs-nav" aria-label="Invoice filter tabs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            className={`tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
            aria-selected={isActive}
            role="tab"
          >
            <span>{tab.label}</span>
            <span className="tab-count" aria-label={`${tab.count} invoices`}>
              {tab.count}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
