"use client";

import type { ReactNode } from 'react';
import { SiteHeader, SiteFooter } from '@codrag/ui';

const navLinks = [
  { label: 'Home', href: 'https://codrag.io' },
  { label: 'Docs', href: 'https://docs.codrag.io' },
  { label: 'Status', href: '/status' },
];

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader 
        productName="CoDRAG Support" 
        links={navLinks}
        actions={
          <a 
            href="mailto:support@codrag.io" 
            className="px-4 py-2 bg-surface border border-border text-text rounded-md text-sm font-medium hover:bg-surface-raised transition-colors"
          >
            Email Us
          </a>
        }
      />
      <main className="flex-1">
        {children}
      </main>
      <SiteFooter 
        productName="CoDRAG"
        socials={{
          github: 'https://github.com/EricBintner/CoDRAG',
          email: 'support@codrag.io'
        }}
      />
    </>
  );
}
