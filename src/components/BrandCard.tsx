'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Archive, Trash2, MoreVertical, Settings, Link, Check } from 'lucide-react';
import { Brand } from '@/lib/types';
import { useAppStore } from '@/lib/store';
import { Button } from './ui';
import { BrandSettingsModal } from './BrandSettingsModal';
import { cn } from '@/lib/utils';

interface BrandCardProps {
  brand: Brand;
}

export function BrandCard({ brand }: BrandCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { selectBrand, archiveBrand, deleteBrand } = useAppStore();

  const handleOpen = () => {
    selectBrand(brand.id);
    router.push(`/brand/${brand.id}`);
  };

  const handleCopyClientLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const clientUrl = `${window.location.origin}/client/${brand.id}`;
    await navigator.clipboard.writeText(clientUrl);
    setLinkCopied(true);
    setTimeout(() => {
      setLinkCopied(false);
      setShowMenu(false);
    }, 1500);
  };

  const handleArchive = () => {
    archiveBrand(brand.id);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${brand.name}" and all its events? This cannot be undone.`)) {
      deleteBrand(brand.id);
    }
    setShowMenu(false);
  };

  return (
    <div
      onClick={brand.archived ? undefined : handleOpen}
      className={cn(
        'card card-hover p-5 relative group',
        brand.archived && 'opacity-60',
        !brand.archived && 'cursor-pointer'
      )}
    >
      {/* Brand color indicator */}
      <div
        className="absolute top-0 left-0 w-full h-1 rounded-t-xl"
        style={{ backgroundColor: brand.primaryColor }}
      />

      <div className="flex items-start justify-between mt-2">
        <div className="flex items-center gap-3">
          {/* Brand logo or initial */}
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold overflow-hidden"
            style={{ 
              backgroundColor: brand.logo ? 'transparent' : brand.primaryColor,
              color: brand.primaryColor === '#6b7280' ? '#fff' : '#000'
            }}
          >
            {brand.logo ? (
              <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
            ) : (
              brand.name.charAt(0).toUpperCase()
            )}
          </div>

          <div>
            <h3 className="font-semibold text-surface-100">{brand.name}</h3>
            <p className="text-xs text-surface-500">
              {brand.archived ? 'Archived' : 'Active'}
            </p>
          </div>
        </div>

        {/* Menu button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-surface-800 border border-surface-700 rounded-lg shadow-xl py-1 min-w-[160px]">
                <button
                  onClick={handleCopyClientLink}
                  className="w-full px-3 py-2 text-left text-sm text-surface-300 hover:bg-surface-700 flex items-center gap-2"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4" style={{ color: '#00F59B' }} />
                      <span style={{ color: '#00F59B' }}>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4" />
                      Copy Client Link
                    </>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setShowSettings(true);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-surface-300 hover:bg-surface-700 flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                {!brand.archived && (
                  <button
                    onClick={handleArchive}
                    className="w-full px-3 py-2 text-left text-sm text-surface-300 hover:bg-surface-700 flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-surface-700 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Open calendar button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleOpen();
        }}
        className="w-full mt-4"
        disabled={brand.archived}
      >
        <Calendar className="w-4 h-4" />
        Open Calendar
      </Button>

      {/* Brand settings modal */}
      <BrandSettingsModal
        brand={brand}
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}

