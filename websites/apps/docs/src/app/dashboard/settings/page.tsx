import { Image as ImageIcon } from 'lucide-react';

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/dashboard" className="text-sm text-text-muted">
          ← Dashboard
        </a>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-4 text-lg text-text-muted">
          Configure AI models, build behavior, and application preferences.
        </p>

        <div className="mt-12 prose prose-invert max-w-none">
          
          <h2 id="ai-models">AI Models</h2>
          <p>
            The <strong>Settings &gt; AI Models</strong> tab controls which models CoDRAG uses for embedding and compression.
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: AI Models Tab</p>
            <p className="text-sm text-center">Show the Settings panel with the &apos;AI Models&apos; tab active.</p>
          </div>
          
          <div className="space-y-6 mt-6">
            <div className="border border-border rounded-lg p-4 bg-surface">
              <h3 className="font-semibold text-text">Embedding Model</h3>
              <p className="text-sm text-text-muted mt-1">
                Used for semantic search.
              </p>
              <ul className="mt-2 text-sm list-disc pl-5 text-text-muted">
                <li><strong>Native (Recommended):</strong> Uses the built-in ONNX runtime with <code>nomic-embed-text</code>. Zero setup.</li>
                <li><strong>Ollama:</strong> Connect to a local Ollama instance (e.g., <code>http://localhost:11434</code>). Useful if you want to use a specific custom model.</li>
              </ul>
            </div>

            <div className="border border-border rounded-lg p-4 bg-surface">
              <h3 className="font-semibold text-text">Small Model</h3>
              <p className="text-sm text-text-muted mt-1">
                High-speed model for background tasks (tagging, intent detection).
              </p>
              <ul className="mt-2 text-sm list-disc pl-5 text-text-muted">
                <li>Default: <code>ministral-3:3b</code> (via Ollama)</li>
                <li>Optimized for low latency.</li>
              </ul>
            </div>

            <div className="border border-border rounded-lg p-4 bg-surface">
              <h3 className="font-semibold text-text">Large Model</h3>
              <p className="text-sm text-text-muted mt-1">
                Reasoning model for chat and synthesis.
              </p>
              <ul className="mt-2 text-sm list-disc pl-5 text-text-muted">
                <li>Default: <code>ministral-3:8b</code> (via Ollama)</li>
                <li>Supports BYOK (Anthropic/OpenAI) if configured.</li>
              </ul>
            </div>

            <div className="border border-border rounded-lg p-4 bg-surface">
              <h3 className="font-semibold text-text">Compression Model (CLaRa)</h3>
              <p className="text-sm text-text-muted mt-1">
                Used to compress context before sending to your editor.
              </p>
              <ul className="mt-2 text-sm list-disc pl-5 text-text-muted">
                <li>Requires the CLaRa sidecar server running (default port 8765).</li>
                <li>You can configure the URL here if running on a remote GPU machine.</li>
              </ul>
            </div>
          </div>

          <h2 id="general" className="mt-12">General Settings</h2>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: General Settings Tab</p>
            <p className="text-sm text-center">Show the &apos;General&apos; tab with Watcher and Theme toggles.</p>
          </div>
          
          <h3 className="text-base font-semibold mt-4">File Watcher</h3>
          <p className="text-sm text-text-muted">
            (Starter/Pro) Toggles real-time indexing. If disabled, you must manually trigger builds.
          </p>

          <h3 className="text-base font-semibold mt-4">Theme</h3>
          <p className="text-sm text-text-muted">
            Switch between Light, Dark, and System appearance. The Dashboard uses the &quot;Inclusive Focus&quot; theme by default.
          </p>

        </div>
      </div>
    </main>
  );
}
