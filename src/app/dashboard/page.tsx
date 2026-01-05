'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, Settings } from 'lucide-react';
import { useAppStore, useActiveBrands } from '@/lib/store';
import { Button } from '@/components/ui';
import { BrandCard } from '@/components/BrandCard';
import { CreateBrandModal } from '@/components/CreateBrandModal';

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const brands = useActiveBrands();
  const archivedBrands = useAppStore((state) => state.brands.filter((b) => b.archived));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-wider text-white">VANHA</span>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#00F59B' }} />
              </div>
              <div className="w-px h-6 bg-surface-700 mx-2" />
              <div>
                <h1 className="text-sm font-medium text-white">Marketing Calendar</h1>
                <p className="text-xs text-surface-500">Performance Marketing + Design Studio</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4" />
                New Brand
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Active brands */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-surface-200">
              Your Brands
              {brands.length > 0 && (
                <span className="ml-2 text-surface-500 font-normal">({brands.length})</span>
              )}
            </h2>
          </div>

          {brands.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-surface-500" />
              </div>
              <h3 className="text-lg font-medium text-surface-300 mb-2">No brands yet</h3>
              <p className="text-surface-500 mb-6 max-w-sm mx-auto">
                Create a brand to see all SA key dates pre-filled—then add your brand moments and campaigns.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4" />
                Create Your First Brand
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {brands.map((brand, index) => (
                <div
                  key={brand.id}
                  className="animate-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <BrandCard brand={brand} />
                </div>
              ))}

              {/* Add new brand card */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="card card-hover p-5 border-dashed border-2 border-surface-700 flex flex-col items-center justify-center gap-3 min-h-[160px] text-surface-500 hover:text-surface-300 hover:border-surface-600"
              >
                <div className="w-12 h-12 rounded-lg bg-surface-800 flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium">Add Brand</span>
              </button>
            </div>
          )}
        </section>

        {/* Archived brands */}
        {archivedBrands.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold text-surface-400 mb-6">
              Archived
              <span className="ml-2 text-surface-500 font-normal">({archivedBrands.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {archivedBrands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </div>
          </section>
        )}

        {/* Quick info section */}
        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold text-surface-200 mb-2">🇿🇦 SA Dates Pre-loaded</h3>
            <p className="text-sm text-surface-500">
              Public holidays, Valentine's Day, Mother's Day, Easter, Black Friday, school terms—all ready to go.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-surface-200 mb-2">📅 12-Month View</h3>
            <p className="text-sm text-surface-500">
              See the entire year at a glance. Key dates and school terms are already filled in for you.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-surface-200 mb-2">🚀 Add Your Campaigns</h3>
            <p className="text-sm text-surface-500">
              Add brand moments and campaign flights. Get smart prompts for lead times and creative angles.
            </p>
          </div>
        </section>
      </main>

      {/* Create brand modal */}
      <CreateBrandModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}

