"use client";

import { Button } from '@codrag/ui';

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/" className="text-sm text-text-muted hover:text-text transition-colors">
          ← Home
        </a>

        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-text-subtle">Last updated: February 2026</p>

        <div className="mt-8 space-y-8 text-sm text-text-muted leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-text mb-3">1. Overview</h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of CoDRAG software
              and related services provided by CoDRAG Inc. (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).
              By downloading, installing, or using CoDRAG, you agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">2. License Grant</h2>

            <h3 className="font-semibold text-text mt-4 mb-2">Free Tier</h3>
            <p>
              CoDRAG Free is provided at no cost for personal and commercial use, subject to
              the feature limitations described on our pricing page. The Free tier is limited
              to one active project with manual indexing.
            </p>

            <h3 className="font-semibold text-text mt-4 mb-2">Paid Licenses</h3>
            <p>
              Paid licenses (Starter, Pro, Team, Enterprise) grant you a non-exclusive,
              non-transferable right to use CoDRAG on the number of machines specified by
              your license tier. Pro licenses are perpetual — they do not expire. Starter
              and Team licenses are time-limited as described at purchase.
            </p>

            <h3 className="font-semibold text-text mt-4 mb-2">Restrictions</h3>
            <p>
              You may not reverse-engineer, decompile, or disassemble the CoDRAG software,
              except to the extent permitted by applicable law. You may not redistribute,
              sublicense, or share license keys.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">3. Your Data</h2>
            <p>
              CoDRAG processes your source code entirely on your local machine. We do not
              access, collect, or store your source code, index data, or AI-generated output.
              See our <a href="/privacy" className="text-primary underline">Privacy Policy</a> for
              full details on what data we do and do not collect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">4. Payments &amp; Refunds</h2>
            <p>
              Payments are processed by our merchant of record (Lemon Squeezy). All prices
              are listed in USD. Refund requests within 14 days of purchase will be honored —
              contact <a href="mailto:billing@codrag.io" className="text-primary underline">billing@codrag.io</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">5. Support</h2>
            <p>
              Free tier users receive community support via GitHub Discussions. Paid license
              holders receive email support at{' '}
              <a href="https://support.codrag.io" className="text-primary underline">support.codrag.io</a>.
              Enterprise customers receive priority support as defined in their service agreement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">6. Disclaimer of Warranties</h2>
            <p>
              CoDRAG is provided &ldquo;as is&rdquo; without warranties of any kind, express or
              implied, including but not limited to warranties of merchantability, fitness
              for a particular purpose, and non-infringement. We do not warrant that the
              software will be error-free or uninterrupted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, CoDRAG Inc. shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages,
              or any loss of profits or revenues, whether incurred directly or indirectly.
              Our total liability shall not exceed the amount you paid for CoDRAG in the
              12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">8. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Material changes will be posted
              on this page with an updated revision date. Continued use of CoDRAG after
              changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text mb-3">9. Contact</h2>
            <p>
              Questions about these Terms? Contact us at{' '}
              <a href="mailto:legal@codrag.io" className="text-primary underline">legal@codrag.io</a>.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a href="/privacy">Privacy Policy</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/security">Security</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/contact">Contact</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
