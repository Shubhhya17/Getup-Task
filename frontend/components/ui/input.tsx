import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-8 w-full rounded border border-[#E8E8E5] bg-white',
        'px-3 py-1.5 text-sm text-[#1A1A1A] placeholder:text-[#A1A1A1]',
        'transition-colors duration-100',
        'focus-visible:outline-none focus-visible:border-[#2563EB] focus-visible:ring-2 focus-visible:ring-[#2563EB]/15',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-[#F4F4F2]',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
