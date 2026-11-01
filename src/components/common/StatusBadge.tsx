import React from 'react';
import type { TicketStatus, Priority } from '../../types.ts';

export const StatusBadge: React.FC<{ status: TicketStatus | string }> = ({ status }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-300';

  switch (status) {
    case 'Submitted':
    case 'Pending Review':
      // Pending: amber
      style = 'bg-amber-50 text-amber-900 border-amber-300';
      break;
    case 'Assigned':
      style = 'bg-sky-50 text-sky-900 border-sky-300';
      break;
    case 'In Progress':
      // In progress: blue
      style = 'bg-blue-50 text-blue-900 border-blue-300';
      break;
    case 'Awaiting Parts':
      style = 'bg-amber-100/80 text-amber-950 border-amber-300';
      break;
    case 'Awaiting Access':
      style = 'bg-[#FDF6F8] text-[#681C32] border-[#F2CBD5]';
      break;
    case 'Resolved':
      // Resolved: green
      style = 'bg-emerald-50 text-emerald-900 border-emerald-300';
      break;
    case 'Closed':
      style = 'bg-slate-100 text-slate-700 border-slate-300';
      break;
    case 'Reopened':
      style = 'bg-rose-50 text-rose-900 border-rose-300';
      break;
    case 'Rejected':
      style = 'bg-red-50 text-red-900 border-red-300';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${style} whitespace-nowrap`}>
      {status}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: Priority | string }> = ({ priority }) => {
  let color = 'text-[#546E7A]';
  let dotColor = 'bg-slate-400';
  let label = priority;

  switch (priority?.toLowerCase()) {
    case 'critical':
    case 'emergency':
      // Urgent: red
      color = 'text-rose-700 font-bold';
      dotColor = 'bg-rose-600';
      label = priority?.toLowerCase() === 'critical' ? 'Critical' : 'Emergency';
      break;
    case 'high':
      color = 'text-amber-800 font-semibold';
      dotColor = 'bg-amber-600';
      label = 'High';
      break;
    case 'medium':
      color = 'text-blue-800 font-medium';
      dotColor = 'bg-blue-600';
      label = 'Medium';
      break;
    case 'low':
      color = 'text-[#546E7A]';
      dotColor = 'bg-slate-400';
      label = 'Low';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${color} whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {label}
    </span>
  );
};

