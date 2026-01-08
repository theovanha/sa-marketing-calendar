'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  selectSize?: 'sm' | 'md';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, selectSize = 'md', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'input appearance-none cursor-pointer',
          'bg-no-repeat bg-right',
          {
            'input-sm': selectSize === 'sm',
          },
          className
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 0.75rem center',
          paddingRight: '2.5rem',
        }}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';




