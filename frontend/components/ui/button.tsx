import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium',
    'transition-colors duration-100',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.98]',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/85',
        destructive:
          'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-muted/60',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        ghost:
          'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        link:
          'text-primary underline-offset-4 hover:underline h-auto p-0',
        /* Action that accepts an AI suggestion */
        'ai-accept':
          'bg-[hsl(var(--ai-surface))] text-[hsl(var(--ai-ink))] border border-[hsl(var(--ai-border))] hover:bg-[hsl(var(--primary)/0.1)] hover:text-primary hover:border-[hsl(var(--primary)/0.4)] text-xs',
      },
      size: {
        default: 'h-9 px-3.5 py-2',
        sm:      'h-7 rounded-sm px-2.5 text-xs',
        lg:      'h-10 px-5 text-base',
        icon:    'h-9 w-9',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
