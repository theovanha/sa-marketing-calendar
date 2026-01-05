'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: 'sm' | 'md';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputSize = 'md', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'input',
          {
            'input-sm': inputSize === 'sm',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
