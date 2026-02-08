export default function Page() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/" className="text-sm text-text-muted">
          ← Docs home
        </a>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">Guides</h1>
        <p className="mt-4 text-lg text-text-muted">
          Step-by-step guides for CoDRAG&apos;s advanced features.
        </p>

        <div className="mt-8 space-y-6">
          <a
            href="/guides/embeddings"
            className="block rounded-lg border border-border bg-surface p-6 hover:border-primary transition-colors"
          >
            <h2 className="text-xl font-semibold">Built-in Embeddings</h2>
            <p className="mt-2 text-sm text-text-muted">
              CoDRAG ships with a built-in embedding model (nomic-embed-text). No Ollama required.
              Learn how to use it, switch providers, and pre-download the model.
            </p>
          </a>

          <a
            href="/guides/clara"
            className="block rounded-lg border border-border bg-surface p-6 hover:border-primary transition-colors"
          >
            <h2 className="text-xl font-semibold">Context Compression (CLaRa)</h2>
            <p className="mt-2 text-sm text-text-muted">
              Compress retrieved context up to 16× before sending it to your LLM. Powered by the
              CLaRa sidecar server. Works via API and MCP.
            </p>
          </a>

          <a
            href="/guides/path-weights"
            className="block rounded-lg border border-border bg-surface p-6 hover:border-primary transition-colors"
          >
            <h2 className="text-xl font-semibold">Path Weights</h2>
            <p className="mt-2 text-sm text-text-muted">
              Boost or suppress specific files and folders in search results.
              Hierarchical weights let you tune relevance without rebuilding.
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}
