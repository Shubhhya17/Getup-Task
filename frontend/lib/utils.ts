import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function formatDateShort(date: string | Date) {
  return format(new Date(date), 'MMM d');
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Status → dot+label CSS class.
 * Approach (b): dot (●) + text label, no icon library glyph.
 * Returns a class that styles ::before as a colored circle.
 */
export function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    'Open':        'status-dot status-open',
    'In Progress': 'status-dot status-progress',
    'Resolved':    'status-dot status-resolved',
    'Closed':      'status-dot status-closed',
  };
  return map[status] ?? 'status-dot status-closed';
}

/**
 * Status → compact badge class (used in table cells, not full dot+label).
 */
export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    'Open':        'badge-status-open',
    'In Progress': 'badge-status-progress',
    'Resolved':    'badge-status-resolved',
    'Closed':      'badge-status-closed',
  };
  return map[status] ?? 'badge-status-closed';
}

/**
 * Priority → square pip (■) + label CSS class.
 * Square distinguishes priority from status (circle).
 */
export function getPriorityClass(priority: string): string {
  const map: Record<string, string> = {
    Low:      'priority-pip priority-low',
    Medium:   'priority-pip priority-medium',
    High:     'priority-pip priority-high',
    Critical: 'priority-pip priority-critical',
  };
  return map[priority] ?? 'priority-pip priority-medium';
}

/**
 * Priority → compact badge class (table cells).
 */
export function getPriorityBadgeClass(priority: string): string {
  const map: Record<string, string> = {
    Low:      'badge-low',
    Medium:   'badge-medium',
    High:     'badge-high',
    Critical: 'badge-critical',
  };
  return map[priority] ?? 'badge-medium';
}

/** Priority → left-bar class (ticket rows) */
export function getPriorityBarClass(priority: string): string {
  const map: Record<string, string> = {
    Low:      'priority-bar-low',
    Medium:   'priority-bar-medium',
    High:     'priority-bar-high',
    Critical: 'priority-bar-critical',
  };
  return map[priority] ?? 'priority-bar-medium';
}

/** Priority → hex color (Recharts) */
export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    Low:      '#16A34A',
    Medium:   '#D97706',
    High:     '#EA580C',
    Critical: '#DC2626',
  };
  return map[priority] ?? '#9CA3AF';
}

/** Status → hex color (Recharts) */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    'Open':        '#16A34A',
    'In Progress': '#D97706',
    'Resolved':    '#2563EB',
    'Closed':      '#9CA3AF',
  };
  return map[status] ?? '#9CA3AF';
}

/** Ticket status state machine */
export function getNextStatuses(current: string): string[] {
  const transitions: Record<string, string[]> = {
    Open:          ['In Progress'],
    'In Progress': ['Resolved'],
    Resolved:      ['Closed'],
    Closed:        [],
  };
  return transitions[current] ?? [];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || 'An error occurred';
  }
  if (error instanceof Error) return error.message;
  return 'An error occurred';
}

/** Role → display label + color class */
export function getRoleDisplay(role: string): { label: string; className: string } {
  const map: Record<string, { label: string; className: string }> = {
    admin:    { label: 'Admin',    className: 'text-[#C2410C]' },
    agent:    { label: 'Agent',    className: 'text-[#1D4ED8]' },
    customer: { label: 'Customer', className: 'text-[#6B6B6B]' },
  };
  return map[role] ?? { label: role, className: 'text-[#6B6B6B]' };
}
