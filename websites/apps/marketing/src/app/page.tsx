"use client";

import { MarketingHero, FeatureBlocks, codragFeatures, marketingFeatures, TierComparison, TechStackMatrix } from '@codrag/ui';
import { Terminal, ArrowRight } from 'lucide-react';
import { DevMarketingHero } from './DevMarketingHero';

export default function Page() {
  const showDevToolbar = process.env.NODE_ENV !== 'production';

  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-24">
        {/* Hero Section */}
        {showDevToolbar ? <DevMarketingHero /> : <MarketingHero variant="yale" />}

        {/* Why CoDRAG — Problem / Solution / Result */}
        <section>
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Why developers need this</p>
            <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
              If you use AI to write code, you need CoDRAG
            </h2>
            <p className="mt-4 text-lg text-text-muted max-w-2xl mx-auto">
              AI assistants are only as good as the context they receive. CoDRAG makes sure they get the right context, every time.
            </p>
          </div>
          <FeatureBlocks features={marketingFeatures} variant="list" />
        </section>

        {/* Core Features */}
        <section>
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Capabilities</p>
            <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Built for large codebases and sprawling doc trees
            </h2>
            <p className="mt-4 text-lg text-text-muted max-w-2xl mx-auto">
              Built-in embeddings, Rust-powered structural tracing, path weights for fine-grained control, and optional 10&ndash;16&times; compression &mdash; running locally, integrated with every major AI coding tool.
            </p>
          </div>
          <FeatureBlocks features={codragFeatures} variant="cards" />
        </section>

        {/* How It Works — Quick visual */}
        <section className="rounded-2xl border border-border bg-surface p-8 md:p-12">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Get started in 60 seconds</p>
            <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Three commands. Done.
            </h2>
          </div>
          <div className="max-w-2xl mx-auto font-mono text-sm bg-background rounded-xl border border-border p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-text-subtle flex-shrink-0" />
              <span className="text-text-muted"># Install and start the daemon</span>
            </div>
            <div className="text-success">$ codrag serve</div>
            <div className="text-text-muted mt-2"># Point it at your project</div>
            <div className="text-success">$ codrag add ./my-app --name &quot;MyApp&quot;</div>
            <div className="text-text-muted mt-2"># Start using it with your AI tools</div>
            <div className="text-success">$ codrag mcp --auto</div>
            <div className="mt-4 pt-4 border-t border-border text-text-muted text-xs">
              Works with Cursor, Windsurf, VS Code, Claude Desktop, and any MCP-compatible editor.
            </div>
          </div>
        </section>

        {/* What You Need — Tech Stack */}
        <section>
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">What you need</p>
            <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
              One install. Batteries included.
            </h2>
            <p className="mt-4 text-lg text-text-muted max-w-2xl mx-auto">
              CoDRAG ships with built-in embeddings &mdash; semantic search, structural tracing, and context assembly work from a single install. Add CLaRa when you need to compress massive context payloads.
            </p>
          </div>
          <TechStackMatrix />
        </section>

        {/* Free vs Pro */}
        <section>
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Plans</p>
            <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Free to start. Pro when you're ready.
            </h2>
            <p className="mt-4 text-lg text-text-muted max-w-2xl mx-auto">
              Start with one project for free. Upgrade to Pro for unlimited projects, the structural Trace Index, and a perpetual license.
            </p>
          </div>
          <TierComparison />
        </section>

        {/* Trust / social proof strip */}
        <section className="text-center space-y-8">
          <h2 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Built for professionals who take their code seriously
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary">&lt;100ms</div>
              <div className="text-sm text-text-muted mt-1">Search latency</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">0 bytes</div>
              <div className="text-sm text-text-muted mt-1">Sent to the cloud</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">10&ndash;16&times;</div>
              <div className="text-sm text-text-muted mt-1">Context compression with CLaRa</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">Perpetual</div>
              <div className="text-sm text-text-muted mt-1">License available</div>
            </div>
          </div>
          <div className="pt-4">
            <a
              href="/download"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover transition-colors"
            >
              Get CoDRAG <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
