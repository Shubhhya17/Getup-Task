'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn, getRoleDisplay } from '@/lib/utils';
import {
  LayoutDashboard,
  Ticket,
  Plus,
  Users,
  BarChart3,
  LogOut,
  CircleDot,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',                 label: 'Overview',   icon: LayoutDashboard },
  { href: '/dashboard/tickets',         label: 'Tickets',    icon: Ticket },
  { href: '/dashboard/tickets/new',     label: 'New Ticket', icon: Plus,    roles: ['customer', 'agent', 'admin'] },
  { href: '/dashboard/users',           label: 'Users',      icon: Users,   roles: ['admin'] },
  { href: '/dashboard/analytics',       label: 'Analytics',  icon: BarChart3, roles: ['admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { label: roleLabel, className: roleColor } = getRoleDisplay(user?.role ?? '');

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────── */}
      <aside
        className="fixed left-0 top-0 h-full w-[220px] flex flex-col z-30 hidden lg:flex"
        style={{
          background: 'hsl(var(--surface-1))',
          borderRight: '1px solid hsl(var(--border))',
        }}
      >
        {/* Logo / product identity */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: 'hsl(var(--primary) / 0.15)', border: '1px solid hsl(var(--primary) / 0.25)' }}
              aria-hidden="true"
            >
              <Ticket className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">Getup Support</p>
              <p className="text-2xs text-muted-foreground leading-tight mt-0.5">Support Operations</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-thin"
          aria-label="Main navigation"
        >
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-100',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'nav-active font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-normal'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 py-3 border-t border-border space-y-1">
          {/* User identity */}
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-md"
            style={{ background: 'hsl(var(--surface-2))' }}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-primary font-mono font-semibold text-xs flex-shrink-0"
              style={{ background: 'hsl(var(--primary) / 0.15)' }}
              aria-hidden="true"
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
              <p className={cn('text-2xs', roleColor)}>{roleLabel}</p>
            </div>
            <CircleDot className="w-2 h-2 text-status-open flex-shrink-0" aria-label="Online" />
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className={cn(
              'flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm',
              'text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors duration-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-12 border-b border-border"
        style={{ background: 'hsl(var(--surface-1))' }}
        aria-label="Mobile navigation"
      >
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="font-semibold text-sm">Getup Support</span>
        </div>

        {/* Mobile nav — icon-only */}
        <nav className="flex items-center gap-1" aria-label="Mobile main navigation">
          {visibleItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'p-2 rounded-md transition-colors duration-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              aria-label={item.label}
            >
              <item.icon className="w-4 h-4" aria-hidden="true" />
            </Link>
          ))}
          <button
            onClick={logout}
            className={cn(
              'p-2 rounded-md text-muted-foreground hover:text-destructive transition-colors duration-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      </header>
    </>
  );
}
