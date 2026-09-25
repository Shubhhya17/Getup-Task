import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex w-full rounded border border-[#E8E8E5] bg-white',
      'px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#A1A1A1]',
      'resize-y min-h-[80px]',
      'transition-colors duration-100',
      'focus-visible:outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/15',
      'disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-[#F4F4F2]',
      className
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
