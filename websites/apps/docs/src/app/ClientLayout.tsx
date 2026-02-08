"use client";

import type { ReactNode } from 'react';
import { DocsLayout } from '@codrag/ui';
import { docsSidebar } from '../config/docs';

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      headerProps={{
        productName: 'CoDRAG Docs',
        links: [
          { label: 'Home', href: 'https://codrag.io' },
          { label: 'Download', href: 'https://codrag.io/download' },
          { label: 'Support', href: 'https://support.codrag.io' },
        ],
        searchPlaceholder: 'Search documentation...',
        onSearch: (query: string) => {
          window.location.href = `/search?q=${encodeURIComponent(query)}`;
        },
      }}
      footerProps={{
        productName: 'CoDRAG',
        socials: {
          github: 'https://github.com/EricBintner/CoDRAG',
          email: 'docs@codrag.io',
        },
      }}
      sidebarItems={docsSidebar}
    >
      {children}
    </DocsLayout>
  );
}
