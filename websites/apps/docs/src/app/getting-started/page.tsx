import { Image as ImageIcon } from 'lucide-react';

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a href="/" className="text-sm text-text-muted hover:text-primary transition-colors">
          ← Back to Docs
        </a>

        <h1 className="mt-6 text-4xl font-bold tracking-tight">Getting Started</h1>
        <p className="mt-4 text-xl text-text-muted">
          From zero to structural code intelligence in under 10 minutes.
        </p>

        <div className="mt-12 prose prose-invert max-w-none">
          <div className="not-prose mb-12">
             <div className="flex items-start gap-4 p-4 bg-surface-raised border border-border rounded-xl">
               <div className="p-2 bg-primary/10 rounded-lg text-primary">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
               </div>
               <div>
                 <h3 className="font-bold text-text">The &quot;Trust Loop&quot;</h3>
                 <p className="text-sm text-text-muted mt-1">
                   CoDRAG runs locally. You don&apos;t need to create an account or upload code to the cloud to see it work.
                 </p>
               </div>
             </div>
          </div>

          <h2>1. Install</h2>
          <p>
            CoDRAG is a Python application that runs on your machine.
          </p>
          <pre className="bg-surface-raised p-4 rounded-lg overflow-x-auto text-sm">
            <code>pip install codrag</code>
          </pre>

          <h2>2. Start the Daemon</h2>
          <p>
            This background process manages the Rust indexer and MCP server.
          </p>
          <pre className="bg-surface-raised p-4 rounded-lg overflow-x-auto text-sm">
            <code>codrag serve</code>
          </pre>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Daemon Terminal</p>
            <p className="text-sm text-center">Show the terminal output of &apos;codrag serve&apos; indicating the server is listening on port 8400.</p>
          </div>
          <p className="text-sm text-text-muted">
            <em>Keep this terminal window open.</em>
          </p>

          <h2>3. Add Your Repo</h2>
          <p>
            In a new terminal window, navigate to your project and add it. CoDRAG will immediately start indexing (semantics + structure).
          </p>
          <pre className="bg-surface-raised p-4 rounded-lg overflow-x-auto text-sm">
            <code>cd ~/my-project
codrag add . --name &quot;My Project&quot;</code>
          </pre>
          <p>
            You&apos;ll see indexing progress in the daemon window. For a 50k file repo, the Rust trace index takes less than a second once semantic indexing wraps up.
          </p>

          <h2>4. Connect Your Editor</h2>
          <p>
            CoDRAG works best when connected to an AI code editor via MCP.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4 not-prose my-6">
            <a href="/mcp/cursor" className="block p-4 border border-border rounded-lg hover:border-primary transition-colors">
              <div className="font-bold">Cursor</div>
              <div className="text-sm text-text-muted">Settings &gt; Features &gt; MCP</div>
            </a>
            <a href="/mcp/windsurf" className="block p-4 border border-border rounded-lg hover:border-primary transition-colors">
              <div className="font-bold">Windsurf</div>
              <div className="text-sm text-text-muted">~/.codeium/windsurf/mcp_config.json</div>
            </a>
          </div>

          <p>
             Use the default local URL: <code>http://localhost:8400/mcp/sse</code>
          </p>

          <h2>5. Verify</h2>
          <p>
            Open your editor&apos;s AI chat (e.g. Cursor Agent or Windsurf Cascade) and ask:
          </p>
          <blockquote className="border-l-4 border-primary pl-4 italic text-text-muted my-4">
            &quot;Trace the callers of [Function X] and find where it&apos;s used.&quot;
          </blockquote>
          <p>
            You should see the agent call <code>codrag</code> with <code>trace_expand=true</code> and return a structural graph analysis.
          </p>
          <div className="my-6 p-8 border-2 border-dashed border-border rounded-lg bg-surface-raised flex flex-col items-center justify-center text-text-muted gap-2">
            <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-medium">Screenshot: Editor Verification</p>
            <p className="text-sm text-center">Show an IDE chat window (Cursor or Windsurf) successfully calling the &apos;codrag&apos; tool and displaying graph results.</p>
          </div>

          <hr className="my-12 border-border" />

          <h3>Next Steps</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><a href="/guides/path-weights" className="text-primary hover:underline">Tune Path Weights</a> to focus the AI on what matters.</li>
            <li><a href="/guides/clara" className="text-primary hover:underline">Set up CLaRa</a> for 10x context compression.</li>
            <li><a href="/troubleshooting" className="text-primary hover:underline">Troubleshooting</a> if something didn&apos;t work.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
