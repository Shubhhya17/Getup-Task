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

/** Status → CSS class (color + text — never color alone for accessibility) */
export function getStatusClass(status: string) {
  const map: Record<string, string> = {
    'Open':        'badge-status-open',
    'In Progress': 'badge-status-progress',
    'Resolved':    'badge-status-resolved',
    'Closed':      'badge-status-closed',
  };
  return map[status] ?? 'badge-status-closed';
}

/** Priority → CSS class */
export function getPriorityClass(priority: string) {
  const map: Record<string, string> = {
    Low:      'badge-low',
    Medium:   'badge-medium',
    High:     'badge-high',
    Critical: 'badge-critical',
  };
  return map[priority] ?? 'badge-medium';
}

/** Priority → left-bar urgency indicator class (ticket rows) */
export function getPriorityBarClass(priority: string) {
  const map: Record<string, string> = {
    Low:      'priority-bar-low',
    Medium:   'priority-bar-medium',
    High:     'priority-bar-high',
    Critical: 'priority-bar-critical',
  };
  return map[priority] ?? 'priority-bar-medium';
}

/** Priority → solid hex color (for Recharts) */
export function getPriorityColor(priority: string) {
  const map: Record<string, string> = {
    Low:      '#3FB950',
    Medium:   '#E3B341',
    High:     '#F0883E',
    Critical: '#F85149',
  };
  return map[priority] ?? '#8B949E';
}

/** Status → solid hex color (for Recharts) */
export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    'Open':        '#3FB950',
    'In Progress': '#E3B341',
    'Resolved':    '#58A6FF',
    'Closed':      '#484F58',
  };
  return map[status] ?? '#484F58';
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

/** Returns the role badge label and semantic class */
export function getRoleDisplay(role: string): { label: string; className: string } {
  const map: Record<string, { label: string; className: string }> = {
    admin:    { label: 'Admin',    className: 'text-[hsl(var(--priority-high))]' },
    agent:    { label: 'Agent',    className: 'text-[hsl(var(--status-resolved))]' },
    customer: { label: 'Customer', className: 'text-muted-foreground' },
  };
  return map[role] ?? { label: role, className: 'text-muted-foreground' };
}
