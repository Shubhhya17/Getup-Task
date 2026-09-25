'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn, getRoleDisplay } from '@/lib/utils';
import { LogOut, ArrowLeft } from 'lucide-react';

/*
 * Sidebar — Meridian design.
 *
 * Navigation indicators:
 *   Active:   accent blue bg + right border + medium weight text
 *   Inactive: transparent bg, muted text
 *
 * Icons: ONLY LogOut (navigation meaning) and ArrowLeft (back).
 * Role/product identification: typographic only.
 * Nav items: text labels with a subtle left border treatment when active.
 */

interface NavItem {
  href: string;
  label: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',             label: 'Overview' },
  { href: '/dashboard/tickets',     label: 'Tickets' },
  { href: '/dashboard/tickets/new', label: 'New Ticket',  roles: ['customer', 'admin'] },
  { href: '/dashboard/users',       label: 'Users',       roles: ['admin'] },
  { href: '/dashboard/analytics',   label: 'Analytics',   roles: ['admin'] },
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
      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside
        className="fixed left-0 top-0 h-full w-[200px] flex flex-col z-30 hidden lg:flex"
        style={{
          background: '#FFFFFF',
          borderRight: '1px solid #E8E8E5',
        }}
        aria-label="Application sidebar"
      >
        {/* Product identity — typography only */}
        <div
          className="px-5 py-5"
          style={{ borderBottom: '1px solid #E8E8E5' }}
        >
          <p
            className="text-sm font-semibold text-[#1A1A1A] leading-tight"
            aria-label="Getup Support"
          >
            Getup Support
          </p>
          <p className="text-xs text-[#6B6B6B] mt-0.5">Operations Portal</p>
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
                  'block px-3 py-2 rounded text-sm transition-colors duration-100',
                  'focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-[#2563EB]',
                  isActive
                    ? 'nav-active'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FAFAF9]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 py-3" style={{ borderTop: '1px solid #E8E8E5' }}>
          {/* User identity */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded bg-[#FAFAF9]">
            {/* Avatar — typographic initial */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-semibold text-xs text-[#2563EB] flex-shrink-0"
              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
              aria-hidden="true"
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#1A1A1A] truncate">{user?.name}</p>
              <p className={cn('text-xs leading-tight', roleColor)}>{roleLabel}</p>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={logout}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 rounded text-sm',
              'text-[#6B6B6B] hover:text-[#B91C1C] hover:bg-[#FEF2F2]',
              'transition-colors duration-100',
              'focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-[#2563EB]'
            )}
            aria-label="Sign out"
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ────────────────────────────────────────── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-30 h-12 flex items-center justify-between px-4"
        style={{
          background: '#FFFFFF',
          borderBottom: '1px solid #E8E8E5',
        }}
        aria-label="Mobile navigation"
      >
        <p className="text-sm font-semibold text-[#1A1A1A]">Getup Support</p>

        <nav className="flex items-center gap-1" aria-label="Mobile navigation links">
          {visibleItems.slice(0, 4).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-2.5 py-1.5 rounded text-xs transition-colors duration-100',
                  'focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-[#2563EB]',
                  isActive
                    ? 'text-[#2563EB] bg-[#EFF6FF] font-medium'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F4F4F2]'
                )}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="p-1.5 rounded text-[#6B6B6B] hover:text-[#B91C1C] transition-colors"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </nav>
      </header>
    </>
  );
}
