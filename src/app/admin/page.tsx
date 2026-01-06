'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  Upload,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Calendar,
  GraduationCap,
  Sparkles,
  Sun,
  Loader2,
  Trash2,
  Building2,
} from 'lucide-react';
import { useAppStore, useGlobalEvents, useActiveBrands } from '@/lib/store';
import { Button, Select } from '@/components/ui';
import { loadSADataset, checkDatasetExists } from '@/lib/dataLoader';
import {
  validatePublicHolidays,
  validateSchoolCalendar,
  validateCulturalMoments,
  REQUIRED_SA_HOLIDAYS,
} from '@/lib/schemas';

export default function AdminPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [datasetStatus, setDatasetStatus] = useState<{
    holidays: boolean;
    school: boolean;
    culture: boolean;
    seasons: boolean;
  } | null>(null);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [loadSuccess, setLoadSuccess] = useState(false);

  const { importGlobalEvents, clearGlobalEvents, deleteBrand } = useAppStore();
  const globalEvents = useGlobalEvents();
  const brands = useActiveBrands();
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null);

  const handleDeleteBrand = async (brandId: string, brandName: string) => {
    if (confirm(`Are you sure you want to permanently delete "${brandName}"?\n\nThis will delete:\n• All brand events\n• All month notes\n• All hidden event preferences\n\nThis cannot be undone.`)) {
      setDeletingBrandId(brandId);
      await deleteBrand(brandId);
      setDeletingBrandId(null);
    }
  };

  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 1; y <= currentYear + 2; y++) {
    yearOptions.push(y);
  }

  // Check dataset status on year change
  useEffect(() => {
    checkDatasetExists(selectedYear).then(setDatasetStatus);
  }, [selectedYear]);

  const handleLoadDataset = async () => {
    setLoading(true);
    setLoadErrors([]);
    setLoadSuccess(false);

    const { events, errors } = await loadSADataset(selectedYear);

    if (errors.length > 0) {
      setLoadErrors(errors);
    }

    if (events.length > 0) {
      importGlobalEvents(events);
      setLoadSuccess(true);
    }

    setLoading(false);
  };

  const handleClearDataset = () => {
    if (confirm('Clear all global SA events? Brand-specific events will be preserved.')) {
      clearGlobalEvents();
      setLoadSuccess(false);
    }
  };

  const statusIcon = (status: boolean) =>
    status ? (
      <Check className="w-4 h-4 text-green-400" />
    ) : (
      <X className="w-4 h-4 text-red-400" />
    );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-30 border-b border-surface-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-surface-100">Admin</h1>
                <p className="text-xs text-surface-500">SA Dataset Manager</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Current state */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-surface-200 mb-4">Current State</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-surface-800 rounded-lg">
              <div className="text-2xl font-bold" style={{ color: '#00F59B' }}>{globalEvents.length}</div>
              <div className="text-sm text-surface-400">Global SA events loaded</div>
            </div>
            <div className="p-4 bg-surface-800 rounded-lg">
              <div className="text-2xl font-bold text-surface-200">
                {globalEvents.filter((e) => e.type === 'publicHoliday').length}
              </div>
              <div className="text-sm text-surface-400">Public holidays</div>
            </div>
            <div className="p-4 bg-surface-800 rounded-lg">
              <div className="text-2xl font-bold text-surface-200">{brands.length}</div>
              <div className="text-sm text-surface-400">Active brands</div>
            </div>
          </div>
        </section>

        {/* Brand Management */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-surface-200 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Brand Management
          </h2>
          
          {brands.length === 0 ? (
            <p className="text-sm text-surface-500">No brands created yet.</p>
          ) : (
            <div className="space-y-2">
              {brands.map((brand) => (
                <div
                  key={brand.id}
                  className="flex items-center justify-between p-3 bg-surface-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-sm font-bold"
                      style={{ backgroundColor: brand.primaryColor }}
                    >
                      {brand.logo ? (
                        <img src={brand.logo} alt="" className="w-full h-full object-cover rounded" />
                      ) : (
                        <span className="text-white">{brand.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-200">{brand.name}</p>
                      <p className="text-xs text-surface-500">ID: {brand.id}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBrand(brand.id, brand.name)}
                    disabled={deletingBrandId === brand.id}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    {deletingBrandId === brand.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          <p className="text-xs text-surface-500 mt-4">
            ⚠️ Deleting a brand permanently removes all its events, notes, and settings from the database.
          </p>
        </section>

        {/* Load dataset */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-surface-200 mb-4">Load SA Dataset</h2>

          <div className="space-y-4">
            {/* Year selector */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                Select Year
              </label>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full max-w-xs"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </div>

            {/* Dataset availability */}
            {datasetStatus && (
              <div className="p-4 bg-surface-800 rounded-lg">
                <h3 className="text-sm font-medium text-surface-300 mb-3">
                  Dataset Files for {selectedYear}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {statusIcon(datasetStatus.holidays)}
                    <Calendar className="w-4 h-4 text-holiday" />
                    <span className="text-sm text-surface-400">Public Holidays</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcon(datasetStatus.school)}
                    <GraduationCap className="w-4 h-4 text-school" />
                    <span className="text-sm text-surface-400">School Calendar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcon(datasetStatus.culture)}
                    <Sparkles className="w-4 h-4 text-culture" />
                    <span className="text-sm text-surface-400">Cultural Moments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcon(datasetStatus.seasons)}
                    <Sun className="w-4 h-4 text-season" />
                    <span className="text-sm text-surface-400">Seasons (evergreen)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Load/Clear buttons */}
            <div className="flex gap-3">
              <Button onClick={handleLoadDataset} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Load {selectedYear} Dataset
              </Button>
              <Button variant="secondary" onClick={handleClearDataset} disabled={loading}>
                <RefreshCw className="w-4 h-4" />
                Clear All Global Events
              </Button>
            </div>

            {/* Success message */}
            {loadSuccess && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-300 font-medium">Dataset loaded successfully</p>
                  <p className="text-xs text-green-400/70">
                    {globalEvents.length} events now available for all brands.
                  </p>
                </div>
              </div>
            )}

            {/* Errors */}
            {loadErrors.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-300 font-medium mb-2">Loading issues</p>
                    <ul className="space-y-1">
                      {loadErrors.map((error, index) => (
                        <li key={index} className="text-xs text-red-400/70">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Required holidays reference */}
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-surface-200 mb-4">Required SA Public Holidays</h2>
          <p className="text-sm text-surface-500 mb-4">
            These holidays must be present in the dataset for validation to pass:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {REQUIRED_SA_HOLIDAYS.map((holiday) => (
              <div key={holiday} className="text-sm text-surface-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-holiday" />
                {holiday}
              </div>
            ))}
          </div>
        </section>

        {/* JSON Upload (placeholder for future) */}
        <section className="card p-6 opacity-50">
          <h2 className="text-lg font-semibold text-surface-200 mb-4">Upload Custom JSON</h2>
          <p className="text-sm text-surface-500 mb-4">
            Coming soon: Upload your own JSON files to replace the default dataset.
          </p>
          <div className="border-2 border-dashed border-surface-700 rounded-lg p-8 text-center">
            <Upload className="w-8 h-8 text-surface-600 mx-auto mb-2" />
            <p className="text-sm text-surface-500">Drag and drop JSON files here</p>
          </div>
        </section>
      </main>
    </div>
  );
}

