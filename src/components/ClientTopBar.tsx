'use client';

import { useRouter } from 'next/navigation';
import {
  Search,
  Flag,
  GraduationCap,
  Sun,
  Target,
  Rocket,
  Clock,
} from 'lucide-react';
import { useAppStore, useSelectedBrand } from '@/lib/store';
import { Input, FilterChip, Select } from './ui';

interface ClientTopBarProps {
  brandName: string;
  brandLogo?: string;
  brandColor: string;
}

export function ClientTopBar({ brandName, brandLogo, brandColor }: ClientTopBarProps) {
  const {
    selectedYear,
    setSelectedYear,
    searchQuery,
    setSearchQuery,
    filters,
    toggleFilter,
  } = useAppStore();

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 1; y <= currentYear + 2; y++) {
    yearOptions.push(y);
  }

  const filterItems = [
    { key: 'brandDates' as const, label: 'Brand', icon: Target, color: '#FFFFFF' },
    { key: 'campaignFlights' as const, label: 'Campaigns', icon: Rocket, color: '#FFFFFF' },
    { key: 'deadlines' as const, label: 'Deadlines', icon: Clock, color: '#ef4444' },
    { key: 'keyDates' as const, label: 'Key Dates', icon: Flag, color: '#00F59B' },
    { key: 'school' as const, label: 'School', icon: GraduationCap, color: '#8B5CF6' },
    { key: 'seasons' as const, label: 'Seasons', icon: Sun, color: '#22D3EE' },
  ];

  return (
    <header className="glass sticky top-0 z-30 border-b border-surface-800">
      <div className="px-6 py-3">
        {/* Top row: Brand display (no switcher), Year, Search */}
        <div className="flex items-center gap-4 mb-3">
          {/* Brand display (static, no dropdown) */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-800 border border-surface-700">
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
              style={{ 
                backgroundColor: brandLogo ? 'transparent' : brandColor,
                color: brandColor === '#6b7280' ? '#fff' : '#000'
              }}
            >
              {brandLogo ? (
                <img src={brandLogo} alt="" className="w-full h-full object-cover" />
              ) : (
                brandName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-sm font-medium text-surface-200 truncate">
              {brandName}
            </span>
          </div>

          {/* Year switcher */}
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            selectSize="sm"
            className="w-[100px]"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              inputSize="sm"
              className="pl-9"
            />
          </div>

          {/* Client view indicator */}
          <div className="ml-auto text-xs text-surface-500 uppercase tracking-wider">
            Client View
          </div>
        </div>

        {/* Bottom row: Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {filterItems.map(({ key, label, color }) => (
            <FilterChip
              key={key}
              label={label}
              active={filters[key]}
              onClick={() => toggleFilter(key)}
              color={color}
            />
          ))}
        </div>
      </div>
    </header>
  );
}


