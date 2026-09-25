import * as React from 'react';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'block text-xs font-medium text-[#1A1A1A]',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-40',
      className
    )}
    {...props}
  />
));
Label.displayName = 'Label';

export { Label };
