"use client";

import type { ReactNode } from 'react';
import { SiteHeader, SiteFooter } from '@codrag/ui';

const navLinks = [
  { label: 'Home', href: 'https://codrag.io' },
  { label: 'Pricing', href: 'https://codrag.io/pricing' },
  { label: 'Support', href: 'https://support.codrag.io' },
];

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader 
        productName="CoDRAG Payments" 
        links={navLinks}
      />
      <main className="flex-1">
        {children}
      </main>
      <SiteFooter 
        productName="CoDRAG"
        socials={{
          email: 'licenses@codrag.io'
        }}
      />
    </>
  );
}
