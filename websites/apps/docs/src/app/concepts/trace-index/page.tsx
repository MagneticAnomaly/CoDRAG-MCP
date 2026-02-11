export default function Page() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/concepts" className="text-sm text-text-muted">
          ← Back to Concepts
        </a>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">Trace Index</h1>
        <p className="mt-4 text-xl text-text-muted">
          The structural backbone of CoDRAG.
        </p>

        <div className="mt-12 prose prose-invert max-w-none">
          <p>
            Vector search is great for &quot;fuzzy&quot; questions (&quot;how does auth work?&quot;), but terrible 
            at precision (&quot;where is the <code>User</code> struct defined and what calls it?&quot;).
          </p>
          <p>
            To solve this, CoDRAG maintains a parallel <strong>Trace Index</strong> — a directed graph 
            of your codebase's structure.
          </p>

          <h2>Rust Engine</h2>
          <p>
            The Trace Index is built by a high-performance Rust engine (`codrag-engine`) that runs alongside the Python daemon.
          </p>
          <ul className="list-disc pl-5">
            <li><strong>Speed:</strong> Parses ~50k files in seconds.</li>
            <li><strong>Accuracy:</strong> Uses Tree-sitter to generate concrete syntax trees (CSTs) for accurate symbol extraction.</li>
            <li><strong>Multi-language:</strong> Supports Python, TypeScript, JavaScript, Go, Rust, Java, C, and C++.</li>
          </ul>

          <h2>The Graph</h2>
          <p>
            The index maps three types of relationships:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 not-prose">
            <div className="p-4 bg-surface-raised border border-border rounded-lg text-center">
              <div className="font-bold mb-1">Definitions</div>
              <div className="text-xs text-text-muted">&quot;Where is X declared?&quot;</div>
            </div>
            <div className="p-4 bg-surface-raised border border-border rounded-lg text-center">
              <div className="font-bold mb-1">References</div>
              <div className="text-xs text-text-muted">&quot;Where is X used?&quot;</div>
            </div>
            <div className="p-4 bg-surface-raised border border-border rounded-lg text-center">
              <div className="font-bold mb-1">Imports</div>
              <div className="text-xs text-text-muted">&quot;What does file A depend on?&quot;</div>
            </div>
          </div>

          <h2>Usage</h2>
          <p>
            You generally don&apos;t query the trace index directly. Instead, you enable <strong>Trace Expansion</strong> 
            in your context request (or use the &quot;Trace&quot; keywords in your MCP editor).
          </p>
          <p>
            When enabled, CoDRAG:
          </p>
          <ol className="list-decimal pl-5">
            <li>Finds the primary chunks via vector search.</li>
            <li>Identifies key symbols in those chunks.</li>
            <li>Queries the Trace Graph for their definition sites and usages.</li>
            <li>&quot;Expands&quot; the context to include those related files, even if they didn&apos;t match the search keywords.</li>
          </ol>
          
          <p className="bg-info/10 border-l-4 border-info p-4 mt-6 text-sm">
            <strong>Example:</strong> You ask &quot;How is billing calculated?&quot;. <br/>
            Vector search finds <code>billing.py</code>. <br/>
            The Trace Index notices <code>billing.py</code> imports <code>tax_rates.py</code>. <br/>
            CoDRAG includes <code>tax_rates.py</code> in the context automatically, preventing the AI from hallucinating tax logic.
          </p>
        </div>
      </div>
    </main>
  );
}
