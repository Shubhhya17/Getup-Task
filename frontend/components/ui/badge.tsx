import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/*
 * Badge — inline status/label indicator.
 * All variants carry both color AND text for WCAG AA accessibility.
 * No color-only badges: icons or text shape accompany every color signal.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-2xs font-medium transition-colors duration-150 border',
  {
    variants: {
      variant: {
        default:   'bg-primary/10 text-primary border-primary/25',
        secondary: 'bg-muted text-muted-foreground border-border',
        outline:   'border-border text-muted-foreground',
        /* Status */
        'status-open':     'badge-status-open',
        'status-progress': 'badge-status-progress',
        'status-resolved': 'badge-status-resolved',
        'status-closed':   'badge-status-closed',
        /* Priority */
        'priority-low':      'badge-low',
        'priority-medium':   'badge-medium',
        'priority-high':     'badge-high',
        'priority-critical': 'badge-critical',
        /* Destructive */
        destructive: 'bg-destructive/10 text-destructive border-destructive/25',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
