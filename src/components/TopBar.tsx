'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  Search,
  Calendar,
  Flag,
  GraduationCap,
  Sun,
  Target,
  Rocket,
  Clock,
} from 'lucide-react';
import { useAppStore, useActiveBrands, useSelectedBrand } from '@/lib/store';
import { Input, FilterChip, Select } from './ui';
import { cn } from '@/lib/utils';

export function TopBar() {
  const router = useRouter();
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const brands = useActiveBrands();
  const selectedBrand = useSelectedBrand();
  const {
    selectedYear,
    setSelectedYear,
    searchQuery,
    setSearchQuery,
    filters,
    toggleFilter,
    selectBrand,
  } = useAppStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setBrandDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBrandSelect = (brandId: string) => {
    selectBrand(brandId);
    setBrandDropdownOpen(false);
    router.push(`/brand/${brandId}`);
  };

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 1; y <= currentYear + 2; y++) {
    yearOptions.push(y);
  }

  const filterItems = [
    { key: 'keyDates' as const, label: 'Key Dates', icon: Flag, color: '#00F59B' },
    { key: 'school' as const, label: 'School', icon: GraduationCap, color: '#8B5CF6' },
    { key: 'seasons' as const, label: 'Seasons', icon: Sun, color: '#22D3EE' },
    { key: 'brandDates' as const, label: 'Brand', icon: Target, color: '#FFFFFF' },
    { key: 'campaignFlights' as const, label: 'Campaigns', icon: Rocket, color: '#FFFFFF' },
    { key: 'deadlines' as const, label: 'Deadlines', icon: Clock, color: '#ef4444' },
  ];

  return (
    <header className="glass sticky top-0 z-30 border-b border-surface-800">
      <div className="px-6 py-3">
        {/* Top row: Brand switcher, Year, Search, Add */}
        <div className="flex items-center gap-4 mb-3">
          {/* VANHA Logo / Home button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
          >
            <span className="text-lg font-bold tracking-wider text-white">VANHA</span>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00F59B' }} />
          </button>
          
          <div className="w-px h-5 bg-surface-700" />

          {/* Brand switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-800 border border-surface-700',
                'hover:border-surface-600 transition-colors min-w-[180px]'
              )}
            >
              {selectedBrand ? (
                <>
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                    style={{ 
                      backgroundColor: selectedBrand.logo ? 'transparent' : selectedBrand.primaryColor,
                      color: selectedBrand.primaryColor === '#6b7280' ? '#fff' : '#000'
                    }}
                  >
                    {selectedBrand.logo ? (
                      <img src={selectedBrand.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      selectedBrand.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-sm font-medium text-surface-200 truncate">
                    {selectedBrand.name}
                  </span>
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5 text-surface-500" />
                  <span className="text-sm text-surface-500">Select brand...</span>
                </>
              )}
              <ChevronDown className="w-4 h-4 text-surface-500 ml-auto" />
            </button>

            {brandDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full min-w-[220px] bg-surface-800 border border-surface-700 rounded-lg shadow-xl z-50 py-1 max-h-[300px] overflow-y-auto">
                {brands.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-surface-500 text-center">
                    No brands yet
                  </div>
                ) : (
                  brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => handleBrandSelect(brand.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-700',
                        selectedBrand?.id === brand.id && 'bg-surface-700'
                      )}
                    >
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden"
                        style={{ 
                          backgroundColor: brand.logo ? 'transparent' : brand.primaryColor,
                          color: brand.primaryColor === '#6b7280' ? '#fff' : '#000'
                        }}
                      >
                        {brand.logo ? (
                          <img src={brand.logo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          brand.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm text-surface-200 truncate">{brand.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
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

