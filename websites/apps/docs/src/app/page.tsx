"use client";

import { FeatureBlocks } from '@codrag/ui';
import { Rocket, LayoutDashboard, Terminal, Plug, Wrench, LifeBuoy, BookOpen } from 'lucide-react';

const docFeatures = [
  {
    icon: <Rocket className="w-8 h-8" />,
    title: 'Getting Started',
    description: 'The trust loop: add → build → search → context.',
    href: '/getting-started',
  },
  {
    icon: <LayoutDashboard className="w-8 h-8" />,
    title: 'Dashboard UI',
    description: 'Configure projects, builds, and context settings.',
    href: '/dashboard',
  },
  {
    icon: <Terminal className="w-8 h-8" />,
    title: 'CLI Reference',
    description: 'Commands and flags for local-first workflows.',
    href: '/cli',
  },
  {
    icon: <Plug className="w-8 h-8" />,
    title: 'MCP Integration',
    description: 'Use CoDRAG from Cursor/Windsurf via MCP.',
    href: '/mcp',
  },
  {
    icon: <BookOpen className="w-8 h-8" />,
    title: 'Guides',
    description: 'Embeddings, context compression, path weights, and more.',
    href: '/guides',
  },
  {
    icon: <Wrench className="w-8 h-8" />,
    title: 'Troubleshooting',
    description: 'Fix common setup and build issues.',
    href: '/troubleshooting',
  },
  {
    icon: <LifeBuoy className="w-8 h-8" />,
    title: 'Support',
    description: 'Ticketing, bugs, questions, and security reporting.',
    href: 'https://codrag.io/support',
    external: true,
  },
];

export default function Page() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">CoDRAG Documentation</h1>
        <p className="text-xl text-text-muted">
          Everything you need to index your codebase, connect your AI tools, and get better output from every prompt.
        </p>
      </div>

      <FeatureBlocks features={docFeatures} variant="cards" />
    </div>
  );
}
