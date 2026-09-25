'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ticketApi, Ticket } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, getStatusClass, getPriorityClass, getPriorityBarClass, timeAgo } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
  SlidersHorizontal,
  X,
  ArrowRight,
} from 'lucide-react';

const STATUSES    = ['', 'Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES  = ['', 'Low', 'Medium', 'High', 'Critical'];
const CATEGORIES  = ['', 'General', 'Technical', 'Billing', 'Sales', 'Other'];

/* Column header with sort indicator — structural, not decorative */
function ColHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('text-2xs font-medium text-muted-foreground uppercase tracking-wide', className)}>
      {children}
    </div>
  );
}

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets]       = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [isLoading, setIsLoading]   = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    status:   '',
    priority: '',
    category: '',
    search:   '',
    page:     1,
    limit:    20,
  });

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
      );
      const res = await ticketApi.list(params as any);
      setTickets(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const updateFilter = (key: string, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : (value as number),
    }));
  };

  const clearFilters = () => {
    setFilters((prev) => ({ ...prev, status: '', priority: '', category: '', search: '', page: 1 }));
  };

  const hasActiveFilters = filters.status || filters.priority || filters.category || filters.search;

  return (
    <div className="pt-14 lg:pt-0">
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 pt-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Tickets</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            {pagination.total.toLocaleString()} total
          </p>
        </div>
        {(user?.role === 'customer' || user?.role === 'admin') && (
          <Link href="/dashboard/tickets/new">
            <Button size="sm" id="new-ticket-btn">
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              New ticket
            </Button>
          </Link>
        )}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="ticket-search"
            placeholder="Search tickets…"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-8"
            aria-label="Search tickets"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'gap-1.5',
            (showFilters || hasActiveFilters) && 'border-primary/50 text-primary bg-primary/5'
          )}
          aria-expanded={showFilters}
          aria-controls="filter-panel"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          Filters
          {hasActiveFilters && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-primary"
              aria-label="Active filters"
            />
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
            Clear
          </Button>
        )}
      </div>

      {/* ── Filter panel ──────────────────────────────────────────── */}
      {showFilters && (
        <div
          id="filter-panel"
          className="grid grid-cols-3 gap-2 mb-4 p-4 rounded-lg border border-border animate-slide-down"
          style={{ background: 'hsl(var(--surface-2))' }}
          role="group"
          aria-label="Filter options"
        >
          {[
            { key: 'status',   label: 'Status',   options: STATUSES },
            { key: 'priority', label: 'Priority', options: PRIORITIES },
            { key: 'category', label: 'Category', options: CATEGORIES },
          ].map(({ key, label, options }) => (
            <div key={key}>
              <label
                htmlFor={`filter-${key}`}
                className="block text-2xs font-medium text-muted-foreground mb-1.5"
              >
                {label}
              </label>
              <select
                id={`filter-${key}`}
                value={filters[key as keyof typeof filters] as string}
                onChange={(e) => updateFilter(key, e.target.value)}
                className="w-full h-8 rounded-md border border-border bg-muted/40 px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {options.map((o) => (
                  <option key={o} value={o}>{o || `All ${label}s`}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* ── Ticket table ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-primary" aria-label="Loading tickets…" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Inbox className="w-10 h-10 mb-3 opacity-25" aria-hidden="true" />
          <p className="text-sm font-medium">No tickets found</p>
          <p className="text-xs mt-1">Try adjusting your filters or search</p>
        </div>
      ) : (
        <div
          className="rounded-lg border border-border overflow-hidden"
          role="table"
          aria-label="Tickets list"
        >
          {/* Column headers — visible table structure */}
          <div
            className="hidden md:grid grid-cols-[3px_1fr_130px_100px_110px_32px] items-center gap-4 px-4 py-2 border-b border-border"
            style={{ background: 'hsl(var(--surface-2))' }}
            role="row"
          >
            <div aria-hidden="true" />
            <ColHeader role="columnheader">Title</ColHeader>
            <ColHeader role="columnheader">Status</ColHeader>
            <ColHeader role="columnheader">Priority</ColHeader>
            <ColHeader role="columnheader">Created</ColHeader>
            <div aria-hidden="true" />
          </div>

          {/* Rows */}
          <div role="rowgroup">
            {tickets.map((ticket) => (
              <TicketRow key={ticket._id} ticket={ticket} />
            ))}
          </div>
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono">
            Page {pagination.page} / {pagination.totalPages}
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pagination.page <= 1}
              onClick={() => updateFilter('page', pagination.page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => updateFilter('page', pagination.page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const isCriticalOpen = ticket.priority === 'Critical' && ticket.status === 'Open';

  return (
    <Link
      href={`/dashboard/tickets/${ticket._id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      role="row"
      aria-label={`Ticket: ${ticket.title}, ${ticket.status}, ${ticket.priority} priority`}
    >
      {/* Desktop: table-row layout */}
      <div
        className={cn(
          'hidden md:grid grid-cols-[3px_1fr_130px_100px_110px_32px] items-center gap-4 px-4 py-3',
          'ticket-row group',
          isCriticalOpen && 'critical-pulse',
          getPriorityBarClass(ticket.priority),
        )}
        role="cell"
      >
        {/* Left bar (handled by getPriorityBarClass on the container) */}
        <div aria-hidden="true" />

        {/* Title + meta */}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors duration-100">
            {ticket.title}
          </p>
          <p className="text-2xs text-muted-foreground mt-0.5 truncate">
            <span>{ticket.createdBy?.name}</span>
            {ticket.assignedTo && (
              <span className="text-muted-foreground/50"> · {ticket.assignedTo.name}</span>
            )}
            {ticket.category && (
              <span className="text-muted-foreground/50"> · {ticket.category}</span>
            )}
          </p>
        </div>

        {/* Status badge */}
        <div>
          <span
            className={cn(
              'inline-flex items-center text-xs px-2 py-0.5 rounded-sm badge-transition',
              getStatusClass(ticket.status)
            )}
          >
            {ticket.status}
          </span>
        </div>

        {/* Priority badge */}
        <div>
          <span
            className={cn(
              'inline-flex items-center text-xs px-2 py-0.5 rounded-sm',
              getPriorityClass(ticket.priority)
            )}
          >
            {ticket.priority}
          </span>
        </div>

        {/* Time */}
        <div>
          <p className="text-xs text-muted-foreground font-mono">{timeAgo(ticket.createdAt)}</p>
        </div>

        {/* Chevron */}
        <ArrowRight
          className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors duration-100"
          aria-hidden="true"
        />
      </div>

      {/* Mobile: stacked layout */}
      <div
        className={cn(
          'md:hidden flex items-start gap-3 px-4 py-3 ticket-row group',
          getPriorityBarClass(ticket.priority),
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={cn('text-2xs px-1.5 py-0.5 rounded-sm badge-transition', getStatusClass(ticket.status))}>
              {ticket.status}
            </span>
            <span className={cn('text-2xs px-1.5 py-0.5 rounded-sm', getPriorityClass(ticket.priority))}>
              {ticket.priority}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
            {ticket.title}
          </p>
          <p className="text-2xs text-muted-foreground mt-0.5 font-mono">{timeAgo(ticket.createdAt)}</p>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 mt-1 flex-shrink-0" aria-hidden="true" />
      </div>
    </Link>
  );
}
