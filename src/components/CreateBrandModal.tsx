'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Modal, Button, Input } from './ui';

interface CreateBrandModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateBrandModal({ open, onClose }: CreateBrandModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const { createBrand, selectBrand } = useAppStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const brand = createBrand(name.trim());
    selectBrand(brand.id);
    setName('');
    onClose();
    router.push(`/brand/${brand.id}`);
  };

  return (
    <Modal open={open} onClose={onClose} title="Create New Brand">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
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

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} className="flex-1">
              Create Brand
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}


