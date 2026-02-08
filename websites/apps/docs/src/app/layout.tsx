import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@codrag/ui/styles';
import './globals.css';

import { ClientLayout } from './ClientLayout';

export const metadata: Metadata = {
  title: 'CoDRAG Documentation',
  description: 'Documentation for CoDRAG CLI, dashboard, and integrations.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-codrag-theme="k">
      <body className="bg-background text-text selection:bg-primary/20">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
