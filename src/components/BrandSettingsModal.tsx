'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Brand, CountryCode, COUNTRY_OPTIONS } from '@/lib/types';
import { BRAND_COLORS, cn } from '@/lib/utils';

interface BrandSettingsModalProps {
  brand: Brand;
  open: boolean;
  onClose: () => void;
}

interface CountryToggleConfirmProps {
  country: typeof COUNTRY_OPTIONS[0];
  onConfirm: (clearHidden: boolean) => void;
  onCancel: () => void;
}

function CountryToggleConfirm({ country, onConfirm, onCancel }: CountryToggleConfirmProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-surface-800 border border-surface-600 rounded-lg p-5 max-w-sm shadow-2xl">
        <h3 className="text-white font-semibold mb-2">Add {country.label} Events?</h3>
        <p className="text-sm text-surface-400 mb-4">
          You previously hid some events from {country.label}. What would you like to do?
        </p>
        <div className="space-y-2">
          <button
            onClick={() => onConfirm(true)}
            className="w-full py-2 px-3 text-sm bg-[#00F59B] text-black font-medium rounded hover:bg-[#00F59B]/90 transition-colors"
          >
            Show all events (reset hidden)
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="w-full py-2 px-3 text-sm bg-surface-700 text-surface-200 rounded hover:bg-surface-600 transition-colors"
          >
            Keep previously hidden events hidden
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2 px-3 text-sm text-surface-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function BrandSettingsModal({ brand, open, onClose }: BrandSettingsModalProps) {
  const { updateBrand, clearHiddenEventsForCountry } = useAppStore();
  const [brandName, setBrandName] = useState(brand.name);
  const [selectedColor, setSelectedColor] = useState(brand.primaryColor);
  const [logoPreview, setLogoPreview] = useState(brand.logo || '');
  const [selectedCountries, setSelectedCountries] = useState<CountryCode[]>(brand.countries || ['za']);
  const [pendingCountry, setPendingCountry] = useState<typeof COUNTRY_OPTIONS[0] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or brand changes
  useEffect(() => {
    if (open) {
      setBrandName(brand.name);
      setSelectedColor(brand.primaryColor);
      setLogoPreview(brand.logo || '');
      setSelectedCountries(brand.countries || ['za']);
    }
  }, [open, brand]);

  if (!open) return null;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const toggleCountry = (code: CountryCode) => {
    if (selectedCountries.includes(code)) {
      // Removing a country - just do it (if not the last one)
      if (selectedCountries.length === 1) return;
      setSelectedCountries(prev => prev.filter(c => c !== code));
    } else {
      // Adding a country - check if we need to show the prompt
      const country = COUNTRY_OPTIONS.find(c => c.code === code);
      if (country) {
        // For simplicity, always show the prompt when adding a country
        // In a real app, we'd check if there are hidden events for this country
        setPendingCountry(country);
      }
    }
  };

  const handleCountryConfirm = (clearHidden: boolean) => {
    if (!pendingCountry) return;
    
    if (clearHidden && clearHiddenEventsForCountry) {
      clearHiddenEventsForCountry(brand.id, pendingCountry.code);
    }
    
    setSelectedCountries(prev => [...prev, pendingCountry.code]);
    setPendingCountry(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 500KB)
    if (file.size > 500 * 1024) {
      alert('Image too large. Please use an image under 500KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!brandName.trim()) return;
    updateBrand(brand.id, {
      name: brandName.trim(),
      primaryColor: selectedColor,
      logo: logoPreview || undefined,
      countries: selectedCountries,
    });
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div 
          className="bg-surface-900 border border-surface-700 rounded-lg w-full max-w-md shadow-2xl my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-800">
            <h2 className="text-lg font-semibold text-white">Brand Settings</h2>
            <button
              onClick={onClose}
              className="p-1 text-surface-400 hover:text-white hover:bg-surface-800 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Brand Name Section */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Brand Name
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-[#00F59B] focus:border-transparent"
                placeholder="Enter brand name"
              />
            </div>

            {/* Countries Section */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">
                Key Events Countries
              </label>
              <p className="text-xs text-surface-500 mb-3">
                Select which countries' holidays and events to show
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
                        'flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all',
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
                          'text-xs font-medium',
                          isSelected ? 'text-white' : 'text-surface-300'
                        )}>
                          {label}
                        </div>
                        <div className="text-[10px] text-surface-500 truncate">
                          {description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logo Section */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-3">
                Brand Logo
              </label>
              <div className="flex items-center gap-4">
                {/* Logo preview */}
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-xl font-bold overflow-hidden"
                  style={{ backgroundColor: logoPreview ? 'transparent' : selectedColor }}
                >
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span style={{ color: selectedColor === '#6b7280' ? '#fff' : '#000' }}>
                      {brand.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Upload controls */}
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-surface-800 text-surface-300 hover:text-white rounded transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload logo
                  </button>
                  {logoPreview && (
                    <button
                      onClick={handleRemoveLogo}
                      className="text-xs text-surface-500 hover:text-red-400 transition-colors"
                    >
                      Remove logo
                    </button>
                  )}
                  <p className="text-xs text-surface-500">Max 500KB, square recommended</p>
                </div>
              </div>
            </div>

            {/* Color Section */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-3">
                Brand Color
              </label>
              <div className="grid grid-cols-6 gap-2">
                {BRAND_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    className="w-10 h-10 rounded-lg relative transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                  >
                    {selectedColor === color && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check 
                          className="w-5 h-5" 
                          style={{ color: color === '#6b7280' ? '#fff' : '#000' }}
                        />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Custom color input */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-surface-500">Custom:</span>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-24 text-xs bg-surface-800 border border-surface-700 rounded px-2 py-1 text-surface-300 font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-5 py-4 border-t border-surface-800">
            <button
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium bg-surface-800 text-surface-300 hover:text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 text-sm font-semibold rounded"
              style={{ backgroundColor: '#00F59B', color: '#000' }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Country toggle confirmation dialog */}
      {pendingCountry && (
        <CountryToggleConfirm
          country={pendingCountry}
          onConfirm={handleCountryConfirm}
          onCancel={() => setPendingCountry(null)}
        />
      )}
    </>
  );
}
