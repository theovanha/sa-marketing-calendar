'use client';

import { useState, useRef } from 'react';
import { X, Upload, Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Brand } from '@/lib/types';
import { BRAND_COLORS } from '@/lib/utils';

interface BrandSettingsModalProps {
  brand: Brand;
  open: boolean;
  onClose: () => void;
}

export function BrandSettingsModal({ brand, open, onClose }: BrandSettingsModalProps) {
  const { updateBrand } = useAppStore();
  const [selectedColor, setSelectedColor] = useState(brand.primaryColor);
  const [logoPreview, setLogoPreview] = useState(brand.logo || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
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
    updateBrand(brand.id, {
      primaryColor: selectedColor,
      logo: logoPreview || undefined,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-surface-900 border border-surface-700 rounded-lg w-full max-w-md shadow-2xl"
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
          <div className="px-5 py-4 space-y-6">
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
    </>
  );
}



