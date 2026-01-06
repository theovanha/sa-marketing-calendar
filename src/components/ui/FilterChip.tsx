'use client';

import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}

export function FilterChip({ label, active, onClick, color }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'filter-chip',
        active && 'filter-chip-active'
      )}
      style={active && color ? { borderColor: color, color: color } : undefined}
    >
      {label}
    </button>
  );
}



