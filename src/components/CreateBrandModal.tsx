'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Modal, Button, Input } from './ui';
import { CountryCode, COUNTRY_OPTIONS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CreateBrandModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateBrandModal({ open, onClose }: CreateBrandModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<CountryCode[]>(['za']);
  const { createBrand, selectBrand } = useAppStore();

  const toggleCountry = (code: CountryCode) => {
    setSelectedCountries(prev => {
      if (prev.includes(code)) {
        // Don't allow removing all countries
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== code);
      }
      return [...prev, code];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedCountries.length === 0) return;

    const brand = await createBrand(name.trim(), selectedCountries);
    selectBrand(brand.id);
    setName('');
    setSelectedCountries(['za']);
    onClose();
    router.push(`/brand/${brand.id}`);
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Brand">
      <form onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">
              Brand Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter brand name..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-2">
              Key Events Countries
            </label>
            <p className="text-xs text-surface-500 mb-3">
              Select which countries' holidays and cultural moments to show
            </p>
            <div className="grid grid-cols-2 gap-2">
              {COUNTRY_OPTIONS.map(({ code, label, description }) => {
                const isSelected = selectedCountries.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleCountry(code)}
                    className={cn(
                      'flex items-start gap-2 p-3 rounded-lg border text-left transition-all',
                      isSelected
                        ? 'border-[#00F59B] bg-[#00F59B]/10'
                        : 'border-surface-700 hover:border-surface-600 bg-surface-800/50'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5',
                        isSelected
                          ? 'bg-[#00F59B] border-[#00F59B]'
                          : 'border-surface-600'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-black" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'text-sm font-medium',
                        isSelected ? 'text-white' : 'text-surface-300'
                      )}>
                        {label}
                      </div>
                      <div className="text-xs text-surface-500 truncate">
                        {description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || selectedCountries.length === 0} 
              className="flex-1"
            >
              Create Brand
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
