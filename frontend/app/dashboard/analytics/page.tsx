'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingDown, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { cn, getStatusColor, getPriorityColor, getStatusClass, getPriorityClass, getPriorityBarClass } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const [stats, setStats]     = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .getStats()
      .then((res) => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] pt-14 lg:pt-0">
        <Loader2 className="w-5 h-5 animate-spin text-primary" aria-label="Loading analytics…" />
      </div>
    );
  }

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

  const axisStyle = {
    fill: 'hsl(217 11% 56%)',
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
  };

  return (
    <div className="pt-14 lg:pt-0">
      <div className="mb-6 pt-2">
        <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Ticket volume and resolution performance</p>
      </div>

      {/* ── Resolution metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6" role="list" aria-label="Resolution metrics">
        {[
          {
            label: 'Avg resolution',
            value: stats?.resolutionTime?.avgResolutionHours?.toFixed(1),
            icon: Clock,
            color: 'hsl(var(--status-resolved))',
          },
          {
            label: 'Fastest resolution',
            value: stats?.resolutionTime?.minResolutionHours?.toFixed(1),
            icon: TrendingUp,
            color: 'hsl(var(--priority-low))',
          },
          {
            label: 'Slowest resolution',
            value: stats?.resolutionTime?.maxResolutionHours?.toFixed(1),
            icon: TrendingDown,
            color: 'hsl(var(--priority-high))',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} role="listitem">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Icon className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
              </div>
              <p
                className="stat-value text-2xl"
                style={{ color: value ? color : 'hsl(var(--muted-foreground))' }}
                aria-label={`${label}: ${value ?? 'not available'} hours`}
              >
                {value ?? '—'}
                {value && (
                  <span className="text-xs font-sans font-normal text-muted-foreground ml-1">h</span>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
        {/* Status donut */}
        <Card>
          <CardHeader>
            <CardTitle>Status distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats?.byStatus || []}
                  dataKey="count"
                  nameKey="status"
                  cx="40%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
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
                  formatter={(v) => <span style={{ fontSize: '11px', color: 'hsl(217 11% 56%)' }}>{v}</span>}
                />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority horizontal bar */}
        <Card>
          <CardHeader>
            <CardTitle>Priority distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats?.byPriority || []} layout="vertical" barCategoryGap="30%">
                <CartesianGrid strokeDasharray="2 2" stroke="hsl(215 10% 19%)" vertical={true} horizontal={false} />
                <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="priority" tick={axisStyle} width={58} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(215 10% 19% / 0.5)' }} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {(stats?.byPriority || []).map((entry: any) => (
                    <Cell key={entry.priority} fill={getPriorityColor(entry.priority)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Stalled tickets table ── */}
      {stats?.stalledTickets?.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-priority-high" aria-hidden="true" />
              {stats.stalledTickets.count} stalled tickets
              <span className="text-2xs font-mono text-muted-foreground ml-auto">Open &gt; 48h</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Stalled tickets table">
                <thead>
                  <tr className="border-b border-border">
                    {['Title', 'Priority', 'Age', 'Assigned to'].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="text-left text-2xs font-medium text-muted-foreground pb-2 pr-5 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.stalledTickets.tickets.map((t: any) => (
                    <tr
                      key={t._id}
                      className={cn('border-b border-border/50 hover:bg-muted/30 transition-colors', getPriorityBarClass(t.priority))}
                    >
                      <td className="py-2.5 pr-5">
                        <Link
                          href={`/dashboard/tickets/${t._id}`}
                          className="text-xs font-medium text-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="line-clamp-1 max-w-[200px] block">{t.title}</span>
                        </Link>
                      </td>
                      <td className="py-2.5 pr-5">
                        <span className={cn('text-2xs px-1.5 py-0.5 rounded-sm', getPriorityClass(t.priority))}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-2.5 pr-5">
                        <span className="text-xs font-mono text-priority-high">{t.ageHours?.toFixed(0)}h</span>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {t.agentName || 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
