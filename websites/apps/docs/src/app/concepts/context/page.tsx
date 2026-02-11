export default function Page() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/concepts" className="text-sm text-text-muted">
          ← Back to Concepts
        </a>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">Context Assembly</h1>
        <p className="mt-4 text-xl text-text-muted">
          Turning raw signals into an optimized LLM prompt.
        </p>

        <div className="mt-12 prose prose-invert max-w-none">
          <p>
            Retrieving code is easy. assembling it into a coherent prompt that fits within a context window 
            while maximizing information density is hard.
          </p>

          <h2>The Assembly Process</h2>
          
          <h3 className="text-lg font-semibold mt-6">1. Retrieval</h3>
          <p>
            CoDRAG gathers candidates from multiple sources:
          </p>
          <ul className="list-disc pl-5">
            <li><strong>Semantic Search:</strong> Top-K chunks via vector similarity.</li>
            <li><strong>Keyword Search:</strong> BM25 matches for exact terms.</li>
            <li><strong>Trace Graph:</strong> Related definitions and call sites (if trace expansion is on).</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6">2. Scoring & Weighting</h3>
          <p>
            Candidates are re-scored based on:
          </p>
          <ul className="list-disc pl-5">
            <li><strong>Relevance:</strong> The raw vector distance.</li>
            <li><strong>Query Intent:</strong> CoDRAG classifies your query (e.g. &quot;docs&quot;, &quot;tests&quot;, &quot;code&quot;, or &quot;default&quot;) and automatically adjusts role weights. For example, &quot;how to use auth&quot; boosts documentation, while &quot;auth test failure&quot; boosts test files.</li>
            <li><strong>Path Weights:</strong> User-defined multipliers (e.g. boost <code>src/core</code> by 1.5x, suppress <code>tests/</code> by 0.5x).</li>
            <li><strong>Priming:</strong> Files named <code>AGENTS.md</code>, <code>CODRAG_PRIMER.md</code>, or <code>PROJECT_PRIMER.md</code> receive a global score boost (default +0.25). These files are ideal for high-level architectural overviews that should be considered relevant to most queries.</li>
            <li><strong>Recency:</strong> Slight boost for recently modified files (configurable).</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6">3. Budgeting & Truncation</h3>
          <p>
            You specify a <code>max_chars</code> or <code>max_tokens</code> budget. CoDRAG:
          </p>
          <ul className="list-disc pl-5">
            <li>Sorts chunks by their final score.</li>
            <li>Greedily adds chunks until the budget is near full.</li>
            <li>Ensures "glue" code (class headers, function signatures) is preserved for context.</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6">4. Compression (CLaRa)</h3>
          <p>
            If <strong>CLaRa</strong> is enabled (Pro tier), the assembled text is passed through 
            a specialized compression model. This rewrites verbose documentation and boilerplate 
            into dense, high-entropy summaries, often reducing token count by 10-16x with minimal information loss.
          </p>

          <h3 className="text-lg font-semibold mt-6">5. Formatting</h3>
          <p>
            The final output is formatted as XML, Markdown, or JSON, complete with file path citations 
            (<code>@src/file.ts:10-20</code>) that AI editors can parse to provide "Click to Open" links.
          </p>
        </div>
      </div>
    </main>
  );
}
