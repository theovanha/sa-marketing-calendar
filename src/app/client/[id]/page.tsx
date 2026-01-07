'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Settings } from 'lucide-react';
import { useAppStore, useSelectedBrand } from '@/lib/store';
import { ClientTopBar } from '@/components/ClientTopBar';
import { YearGrid } from '@/components/YearGrid';
import { BrandSettingsModal } from '@/components/BrandSettingsModal';

export default function ClientCalendarPage() {
  const params = useParams();
  const brandId = params.id as string;
  const [showSettings, setShowSettings] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const { selectBrand, brands, isInitialized } = useAppStore();
  const selectedBrand = useSelectedBrand();

  // Select the brand from URL on mount
  useEffect(() => {
    if (!isInitialized) return;
    
    if (brandId) {
      const brand = brands.find((b) => b.id === brandId);
      if (brand) {
        selectBrand(brandId);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    }
  }, [brandId, brands, selectBrand, isInitialized]);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-surface-500">Loading calendar...</div>
      </div>
    );
  }

  // Show not found message if brand doesn't exist
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Calendar Not Found</h1>
          <p className="text-surface-500">This calendar link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (!selectedBrand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-surface-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ClientTopBar 
        brandName={selectedBrand.name}
        brandLogo={selectedBrand.logo}
        brandColor={selectedBrand.primaryColor}
      />

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Brand header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => setShowSettings(true)}
            className="w-12 h-12 rounded flex items-center justify-center text-lg font-bold overflow-hidden hover:ring-2 hover:ring-white/30 transition-all"
            style={{ 
              backgroundColor: selectedBrand.logo ? 'transparent' : selectedBrand.primaryColor,
              color: selectedBrand.primaryColor === '#6b7280' ? '#fff' : '#000'
            }}
            title="Click to edit brand settings"
          >
            {selectedBrand.logo ? (
              <img
                src={selectedBrand.logo}
                alt={selectedBrand.name}
                className="w-full h-full object-cover"
              />
            ) : (
              selectedBrand.name.charAt(0).toUpperCase()
            )}
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{selectedBrand.name}</h1>
            <p className="text-xs text-surface-500 uppercase tracking-wider">
              {useAppStore.getState().selectedYear} Marketing Calendar
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-surface-400 hover:text-white hover:bg-surface-800 rounded transition-colors"
            title="Brand settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Year grid */}
        <YearGrid />
      </main>

      {/* Brand settings modal */}
      <BrandSettingsModal
        brand={selectedBrand}
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

