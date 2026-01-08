import type { Metadata } from 'next';
import './globals.css';
import { DataAutoLoader } from '@/components/DataAutoLoader';
import { UndoToast } from '@/components/UndoToast';
import { DebugPanel } from '@/components/DebugPanel';
import { InteractionDebugger } from '@/components/InteractionDebugger';

export const metadata: Metadata = {
  title: 'SA Marketing Calendar',
  description: '12-month South African performance marketing calendar for agencies',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <DataAutoLoader />
        {children}
        <UndoToast />
        <DebugPanel />
        <InteractionDebugger />
      </body>
    </html>
  );
}
