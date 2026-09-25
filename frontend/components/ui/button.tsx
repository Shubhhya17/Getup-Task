import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/*
 * Button — Meridian design.
 * ONE accent (#2563EB) for default variant. Used sparingly: primary CTA only.
 * All other variants are quiet (white bg + border, or transparent).
 */
const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium',
    'rounded border transition-colors duration-100',
    'focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-[#2563EB] focus-visible:outline-offset-2',
    'disabled:pointer-events-none disabled:opacity-40',
    'active:scale-[0.98]',
  ].join(' '),
  {
    variants: {
      variant: {
        /* The ONE accent color — primary CTA only */
        default:
          'bg-[#2563EB] text-white border-[#2563EB] hover:bg-[#1D4ED8] hover:border-[#1D4ED8]',
        /* Quiet secondary actions */
        outline:
          'bg-white text-[#1A1A1A] border-[#E8E8E5] hover:bg-[#FAFAF9] hover:border-[#D1D1CE]',
        secondary:
          'bg-[#F4F4F2] text-[#1A1A1A] border-[#E8E8E5] hover:bg-[#EBEBEB]',
        ghost:
          'bg-transparent border-transparent text-[#6B6B6B] hover:bg-[#F4F4F2] hover:text-[#1A1A1A]',
        /* Destructive — used sparingly */
        destructive:
          'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] hover:bg-[#FEE2E2]',
        link:
          'bg-transparent border-transparent text-[#2563EB] underline-offset-4 hover:underline p-0 h-auto',
        /* AI suggestion accept — subdued, clearly secondary */
        'ai-accept':
          'bg-white text-[hsl(var(--ai-ink))] border-[hsl(var(--ai-border))] hover:bg-[hsl(var(--ai-surface))] text-xs',
      },
      size: {
        default:    'h-8 px-3.5 text-sm',
        sm:         'h-7 px-2.5 text-xs rounded',
        lg:         'h-10 px-5 text-base',
        icon:       'h-8 w-8 p-0',
        'icon-sm':  'h-7 w-7 p-0',
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
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
