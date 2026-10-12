import React from 'react';
import type { InvoiceStatus } from '@invoice-desk/shared';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; icon: React.ReactNode }
> = {
  processing: {
    label: 'Processing',
    icon: (
      <span className="status-dot status-dot-processing">
        <span className="status-dot-ping" />
      </span>
    ),
  },
  needs_review: {
    label: 'Needs Review',
    icon: (
      <span className="status-dot status-dot-warning">
        <span className="status-dot-ping" />
      </span>
    ),
  },
  approved: {
    label: 'Approved',
    icon: (
      <svg className="badge-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  rejected: {
    label: 'Rejected',
    icon: (
      <svg className="badge-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status, icon: null };
  return (
    <span className={`badge badge-${status}`} role="status">
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
