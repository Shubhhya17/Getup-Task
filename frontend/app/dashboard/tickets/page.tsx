'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ticketApi, Ticket } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, getStatusClass, getPriorityClass, getPriorityBadgeClass, getStatusBadgeClass, getPriorityBarClass, timeAgo } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Search, ChevronLeft, ChevronRight, Loader2, SlidersHorizontal, X } from 'lucide-react';

const STATUSES   = ['', 'Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITIES = ['', 'Low', 'Medium', 'High', 'Critical'];
const CATEGORIES = ['', 'General', 'Technical', 'Billing', 'Sales', 'Other'];

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets]         = useState<Ticket[]>([]);
  const [pagination, setPagination]   = useState({ total: 0, page: 1, totalPages: 1 });
  const [isLoading, setIsLoading]     = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    status: '', priority: '', category: '', search: '', page: 1, limit: 25,
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
    } catch { setTickets([]); }
    finally { setIsLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const updateFilter = (key: string, value: string | number) => {
    setFilters((prev) => ({
      ...prev, [key]: value,
      page: key !== 'page' ? 1 : (value as number),
    }));
  };

  const clearFilters = () => {
    setFilters((prev) => ({ ...prev, status: '', priority: '', category: '', search: '', page: 1 }));
  };

  const hasActiveFilters = filters.status || filters.priority || filters.category || filters.search;

  return (
    <div className="pt-12 lg:pt-0">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <h1>Tickets</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5 font-mono">
            {pagination.total.toLocaleString()} total
          </p>
        </div>
        {(user?.role === 'customer' || user?.role === 'admin') && (
          <Link href="/dashboard/tickets/new">
            <Button size="sm" id="new-ticket-btn">New ticket</Button>
          </Link>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A1A1A1]"
            strokeWidth={1.5}
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
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A1A1A1] hover:text-[#1A1A1A]"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'gap-1.5',
            (showFilters || hasActiveFilters) && 'border-[#2563EB] text-[#2563EB] bg-[#EFF6FF]'
          )}
          aria-expanded={showFilters}
          aria-controls="filter-panel"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
          Filters
          {hasActiveFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" aria-label="Active filters" />
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#6B6B6B]">
            Clear
          </Button>
        )}
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div
          id="filter-panel"
          className="grid grid-cols-3 gap-3 mb-4 p-4 rounded border border-[#E8E8E5] bg-[#FAFAF9] animate-slide-down"
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
                className="block text-xs font-medium text-[#1A1A1A] mb-1.5"
              >
                {label}
              </label>
              <select
                id={`filter-${key}`}
                value={filters[key as keyof typeof filters] as string}
                onChange={(e) => updateFilter(key, e.target.value)}
                className="w-full h-8 rounded border border-[#E8E8E5] bg-white px-2 text-xs text-[#1A1A1A] focus-visible:outline-none focus-visible:border-[#2563EB]"
              >
                {options.map((o) => <option key={o} value={o}>{o || `All ${label}s`}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* ── Ticket table ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" strokeWidth={1.5} aria-label="Loading…" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#6B6B6B]">
          <p className="text-sm font-medium">No tickets found</p>
          <p className="text-xs mt-0.5">Try adjusting your filters or search</p>
        </div>
      ) : (
        <div
          className="rounded border border-[#E8E8E5] overflow-hidden"
          role="table"
          aria-label="Tickets"
        >
          {/* Column headers */}
          <div
            className="hidden md:grid items-center gap-5 px-5 py-2.5 border-b border-[#E8E8E5] bg-[#FAFAF9]"
            style={{ gridTemplateColumns: '3px 1fr 130px 100px 110px' }}
            role="row"
          >
            <div aria-hidden="true" />
            <ColHeader>Title</ColHeader>
            <ColHeader>Status</ColHeader>
            <ColHeader>Priority</ColHeader>
            <ColHeader>Created</ColHeader>
          </div>

          <div role="rowgroup">
            {tickets.map((ticket) => (
              <TicketRow key={ticket._id} ticket={ticket} />
            ))}
          </div>
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#E8E8E5]">
          <p className="text-xs text-[#6B6B6B] font-mono">
            {pagination.page} / {pagination.totalPages}
          </p>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pagination.page <= 1}
              onClick={() => updateFilter('page', pagination.page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => updateFilter('page', pagination.page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ColHeader({ children, role }: { children: React.ReactNode; role?: string }) {
  return (
    <div
      className="text-xs font-medium text-[#6B6B6B]"
      role={role ?? 'columnheader'}
    >
      {children}
    </div>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const isCriticalOpen = ticket.priority === 'Critical' && ticket.status === 'Open';

  return (
    <Link
      href={`/dashboard/tickets/${ticket._id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 focus-visible:ring-inset"
      role="row"
      aria-label={`${ticket.title}, ${ticket.status}, ${ticket.priority} priority`}
    >
      {/* Desktop */}
      <div
        className={cn(
          'hidden md:grid items-center gap-5 px-5 py-3.5 ticket-row group',
          isCriticalOpen && 'critical-pulse',
          'pl-[calc(1.25rem+2px)]', // account for priority bar
          getPriorityBarClass(ticket.priority),
        )}
        style={{ gridTemplateColumns: '0px 1fr 130px 100px 110px' }}
        role="cell"
      >
        <div aria-hidden="true" />

        {/* Title + meta */}
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1A1A1A] truncate group-hover:text-[#2563EB] transition-colors duration-100">
            {ticket.title}
          </p>
          <p className="text-xs text-[#A1A1A1] mt-0.5 truncate font-mono">
            {ticket.createdBy?.name}
            {ticket.assignedTo && <span className="text-[#C8C8C5]"> · {ticket.assignedTo.name}</span>}
          </p>
        </div>

        {/* Status — dot + label */}
        <div>
          <span className={cn('badge-transition', getStatusClass(ticket.status))}>
            {ticket.status}
          </span>
        </div>

        {/* Priority — square pip + label */}
        <div>
          <span className={getPriorityClass(ticket.priority)}>
            {ticket.priority}
          </span>
        </div>

        {/* Time */}
        <p className="text-xs text-[#A1A1A1] font-mono">{timeAgo(ticket.createdAt)}</p>
      </div>

      {/* Mobile */}
      <div
        className={cn(
          'md:hidden flex items-start gap-3 px-4 py-3.5 ticket-row group',
          'pl-[calc(1rem+2px)]',
          getPriorityBarClass(ticket.priority),
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn('badge-transition', getStatusClass(ticket.status))}>
              {ticket.status}
            </span>
            <span className={getPriorityClass(ticket.priority)}>
              {ticket.priority}
            </span>
          </div>
          <p className="text-sm font-medium text-[#1A1A1A] truncate group-hover:text-[#2563EB] transition-colors">
            {ticket.title}
          </p>
          <p className="text-xs text-[#A1A1A1] mt-0.5 font-mono">{timeAgo(ticket.createdAt)}</p>
        </div>
      </div>
    </Link>
  );
}
