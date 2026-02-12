import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@codrag/ui/styles';
import './globals.css';

import { ClientLayout } from './ClientLayout';

export const metadata: Metadata = {
  metadataBase: new URL('https://support.codrag.io'),
  title: 'CoDRAG Support',
  description: 'Support hub for CoDRAG: tickets, bugs, questions, and security reporting.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-codrag-theme="k">
      <body className="flex flex-col min-h-screen bg-background text-text selection:bg-primary/20">
        {/* 
          TODO: Analytics (Plausible/Umami)
          <script defer data-domain="support.codrag.io" src="https://plausible.io/js/script.js"></script>
        */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
