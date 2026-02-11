export default function Page() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/getting-started" className="text-sm text-text-muted">
          ← Getting Started
        </a>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">Installation</h1>
        <p className="mt-4 text-lg text-text-muted">
          Install the CoDRAG CLI and daemon on your local machine.
        </p>

        <div className="mt-12 prose prose-invert max-w-none">
          
          <h2 id="prerequisites">Prerequisites</h2>
          <ul className="list-disc pl-5 text-sm text-text-muted">
            <li><strong>OS:</strong> macOS (11+) or Windows (10+). Linux is supported but experimental.</li>
            <li><strong>Python:</strong> Version 3.10 or higher.</li>
            <li><strong>Rust:</strong> Not required for usage (engine is pre-compiled), but needed if building from source.</li>
          </ul>

          <h2 id="pip" className="mt-8">Install via pip</h2>
          <p>
            The recommended way to install CoDRAG is via <code>pip</code> (or <code>pipx</code> for isolation).
          </p>
          <pre className="bg-surface-raised p-4 rounded-lg overflow-x-auto text-sm">
            <code>pip install codrag</code>
          </pre>
          <p className="text-sm">
            Or with pipx (recommended):
          </p>
          <pre className="bg-surface-raised p-4 rounded-lg overflow-x-auto text-sm">
            <code>pipx install codrag</code>
          </pre>

          <h2 id="verify" className="mt-8">Verify Installation</h2>
          <p>
            Run the version command to ensure everything is set up correctly.
          </p>
          <pre className="bg-surface-raised p-4 rounded-lg overflow-x-auto text-sm">
            <code>codrag --version</code>
          </pre>

          <h2 id="upgrade" className="mt-8">Upgrading</h2>
          <p>
            To get the latest features and bug fixes:
          </p>
          <pre className="bg-surface-raised p-4 rounded-lg overflow-x-auto text-sm">
            <code>pip install --upgrade codrag</code>
          </pre>

          <div className="mt-8 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <h3 className="text-base font-semibold text-blue-500 mb-2">Next Steps</h3>
            <p className="text-sm text-text-muted">
              Once installed, head over to the <a href="/getting-started/quick-start" className="text-primary hover:underline">Quick Start</a> guide to index your first project.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
