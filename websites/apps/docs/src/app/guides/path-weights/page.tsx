export default function Page() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/guides" className="text-sm text-text-muted">
          ← Guides
        </a>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">Path Weights</h1>
        <p className="mt-4 text-lg text-text-muted">
          Boost or suppress specific files and folders in search results without rebuilding your index.
        </p>

        {/* What are path weights */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">What are path weights?</h2>
          <p className="mt-3 text-text-muted leading-relaxed">
            Path weights are multipliers applied to search scores at query time. A weight of{' '}
            <code>1.5</code> boosts a folder&apos;s chunks by 50%. A weight of <code>0.0</code>{' '}
            effectively excludes it. The default weight is <code>1.0</code> (no change).
          </p>
          <ul className="mt-4 space-y-2 text-sm text-text-muted list-disc pl-5">
            <li>Applied at search time — no rebuild required</li>
            <li>Hierarchical — a folder weight applies to all files inside it</li>
            <li>Most-specific wins — a file weight overrides its parent folder weight</li>
            <li>Range: <code>0.0</code> to <code>2.0</code></li>
          </ul>
        </section>

        {/* How it works */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">How it works</h2>
          <div className="mt-4 rounded-lg bg-surface border border-border p-6 text-sm">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                <div>
                  <div className="font-medium">Set weights on folders or files</div>
                  <div className="mt-1 text-text-muted">Via the dashboard FolderTree or the API.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                <div>
                  <div className="font-medium">CoDRAG resolves the most-specific weight</div>
                  <div className="mt-1 text-text-muted">
                    For <code>src/auth/login.py</code>, CoDRAG checks: <code>src/auth/login.py</code> → <code>src/auth/</code> → <code>src/</code> → default (1.0).
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                <div>
                  <div className="font-medium">Weight is applied as a multiplier to the similarity score</div>
                  <div className="mt-1 text-text-muted">
                    <code>final_score = base_score × role_weight × path_weight</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard usage */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Using the dashboard</h2>
          <p className="mt-3 text-text-muted leading-relaxed">
            In the project&apos;s <strong>FolderTree</strong> panel, each file and folder shows a
            weight badge. Click the badge to edit the weight:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-text-muted list-disc pl-5">
            <li><strong>Grey badge</strong> — inherited from parent (no override)</li>
            <li><strong>Blue badge</strong> — explicitly set weight</li>
            <li><strong>Green badge</strong> — boosted (&gt; 1.0)</li>
            <li><strong>Red badge</strong> — suppressed (&lt; 1.0)</li>
          </ul>
          <p className="mt-3 text-sm text-text-muted">
            Changes take effect immediately on the next search — no rebuild needed.
          </p>
        </section>

        {/* API usage */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">API usage</h2>

          <h3 className="mt-6 text-lg font-medium">Set weights</h3>
          <div className="mt-2 rounded-lg bg-surface border border-border p-4 font-mono text-sm overflow-x-auto">
            <div>curl -X PUT http://localhost:4966/projects/my-project/path_weights \</div>
            <div>  -H &quot;Content-Type: application/json&quot; \</div>
            <div>  -d &apos;{'{'}</div>
            <div>    &quot;path_weights&quot;: {'{'}</div>
            <div>      &quot;src/core/&quot;: 1.5,</div>
            <div>      &quot;src/tests/&quot;: 0.3,</div>
            <div>      &quot;vendor/&quot;: 0.0,</div>
            <div>      &quot;README.md&quot;: 1.8</div>
            <div>    {'}'}</div>
            <div>  {'}'}&apos;</div>
          </div>

          <h3 className="mt-6 text-lg font-medium">Get weights</h3>
          <div className="mt-2 rounded-lg bg-surface border border-border p-4 font-mono text-sm overflow-x-auto">
            <div>curl http://localhost:4966/projects/my-project/path_weights</div>
          </div>
        </section>

        {/* Examples */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Common patterns</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="font-medium text-sm">Focus on core business logic</div>
              <div className="mt-2 font-mono text-xs text-text-muted">
                <div>&quot;src/core/&quot;: 1.5, &quot;src/utils/&quot;: 0.8, &quot;tests/&quot;: 0.3</div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="font-medium text-sm">Exclude vendored / generated code</div>
              <div className="mt-2 font-mono text-xs text-text-muted">
                <div>&quot;vendor/&quot;: 0.0, &quot;generated/&quot;: 0.0, &quot;node_modules/&quot;: 0.0</div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="font-medium text-sm">Boost documentation for onboarding queries</div>
              <div className="mt-2 font-mono text-xs text-text-muted">
                <div>&quot;docs/&quot;: 1.8, &quot;README.md&quot;: 2.0, &quot;CONTRIBUTING.md&quot;: 1.5</div>
              </div>
            </div>
          </div>
        </section>

        {/* API Reference */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold">API reference</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="font-mono text-sm font-medium">PUT /projects/{'{id}'}/path_weights</div>
              <p className="mt-1 text-sm text-text-muted">
                Set path weights. Body: <code>{`{ "path_weights": { "path": weight } }`}</code>.
                Weights are clamped to 0.0–2.0 and persisted to <code>repo_policy.json</code>.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-4">
              <div className="font-mono text-sm font-medium">GET /projects/{'{id}'}/path_weights</div>
              <p className="mt-1 text-sm text-text-muted">
                Returns the current path weights for the project.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
