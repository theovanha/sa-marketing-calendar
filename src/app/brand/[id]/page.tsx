'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Settings, Share2, Check } from 'lucide-react';
import { useAppStore, useSelectedBrand } from '@/lib/store';
import { TopBar } from '@/components/TopBar';
import { YearGrid } from '@/components/YearGrid';
import { BrandSettingsModal } from '@/components/BrandSettingsModal';
import { Button } from '@/components/ui';

export default function BrandCalendarPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;
  const [showSettings, setShowSettings] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const { selectBrand, brands } = useAppStore();

  const handleShareWithClient = async () => {
    const clientUrl = `${window.location.origin}/client/${brandId}`;
    await navigator.clipboard.writeText(clientUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };
  const selectedBrand = useSelectedBrand();

  // Select the brand from URL on mount
  useEffect(() => {
    if (brandId) {
      const brand = brands.find((b) => b.id === brandId);
      if (brand) {
        selectBrand(brandId);
      } else {
        // Brand not found, redirect to dashboard
        router.push('/dashboard');
      }
    }
  }, [brandId, brands, selectBrand, router]);

  if (!selectedBrand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-surface-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar />

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
            <h1 
              onClick={() => setShowSettings(true)}
              className="text-xl font-bold text-white cursor-pointer hover:text-surface-200 transition-colors"
            >
              {selectedBrand.name}
            </h1>
            <p className="text-xs text-surface-500 uppercase tracking-wider">
              {useAppStore.getState().selectedYear} Marketing Calendar
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShareWithClient}
            className="flex items-center gap-2"
          >
            {linkCopied ? (
              <>
                <Check className="w-4 h-4" style={{ color: '#00F59B' }} />
                <span style={{ color: '#00F59B' }}>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share with Client</span>
              </>
            )}
          </Button>
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

