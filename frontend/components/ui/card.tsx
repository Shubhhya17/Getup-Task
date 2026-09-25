import * as React from 'react';
import { cn } from '@/lib/utils';

/*
 * Card — structural container in the Slate Operations design system.
 * NOT a decorative card: no hover-lift, no uniform shadow.
 * Use it for grouped content that needs visual separation.
 * Surface hierarchy: Card sits at surface-1 by default.
 */

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'surface-1 border border-border rounded-lg shadow-card',
        'text-card-foreground',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1 px-5 pt-5 pb-0', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-sm font-medium text-muted-foreground tracking-wide', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-xs text-muted-foreground mt-0.5', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-5 py-4', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center px-5 pb-5 pt-0 border-t border-border mt-4', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

/* Divider inside a card */
const CardDivider = ({ className }: { className?: string }) => (
  <div className={cn('border-t border-border mx-5', className)} />
);

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardDivider };
