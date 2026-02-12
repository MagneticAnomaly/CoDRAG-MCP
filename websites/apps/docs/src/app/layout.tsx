import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@codrag/ui/styles';
import './globals.css';

import { ClientLayout } from './ClientLayout';

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.codrag.io'),
  title: 'CoDRAG Documentation',
  description: 'Documentation for CoDRAG CLI, dashboard, and integrations.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-codrag-theme="k">
      <body className="bg-background text-text selection:bg-primary/20">
        {/* 
          TODO: Analytics (Plausible/Umami)
          <script defer data-domain="docs.codrag.io" src="https://plausible.io/js/script.js"></script>
        */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
