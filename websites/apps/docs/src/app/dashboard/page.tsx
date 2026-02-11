import { Image as ImageIcon } from 'lucide-react';

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/" className="text-sm text-text-muted hover:text-primary transition-colors">
          ← Back to Docs
        </a>

        <h1 className="mt-6 text-4xl font-bold tracking-tight">Dashboard Guide</h1>
        <p className="mt-4 text-xl text-text-muted">
          A comprehensive tour of the CoDRAG desktop interface panels and controls.
        </p>

        <div className="mt-12 prose prose-invert max-w-none">
          
          <h2 id="overview">Overview</h2>
          <p>
            The dashboard is organized into three main columns: <strong>Knowledge Base</strong> (Left), <strong>Context Assembly</strong> (Center), and <strong>Code Graph</strong> (Right). You can customize this layout by dragging panels or toggling their visibility in the settings.
          </p>

          <div className="my-8 p-12 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-2">
              <ImageIcon className="w-8 h-8" />
            </div>
            <p className="font-medium">Screenshot: Full Dashboard Layout</p>
            <p className="text-sm max-w-md text-center">Capture the full dashboard window showing the default 3-column layout with some populated data.</p>
          </div>

          <hr className="my-12 border-border" />

          <h2 id="knowledge-base" className="text-2xl font-bold mt-12 mb-6">1. Knowledge Base & Status</h2>
          
          <h3 id="status" className="text-xl font-semibold mt-8 mb-4">Knowledge Base Status</h3>
          <p>
            The Status panel gives you a high-level health check of your project's index.
          </p>
          <ul className="list-disc pl-5 space-y-2 mb-6">
            <li><strong>Files Indexed:</strong> Total number of files currently in the vector database.</li>
            <li><strong>Vectors:</strong> Total number of embedding chunks generated.</li>
            <li><strong>Stale Status:</strong> Indicators if the index is out of sync with the file system.</li>
          </ul>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Status Panel</p>
            <p className="text-sm">Close-up of the Status panel showing &apos;Indexed&apos; counts and green status indicators.</p>
          </div>

          <h3 id="build" className="text-xl font-semibold mt-8 mb-4">Rebuild Knowledge Base</h3>
          <p>
            Manually trigger indexing operations. This is useful when you've made significant changes outside of the auto-watch cycle or want to force a refresh.
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Build Panel</p>
            <p className="text-sm">Show the Build panel with the &apos;Rebuild&apos; button and progress bar active.</p>
          </div>

          <h3 id="watch" className="text-xl font-semibold mt-8 mb-4">Live Sync (Watcher)</h3>
          <p>
            (Starter/Pro) Controls the file system watcher. When enabled, CoDRAG automatically detects file changes and updates the index and graph in the background.
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Watcher Panel</p>
            <p className="text-sm">Show the Watch panel in &apos;Watching&apos; state with the pulsing indicator.</p>
          </div>

          <h3 id="llm-status" className="text-xl font-semibold mt-8 mb-4">AI Gateway</h3>
          <p>
            Manages connections to embedding and chat models. Supports local models (via Ollama) and cloud providers (OpenAI, Anthropic).
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: AI Gateway Panel</p>
            <p className="text-sm">Show the panel listing active models and their connection status (e.g., &apos;Ollama: Connected&apos;).</p>
          </div>

          <hr className="my-12 border-border" />

          <h2 id="search-and-context" className="text-2xl font-bold mt-12 mb-6">2. Search & Context</h2>

          <h3 id="search" className="text-xl font-semibold mt-8 mb-4">Knowledge Query</h3>
          <p>
            The primary search interface. Enter natural language queries to find relevant code, documentation, and architectural concepts.
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Search Panel</p>
            <p className="text-sm">Show the search input field with a sample query typed in.</p>
          </div>

          <h3 id="results" className="text-xl font-semibold mt-8 mb-4">Retrieved Context</h3>
          <p>
            Displays search results ranked by relevance score. You can inspect individual chunks to verify they contain the right information before adding them to context.
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Results List</p>
            <p className="text-sm">Show a list of search results with file paths, scores, and preview text.</p>
          </div>

          <h3 id="context-options" className="text-xl font-semibold mt-8 mb-4">Context Assembler</h3>
          <p>
            Configures how the context is packaged for the LLM.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Budget:</strong> Set maximum token or character limits.</li>
            <li><strong>Compression:</strong> (Pro) Enable CLaRa to compress context by up to 10x.</li>
            <li><strong>Format:</strong> Choose between XML, Markdown, or JSON output formats.</li>
          </ul>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Context Options Panel</p>
            <p className="text-sm">Show the sliders and toggle switches for context configuration.</p>
          </div>

          <h3 id="context-output" className="text-xl font-semibold mt-8 mb-4">Prompt Buffer</h3>
          <p>
            The final output area. This contains the assembled, formatted, and optionally compressed context ready to be pasted into your chat window.
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Context Output Panel</p>
            <p className="text-sm">Show the text area containing the final XML/Markdown block with a &apos;Copy&apos; button.</p>
          </div>

          <hr className="my-12 border-border" />

          <h2 id="structure" className="text-2xl font-bold mt-12 mb-6">3. Structure & Configuration</h2>

          <h3 id="roots" className="text-xl font-semibold mt-8 mb-4">Knowledge Scope</h3>
          <p>
            Manage the folders included in your project. You can add multiple roots to a single project (e.g., a monorepo setup).
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Knowledge Scope Panel</p>
            <p className="text-sm">Show the file tree with checkboxes or inclusion indicators.</p>
          </div>

          <h3 id="trace" className="text-xl font-semibold mt-8 mb-4">Cross-Reference Graph</h3>
          <p>
            A visual explorer for the code graph. Navigate definitions, references, and imports. This panel uses the Rust-based analysis engine to map relationships.
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Trace Graph Panel</p>
            <p className="text-sm">Show the node-link diagram or list view of code relationships.</p>
          </div>

          <h3 id="trace-coverage" className="text-xl font-semibold mt-8 mb-4">Cross-Reference Status</h3>
          <p>
            Shows how much of your codebase has been successfully analyzed by the graph engine. Useful for identifying unparsed files or language support gaps.
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Trace Coverage Panel</p>
            <p className="text-sm">Show the coverage statistics chart or progress bar.</p>
          </div>

          <h3 id="settings" className="text-xl font-semibold mt-8 mb-4">Settings</h3>
          <p>
            Global application configuration, including theme preferences and advanced engine tuning.
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Settings Panel</p>
            <p className="text-sm">Show the settings form with options for theme and performance.</p>
          </div>

           <h3 id="file-tree" className="text-xl font-semibold mt-8 mb-4">File Tree</h3>
          <p>
            A simple file explorer for your project. Useful for quick navigation without leaving the dashboard context.
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: File Tree Panel</p>
            <p className="text-sm">Show the file explorer view with folders expanded.</p>
          </div>

           <h3 id="pinned-files" className="text-xl font-semibold mt-8 mb-4">Pinned Files</h3>
          <p>
            Quick access to your most frequently used or critical files. Pin files from the File Tree to keep them handy.
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Pinned Files Panel</p>
            <p className="text-sm">Show a list of pinned files with &apos;Unpin&apos; actions.</p>
          </div>

        </div>
      </div>
    </main>
  );
}
