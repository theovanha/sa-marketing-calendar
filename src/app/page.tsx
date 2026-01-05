'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const selectedBrandId = useAppStore((state) => state.selectedBrandId);

  useEffect(() => {
    // Redirect to dashboard or last selected brand
    if (selectedBrandId) {
      router.push(`/brand/${selectedBrandId}`);
    } else {
      router.push('/dashboard');
    }
  }, [selectedBrandId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-surface-500">Loading...</div>
    </div>
  );
}
