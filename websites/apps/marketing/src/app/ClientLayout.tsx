"use client";

import type { ReactNode } from 'react';
import { SiteHeader, SiteFooter } from '@codrag/ui';
import { DevToolbar } from './DevToolbar';

const isDev = process.env.NODE_ENV !== 'production';

// Dev mode: point to local dev servers instead of production domains
const DOCS_URL  = isDev ? 'http://localhost:3001' : 'https://docs.codrag.io';
const SUPPORT_URL = isDev ? 'http://localhost:3002' : 'https://support.codrag.io';
// const PAYMENTS_URL = isDev ? 'http://localhost:3003' : 'https://payments.codrag.io';

const navLinks = [
  { label: 'Download', href: '/download' },
  { label: 'Docs', href: DOCS_URL },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Support', href: SUPPORT_URL },
];

const footerSections = [
  {
    title: 'Product',
    links: [
      { label: 'Download', href: '/download' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Changelog', href: '/changelog' },
      { label: 'Docs', href: DOCS_URL },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'Community', href: '/community' },
      { label: 'Help Center', href: SUPPORT_URL },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
      { label: 'Security', href: '/security' },
    ],
  },
];

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader 
        productName="CoDRAG" 
        links={navLinks} 
        actions={
          <a 
            href="/download" 
            className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm"
          >
            Get Started
          </a>
        }
      />
      <main className="flex-1">
        {children}
      </main>
      <SiteFooter 
        productName="CoDRAG"
        sections={footerSections}
        socials={{
          github: 'https://github.com/EricBintner/CoDRAG',
          email: 'hello@codrag.io'
        }}
      />
      <DevToolbar />
    </>
  );
}
