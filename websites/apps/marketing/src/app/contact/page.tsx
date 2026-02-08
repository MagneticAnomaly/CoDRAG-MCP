"use client";

import { Button } from '@codrag/ui';

const GITHUB_URL =
  process.env.NEXT_PUBLIC_CODRAG_GITHUB_URL ??
  'https://github.com/EricBintner/CoDRAG';

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <a href="/" className="text-sm text-text-muted hover:text-text transition-colors">
          ← Home
        </a>

        <div className="mt-12 mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">Get in Touch</h1>
          <p className="text-xl text-text-muted max-w-2xl leading-relaxed">
            Whether you need help getting started, have a licensing question, or want to
            discuss an enterprise deployment, we&apos;re here.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-8">
            <div className="font-semibold text-text text-lg">Technical Support</div>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              Installation, configuration, and troubleshooting help for all supported platforms.
            </p>
            <a className="mt-4 inline-block text-sm text-primary font-medium hover:underline underline-offset-2" href="mailto:support@codrag.io">
              support@codrag.io
            </a>
          </div>

          <div className="rounded-xl border border-border bg-surface p-8">
            <div className="font-semibold text-text text-lg">Licensing &amp; Billing</div>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              Questions about your Pro license, team seat management, or invoices.
            </p>
            <a className="mt-4 inline-block text-sm text-primary font-medium hover:underline underline-offset-2" href="mailto:licenses@codrag.io">
              licenses@codrag.io
            </a>
          </div>

          <div className="rounded-xl border border-border bg-surface p-8">
            <div className="font-semibold text-text text-lg">Enterprise &amp; Sales</div>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              Air-gapped deployments, SSO/SCIM integration, custom terms, and volume licensing.
            </p>
            <a className="mt-4 inline-block text-sm text-primary font-medium hover:underline underline-offset-2" href="mailto:enterprise@codrag.io">
              enterprise@codrag.io
            </a>
          </div>

          <div className="rounded-xl border border-border bg-surface p-8">
            <div className="font-semibold text-text text-lg">Security</div>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              Report vulnerabilities or request our security posture documentation (SOC 2, etc).
            </p>
            <a className="mt-4 inline-block text-sm text-primary font-medium hover:underline underline-offset-2" href="mailto:security@codrag.io">
              security@codrag.io
            </a>
          </div>

          <div className="rounded-xl border border-border bg-surface p-8 sm:col-span-2 lg:col-span-2">
            <div className="font-semibold text-text text-lg">Community &amp; Open Source</div>
            <p className="mt-2 text-sm text-text-muted leading-relaxed">
              Follow development, report non-critical bugs, request features, and join the discussion on GitHub.
            </p>
            <a
              className="mt-4 inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline underline-offset-2"
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {GITHUB_URL}
            </a>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-wrap gap-4">
          <Button asChild variant="outline">
            <a href="https://docs.codrag.io">Documentation</a>
          </Button>
          <Button asChild variant="outline">
            <a href="https://support.codrag.io">Support Portal</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/pricing">Pricing</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
