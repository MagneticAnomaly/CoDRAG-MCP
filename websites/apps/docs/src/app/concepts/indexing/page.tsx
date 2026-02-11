export default function Page() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/concepts" className="text-sm text-text-muted">
          ← Back to Concepts
        </a>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">Local Indexing</h1>
        <p className="mt-4 text-xl text-text-muted">
          Semantic understanding that runs 100% on your machine.
        </p>

        <div className="mt-12 prose prose-invert max-w-none">
          <h2>The Indexing Pipeline</h2>
          <p>
            When you add a project to CoDRAG, the daemon triggers a multi-stage indexing process.
            Unlike cloud-based tools, this happens entirely on your localhost.
          </p>

          <div className="my-8 pl-4 border-l-4 border-primary space-y-4">
            <div>
              <strong className="text-text">1. Discovery</strong>
              <p className="text-sm text-text-muted">
                The <code>codrag-walker</code> crate (Rust) scans your directory, respecting 
                <code>.gitignore</code> and user-defined exclusions. It computes BLAKE3 hashes for change detection.
              </p>
            </div>
            <div>
              <strong className="text-text">2. Parsing & Chunking</strong>
              <p className="text-sm text-text-muted">
                Files are parsed using Tree-sitter. Code is split into logical chunks (functions, classes) 
                rather than arbitrary text windows. Markdown docs are split by headers.
              </p>
            </div>
            <div>
              <strong className="text-text">3. Embedding</strong>
              <p className="text-sm text-text-muted">
                Chunks are passed to the <strong>Native Embedder</strong> (ONNX/nomic-embed-text) or 
                an optional Ollama instance. This converts text into 768-dimensional vectors.
              </p>
            </div>
            <div>
              <strong className="text-text">4. Storage</strong>
              <p className="text-sm text-text-muted">
                Vectors and metadata are stored in a local LanceDB instance (or Qdrant/Chroma if configured). 
                The raw text is never sent to the cloud.
              </p>
            </div>
          </div>

          <h2>Incremental Updates</h2>
          <p>
            CoDRAG includes a real-time file watcher (<code>watchdog</code>). When you save a file:
          </p>
          <ul className="list-disc pl-5">
            <li>The watcher detects the <code>modify</code> event.</li>
            <li>It debounces rapid changes (e.g. typing).</li>
            <li>It re-hashes the file content.</li>
            <li>If the hash changed, only that file is re-parsed and re-embedded.</li>
          </ul>
          <p>
            This typically takes &lt;200ms, ensuring your AI always sees the current state of your code.
          </p>

          <h2>Exclusions</h2>
          <p>
            You can control what gets indexed via the Dashboard or <code>.codrag/ignore</code>.
            Common patterns like <code>node_modules/</code>, <code>dist/</code>, and <code>.git/</code> 
            are ignored by default.
          </p>
        </div>
      </div>
    </main>
  );
}
