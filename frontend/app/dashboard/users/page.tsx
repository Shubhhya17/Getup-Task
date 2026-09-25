'use client';

import { useEffect, useState } from 'react';
import { userApi, User } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, timeAgo, getRoleDisplay } from '@/lib/utils';
import { Users, Shield, Headphones, User as UserIcon, Loader2 } from 'lucide-react';

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: Shield,
    badgeClass: 'text-[hsl(var(--priority-high))] bg-[hsl(var(--priority-high)/0.1)] border border-[hsl(var(--priority-high)/0.25)]',
  },
  agent: {
    label: 'Agent',
    icon: Headphones,
    badgeClass: 'text-[hsl(var(--status-resolved))] bg-[hsl(var(--status-resolved)/0.1)] border border-[hsl(var(--status-resolved)/0.25)]',
  },
  customer: {
    label: 'Customer',
    icon: UserIcon,
    badgeClass: 'text-muted-foreground border border-border',
  },
} as const;

export default function UsersPage() {
  const [users, setUsers]       = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    userApi
      .getAll()
      .then((res) => setUsers(res.data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const roleGroups = {
    admin:    users.filter((u) => u.role === 'admin'),
    agent:    users.filter((u) => u.role === 'agent'),
    customer: users.filter((u) => u.role === 'customer'),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] pt-14 lg:pt-0">
        <Loader2 className="w-5 h-5 animate-spin text-primary" aria-label="Loading users…" />
      </div>
    );
  }

  return (
    <div className="pt-14 lg:pt-0">
      <div className="mb-5 pt-2">
        <h1 className="text-xl font-semibold text-foreground">Users</h1>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
          {users.length} total across all roles
        </p>
      </div>

      {/* ── Role summary ── */}
      <div className="grid grid-cols-3 gap-3 mb-6" role="list" aria-label="User role counts">
        {(Object.entries(roleGroups) as [keyof typeof ROLE_CONFIG, User[]][]).map(([role, roleUsers]) => {
          const config = ROLE_CONFIG[role];
          return (
            <Card key={role} role="listitem">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center"
                    style={{ background: 'hsl(var(--surface-2))' }}
                    aria-hidden="true"
                  >
                    <config.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p
                      className="stat-value text-xl text-foreground"
                      aria-label={`${roleUsers.length} ${config.label}s`}
                    >
                      {roleUsers.length}
                    </p>
                    <p className="text-2xs text-muted-foreground">{config.label}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── User table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            All users
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-0 overflow-x-auto">
          <table className="w-full" aria-label="User directory">
            <thead>
              <tr className="border-b border-border">
                {['User', 'Email', 'Role', 'Joined'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="text-left text-2xs font-medium text-muted-foreground pb-2.5 pr-5 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => {
                const config = ROLE_CONFIG[u.role as keyof typeof ROLE_CONFIG];
                return (
                  <tr
                    key={u._id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* Name + avatar */}
                    <td className="py-3 pr-5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-semibold text-xs text-primary flex-shrink-0"
                          style={{ background: 'hsl(var(--primary) / 0.12)' }}
                          aria-hidden="true"
                        >
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-foreground">{u.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 pr-5">
                      <span className="text-xs text-muted-foreground font-mono">{u.email}</span>
                    </td>

                    {/* Role badge */}
                    <td className="py-3 pr-5">
                      {config && (
                        <span className={cn('text-2xs px-2 py-0.5 rounded-sm font-medium', config.badgeClass)}>
                          {config.label}
                        </span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="py-3">
                      <span className="text-xs text-muted-foreground font-mono">
                        {u.createdAt ? timeAgo(u.createdAt) : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
