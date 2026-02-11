import { Image as ImageIcon } from 'lucide-react';

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/dashboard" className="text-sm text-text-muted">
          ← Dashboard
        </a>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">Managing Projects</h1>
        <p className="mt-4 text-lg text-text-muted">
          Add, configure, and monitor your local repositories.
        </p>

        <div className="mt-12 prose prose-invert max-w-none">
          
          <h2 id="adding-projects">Adding Projects</h2>
          <p>
            You can add projects via the CLI (<code>codrag add .</code>) or directly in the Dashboard.
          </p>
          <ol className="list-decimal pl-5 text-sm text-text-muted">
            <li>Open the Dashboard (usually http://localhost:5173 or served via daemon).</li>
            <li>Click the <strong>&quot;+&quot;</strong> button in the sidebar project list.</li>
            <li>Enter the absolute path to your repository.</li>
            <li>Give it a friendly name (optional).</li>
          </ol>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Add Project Modal</p>
            <p className="text-sm text-center">Show the &apos;Add Project&apos; modal with path and name fields.</p>
          </div>

          <h2 id="indexing-status" className="mt-8">Indexing Status</h2>
          <p>
            Once added, CoDRAG begins the two-stage indexing process:
          </p>
          <ul className="list-disc pl-5 text-sm text-text-muted">
            <li><strong>Trace Build:</strong> (Rust) Extremely fast. Maps structure. Status shows in the &quot;Code Graph&quot; panel.</li>
            <li><strong>Semantic Build:</strong> (Embeddings) Slower on first run. Status shows in the &quot;Knowledge Base&quot; panel.</li>
          </ul>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Project List & Status</p>
            <p className="text-sm text-center">Show the sidebar project list with status indicators (e.g. &#39;Indexing&#39;, &#39;Ready&#39;).</p>
          </div>

          <h2 id="file-management" className="mt-8">File Management</h2>
          <p>
            Use the <strong>Knowledge Sources</strong> panel (left side) to manage what gets indexed.
          </p>
          
          <h3 className="text-base font-semibold mt-4">Excluding Files</h3>
          <p className="text-sm">
            CoDRAG respects your <code>.gitignore</code> automatically. To exclude additional files (like large assets or generated code) without git-ignoring them:
          </p>
          <ul className="list-disc pl-5 text-sm text-text-muted">
            <li>Create a <code>.codrag/ignore</code> file in your project root.</li>
            <li>Or use the Dashboard to set <strong>Path Weights</strong> to 0.0 for specific folders.</li>
          </ul>

          <h3 className="text-base font-semibold mt-4">Pinning Files</h3>
          <p className="text-sm">
            Important documentation or context files can be <strong>Pinned</strong>. Pinned files are always prioritized in context assembly, ensuring the AI is aware of them even if they don&apos;t match the search query perfectly.
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Pinning Files</p>
            <p className="text-sm text-center">Show the File Tree context menu or Pinned Files panel with pinned items.</p>
          </div>

        </div>
      </div>
    </main>
  );
}
