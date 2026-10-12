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

  const tabs: Array<{
    key: TabKey;
    label: string;
    count: number;
    icon: React.ReactNode;
  }> = [
    {
      key: 'processing',
      label: 'Processing',
      count: counts.processing || 0,
      icon: (
        <span className="tab-icon tab-icon-processing">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </span>
      ),
    },
    {
      key: 'needs_review',
      label: 'Needs Review',
      count: counts.needs_review || 0,
      icon: (
        <span className="tab-icon tab-icon-warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          </svg>
        </span>
      ),
    },
    {
      key: 'decided',
      label: 'Approved / Rejected',
      count: decidedCount,
      icon: (
        <span className="tab-icon tab-icon-decided">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </span>
      ),
    },
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
            {tab.icon}
            <span className="tab-label">{tab.label}</span>
            <span className={`tab-count ${tab.key === 'needs_review' && tab.count > 0 ? 'tab-count-alert' : ''}`}>
              {tab.count}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
