'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { dashboardApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, timeAgo, getPriorityColor, getStatusColor, getPriorityClass, getPriorityBarClass } from '@/lib/utils';
import {
  Ticket,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Loader2,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
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
        <Loader2 className="w-5 h-5 animate-spin text-primary" aria-label="Loading…" />
      </div>
    );
  }

  /* ── Non-admin welcome ──────────────────────────────────────── */
  if (user?.role !== 'admin') {
    return (
      <div className="pt-14 lg:pt-0">
        <div className="mb-6 pt-2">
          <h1 className="text-xl font-semibold text-foreground">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user?.role === 'customer'
              ? 'Manage your support tickets and track their progress.'
              : 'View and manage your assigned tickets.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NonAdminCard
            title="My Tickets"
            description="View all your support tickets"
            href="/dashboard/tickets"
            icon={Ticket}
          />
          {user?.role === 'customer' && (
            <NonAdminCard
              title="Submit a Ticket"
              description="Report a new issue or request"
              href="/dashboard/tickets/new"
              icon={Plus}
              isPrimary
            />
          )}
        </div>
      </div>
    );
  }

  /* ── Admin dashboard ────────────────────────────────────────── */
  const totalTickets = stats?.byStatus?.reduce((s: number, i: any) => s + i.count, 0) || 0;
  const openCount    = stats?.byStatus?.find((s: any) => s.status === 'Open')?.count || 0;
  const resolvedCount = stats?.byStatus?.find((s: any) => s.status === 'Resolved')?.count || 0;
  const stalledCount  = stats?.stalledTickets?.count || 0;
  const avgHours      = stats?.resolutionTime?.avgResolutionHours;

  const tooltipStyle = {
    background: 'hsl(215 12% 14%)',
    border: '1px solid hsl(215 10% 19%)',
    borderRadius: '6px',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    color: 'hsl(213 20% 90%)',
    padding: '6px 10px',
    boxShadow: 'none',
  };

  return (
    <div className="pt-14 lg:pt-0">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Support operations dashboard</p>
        </div>
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          All tickets
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>

      {/* ── KPI row — THE animated moment ───────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6" role="list" aria-label="Key metrics">
        <KpiCard
          title="Total tickets"
          value={totalTickets}
          icon={Ticket}
          index={0}
          aria-label={`Total tickets: ${totalTickets}`}
        />
        <KpiCard
          title="Open"
          value={openCount}
          icon={Activity}
          index={1}
          valueColor="hsl(var(--status-open))"
        />
        <KpiCard
          title="Resolved"
          value={resolvedCount}
          icon={CheckCircle}
          index={2}
          valueColor="hsl(var(--status-resolved))"
        />
        <KpiCard
          title="Stalled >48h"
          value={stalledCount}
          icon={AlertTriangle}
          index={3}
          valueColor={stalledCount > 0 ? 'hsl(var(--priority-high))' : undefined}
          aria-label={`Stalled tickets: ${stalledCount}`}
        />
      </div>

      {/* ── Resolution time + status donut ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {/* Avg resolution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              Avg. resolution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p
              className="stat-value text-3xl text-foreground"
              aria-label={`Average resolution time: ${avgHours !== null && avgHours !== undefined ? `${avgHours.toFixed(1)} hours` : 'Not available'}`}
            >
              {avgHours !== null && avgHours !== undefined
                ? `${avgHours.toFixed(1)}h`
                : <span className="text-muted-foreground">—</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              {stats?.resolutionTime?.resolvedTicketCount || 0} resolved tickets
            </p>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tickets by status</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={stats?.byStatus || []}
                  dataKey="count"
                  nameKey="status"
                  cx="40%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
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
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: '11px', color: 'hsl(217 11% 56%)' }}>{value}</span>
                  )}
                />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Priority chart + stalled tickets ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Tickets by priority</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={stats?.byPriority || []}
                barCategoryGap="35%"
              >
                <CartesianGrid
                  strokeDasharray="2 2"
                  stroke="hsl(215 10% 19%)"
                  vertical={false}
                />
                <XAxis
                  dataKey="priority"
                  tick={{ fill: 'hsl(217 11% 56%)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: 'hsl(217 11% 56%)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(215 10% 19% / 0.6)' }} />
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
            <CardTitle className="flex items-center gap-1.5">
              <AlertTriangle
                className={cn('w-3.5 h-3.5', stalledCount > 0 ? 'text-priority-high' : 'text-muted-foreground')}
                aria-hidden="true"
              />
              Stalled tickets
              <span className="text-2xs font-mono text-muted-foreground ml-auto">&gt;48h open</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {stalledCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle className="w-7 h-7 mb-2 text-status-open/50" aria-hidden="true" />
                <p className="text-sm">No stalled tickets</p>
                <p className="text-xs mt-0.5">Queue is moving normally</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-44 overflow-y-auto scrollbar-thin" role="list" aria-label="Stalled tickets">
                {(stats?.stalledTickets?.tickets || []).map((t: any) => (
                  <Link
                    key={t._id}
                    href={`/dashboard/tickets/${t._id}`}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-md group',
                      'hover:bg-muted/40 transition-colors duration-100',
                      'border-l-2',
                      getPriorityBarClass(t.priority),
                    )}
                    role="listitem"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {t.title}
                      </p>
                      <p className="text-2xs text-muted-foreground font-mono mt-0.5">{t.ageHours?.toFixed(0)}h stalled</p>
                    </div>
                    <span className={cn('text-2xs px-2 py-0.5 rounded-sm ml-3 flex-shrink-0', getPriorityClass(t.priority))}>
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

/* ── KPI Card — the ONE orchestrated animation moment ── */
function KpiCard({
  title,
  value,
  icon: Icon,
  index,
  valueColor,
  ...rest
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  index: number;
  valueColor?: string;
  [key: string]: any;
}) {
  return (
    <div
      className="kpi-reveal panel p-4"
      style={{ animationDelay: `${index * 0.07}s` }}
      role="listitem"
      {...rest}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <Icon className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
      </div>
      <p
        className="stat-value text-2xl"
        style={{ color: valueColor ?? 'hsl(var(--foreground))' }}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

/* ── Non-admin quick-action card ── */
function NonAdminCard({
  title,
  description,
  href,
  icon: Icon,
  isPrimary,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  isPrimary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-start gap-4 p-5 rounded-lg border transition-colors duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isPrimary
          ? 'border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50'
          : 'border-border surface-1 hover:bg-muted/30'
      )}
    >
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
        style={{
          background: isPrimary ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--surface-2))',
        }}
        aria-hidden="true"
      >
        <Icon className={cn('w-4 h-4', isPrimary ? 'text-primary' : 'text-muted-foreground')} />
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </Link>
  );
}
