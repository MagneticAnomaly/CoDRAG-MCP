"use client";

import { FeatureBlocks } from '@codrag/ui';
import { HelpCircle, Bug, MessageSquare, CreditCard, Mail, Shield } from 'lucide-react';

const GITHUB_REPO_URL = 'https://github.com/EricBintner/CoDRAG';

const supportOptions = [
  {
    icon: <HelpCircle className="w-8 h-8" />,
    title: 'Troubleshooting',
    description: 'Common issues, fixes, and performance tips.',
    href: 'https://docs.codrag.io/troubleshooting',
    external: true,
  },
  {
    icon: <Bug className="w-8 h-8" />,
    title: 'Report a bug',
    description: 'File an issue with repro steps and logs.',
    href: `${GITHUB_REPO_URL}/issues/new/choose`,
    external: true,
  },
  {
    icon: <MessageSquare className="w-8 h-8" />,
    title: 'Ask a question',
    description: 'Use GitHub Discussions for Q&A.',
    href: `${GITHUB_REPO_URL}/discussions`,
    external: true,
  },
  {
    icon: <CreditCard className="w-8 h-8" />,
    title: 'Billing & licenses',
    description: 'Purchase, license delivery, and recovery.',
    href: 'https://payments.codrag.io',
    external: true,
  },
  {
    icon: <Mail className="w-8 h-8" />,
    title: 'Email support',
    description: 'support@codrag.io',
    href: 'mailto:support@codrag.io',
    external: true,
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Security reporting',
    description: 'security@codrag.io',
    href: 'mailto:security@codrag.io',
    external: true,
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Support Center</h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            Get help with setup, troubleshoot builds, report issues, or reach the team directly.
          </p>
        </div>

        <FeatureBlocks features={supportOptions} variant="cards" />
      </div>
    </main>
  );
}
