"use client";

import type { ReactNode } from 'react';
import { DocsLayout } from '@codrag/ui';

const isDev = process.env.NODE_ENV !== 'production';

const HOME_URL = isDev ? 'http://localhost:3000' : 'https://codrag.io';
const DOCS_URL = isDev ? 'http://localhost:3001' : 'https://docs.codrag.io';

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      headerProps={{
        productName: 'CoDRAG Support',
        links: [
          { label: 'Home', href: HOME_URL },
          { label: 'Docs', href: DOCS_URL },
          { label: 'Status', href: '#' },
        ],
        searchPlaceholder: 'Search help...',
        onSearch: (query: string) => {
          window.location.href = `${DOCS_URL}/search?q=${encodeURIComponent(query)}`;
        },
      }}
      footerProps={{
        productName: 'CoDRAG',
        socials: {
          twitter: 'https://twitter.com/codrag_io',
          github: 'https://github.com/EricBintner/CoDRAG',
          email: 'support@codrag.io',
        },
      }}
      sidebarItems={[]} // No sidebar for support portal main page, or minimal
    >
      {children}
    </DocsLayout>
  );
}
