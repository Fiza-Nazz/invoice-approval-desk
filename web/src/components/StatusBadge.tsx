import React from 'react';
import type { InvoiceStatus } from '@invoice-desk/shared';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  processing: 'Processing',
  needs_review: 'Needs Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`badge badge-${status}`} role="status">
      {label}
    </span>
  );
};
