'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { dashboardApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  cn, timeAgo, getPriorityColor, getStatusColor,
  getPriorityBadgeClass, getPriorityBarClass,
} from '@/lib/utils';
import { Loader2, ArrowRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

/*
 * Dashboard — Meridian design.
 *
 * THE ONE animation moment: KPI counter reveal (kpi-reveal class).
 *
 * Data hierarchy:
 *   1. KPI numerals — largest elements, JetBrains Mono
 *   2. Status/priority indicators — full saturation
 *   3. Charts — muted grid, semantic palette bars/cells
 *   4. All other text — quiet, secondary
 *
 * No icons as decoration. Lucide only for: ArrowRight (navigation).
 */

const CHART_TOOLTIP = {
  background: '#FFFFFF',
  border: '1px solid #E8E8E5',
  borderRadius: '6px',
  fontSize: '11px',
  fontFamily: "'JetBrains Mono', monospace",
  color: '#1A1A1A',
  padding: '6px 10px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};

const AXIS_TICK = {
  fill: '#A1A1A1',
  fontSize: 11,
  fontFamily: "'JetBrains Mono', monospace",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]       = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      dashboardApi
        .getStats()
        .then((res) => setStats(res.data.data))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" strokeWidth={1.5} aria-label="Loading…" />
      </div>
    );
  }

  /* ── Non-admin ── */
  if (user?.role !== 'admin') {
    return (
      <div className="pt-12 lg:pt-0">
        <div className="mb-8 pt-2">
          <h1 className="text-xl font-semibold text-[#1A1A1A]">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {user?.role === 'customer'
              ? 'Manage your support tickets and track their progress.'
              : 'View and manage your assigned tickets.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
          <QuickLink href="/dashboard/tickets" label="My Tickets" description="View all tickets" />
          {user?.role === 'customer' && (
            <QuickLink href="/dashboard/tickets/new" label="Submit a Ticket" description="Report an issue" isPrimary />
          )}
        </div>
      </div>
    );
  }

  /* ── Admin dashboard ── */
  const totalTickets  = stats?.byStatus?.reduce((s: number, i: any) => s + i.count, 0) || 0;
  const openCount     = stats?.byStatus?.find((s: any) => s.status === 'Open')?.count || 0;
  const resolvedCount = stats?.byStatus?.find((s: any) => s.status === 'Resolved')?.count || 0;
  const stalledCount  = stats?.stalledTickets?.count || 0;
  const avgHours      = stats?.resolutionTime?.avgResolutionHours;

  return (
    <div className="pt-12 lg:pt-0">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <div>
          <h1>Overview</h1>
          <p className="text-sm text-[#6B6B6B] mt-1">Support operations dashboard</p>
        </div>
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-1 text-xs text-[#6B6B6B] hover:text-[#2563EB] transition-colors"
        >
          All tickets
          <ArrowRight className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>

      {/* ── KPI row — THE ONE animated moment ───────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#E8E8E5] rounded overflow-hidden mb-4 border border-[#E8E8E5]" role="list" aria-label="Key metrics">
        <KpiCard title="Total tickets"  value={totalTickets}  index={0} />
        <KpiCard title="Open"           value={openCount}     index={1} valueColor="#15803D" />
        <KpiCard title="Resolved"       value={resolvedCount} index={2} valueColor="#1D4ED8" />
        <KpiCard
          title="Stalled >48h"
          value={stalledCount}
          index={3}
          valueColor={stalledCount > 0 ? '#C2410C' : '#A1A1A1'}
        />
      </div>

      {stats?.aiSummary && (
        <div className="ai-panel p-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-[hsl(var(--ai-ink))]">
              AI Queue Summary
            </span>
          </div>
          <p className="text-sm text-[#1A1A1A] leading-relaxed">
            {stats.aiSummary}
          </p>
        </div>
      )}

      {/* ── Resolution time + status donut ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Avg resolution */}
        <Card>
          <CardHeader><CardTitle>Avg. resolution</CardTitle></CardHeader>
          <CardContent className="pt-3">
            <p
              className="stat-value text-[2rem] text-[#1A1A1A]"
              aria-label={avgHours != null ? `${avgHours.toFixed(1)} hours` : 'Not available'}
            >
              {avgHours != null
                ? <>{avgHours.toFixed(1)}<span className="text-base font-sans font-normal text-[#6B6B6B] ml-1">h</span></>
                : <span className="text-[#A1A1A1]">—</span>}
            </p>
            <p className="text-xs text-[#6B6B6B] mt-2 font-mono">
              {stats?.resolutionTime?.resolvedTicketCount || 0} resolved
            </p>
          </CardContent>
        </Card>

        {/* Status distribution donut */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Tickets by status</CardTitle></CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={stats?.byStatus || []}
                  dataKey="count"
                  nameKey="status"
                  cx="35%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {(stats?.byStatus || []).map((entry: any) => (
                    <Cell key={entry.status} fill={getStatusColor(entry.status)} />
                  ))}
                </Pie>
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconType="circle"
                  iconSize={7}
                  formatter={(v) => <span style={{ fontSize: '11px', color: '#6B6B6B' }}>{v}</span>}
                />
                <Tooltip contentStyle={CHART_TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Priority chart + stalled tickets ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Tickets by priority</CardTitle></CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats?.byPriority || []} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="2 2" stroke="#F4F4F2" vertical={false} />
                <XAxis dataKey="priority" tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={CHART_TOOLTIP} cursor={{ fill: '#F4F4F2' }} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {(stats?.byPriority || []).map((entry: any) => (
                    <Cell key={entry.priority} fill={getPriorityColor(entry.priority)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stalled tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Stalled tickets</span>
              <span className="text-[10px] font-mono text-[#A1A1A1]">&gt;48h open</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {stalledCount === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-[#15803D]">Queue is healthy</p>
                <p className="text-xs text-[#6B6B6B] mt-0.5">No stalled tickets</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-44 overflow-y-auto scrollbar-thin" role="list">
                {(stats?.stalledTickets?.tickets || []).map((t: any) => (
                  <Link
                    key={t._id}
                    href={`/dashboard/tickets/${t._id}`}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded hover:bg-[#FAFAF9] transition-colors group',
                      'pl-4',
                      getPriorityBarClass(t.priority),
                    )}
                    role="listitem"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1A1A1A] truncate group-hover:text-[#2563EB] transition-colors">
                        {t.title}
                      </p>
                      <p className="text-xs text-[#6B6B6B] font-mono">{t.ageHours?.toFixed(0)}h</p>
                    </div>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded', getPriorityBadgeClass(t.priority))}>
                      {t.priority}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── KPI Card — the ONE orchestrated animation ── */
function KpiCard({
  title, value, index, valueColor,
}: {
  title: string;
  value: number;
  index: number;
  valueColor?: string;
}) {
  return (
    <div
      className="kpi-reveal bg-white px-5 py-5"
      style={{ animationDelay: `${index * 0.06}s` }}
      role="listitem"
    >
      <p className="text-xs text-[#6B6B6B] mb-3">{title}</p>
      <p
        className="stat-value text-3xl"
        style={{ color: valueColor ?? '#1A1A1A' }}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

/* ── Non-admin quick-link ── */
function QuickLink({
  href, label, description, isPrimary,
}: {
  href: string;
  label: string;
  description: string;
  isPrimary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex-1 px-5 py-4 rounded border transition-colors duration-100',
        'focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-[#2563EB]',
        isPrimary
          ? 'border-[#BFDBFE] bg-[#EFF6FF] hover:bg-[#DBEAFE]'
          : 'border-[#E8E8E5] bg-white hover:bg-[#FAFAF9]'
      )}
    >
      <p className={cn('text-sm font-medium', isPrimary ? 'text-[#1D4ED8]' : 'text-[#1A1A1A]')}>
        {label}
      </p>
      <p className="text-xs text-[#6B6B6B] mt-0.5">{description}</p>
    </Link>
  );
}
