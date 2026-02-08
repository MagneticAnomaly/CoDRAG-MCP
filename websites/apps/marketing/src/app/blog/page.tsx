"use client";

import { Button } from '@codrag/ui';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  tags: string[];
  featured?: boolean;
}

const POSTS: BlogPost[] = [
  {
    slug: 'why-structural-context-matters',
    title: 'Why Structural Context Matters for AI Coding Tools',
    excerpt:
      'AI assistants already index your code — but they grab files, not relationships. Here\'s why the structural layer changes everything.',
    date: 'March 1, 2026',
    author: 'CoDRAG Team',
    tags: ['Product', 'Philosophy'],
    featured: true,
  },
  {
    slug: 'introducing-trace-index',
    title: 'Introducing the Trace Index',
    excerpt:
      'Vector search finds similar text. The Trace Index maps how code connects — imports, calls, symbol hierarchies.',
    date: 'Feb 15, 2026',
    author: 'Engineering',
    tags: ['Deep Dive'],
  },
  {
    slug: 'mcp-the-universal-connector',
    title: 'MCP: The Universal Connector',
    excerpt:
      'How the Model Context Protocol lets CoDRAG integrate with Cursor, Windsurf, VS Code, and Claude Desktop.',
    date: 'Feb 01, 2026',
    author: 'Integration',
    tags: ['Ecosystem'],
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-[#fefce8] text-stone-900 selection:bg-[#c2410c] selection:text-white">
      {/* Studio Collage / Cranbrook Posture */}
      <div className="mx-auto max-w-7xl px-6 py-24">
        
        {/* Nav */}
        <div className="mb-20 font-mono text-xs tracking-widest uppercase text-stone-500">
          <a href="/" className="hover:text-[#c2410c] hover:underline decoration-wavy underline-offset-4 transition-all">
            ← Return to Base
          </a>
        </div>

        {/* Header - Asymmetric */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-32">
          <div className="lg:col-span-7 relative z-10">
            <h1 className="font-serif text-7xl md:text-9xl font-medium tracking-tight leading-[0.85] text-stone-900">
              The<br/>
              <span className="italic text-[#c2410c]">Context</span><br/>
              Log.
            </h1>
          </div>
          <div className="lg:col-span-5 flex flex-col justify-end items-start relative">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#c2410c]/10 blur-3xl -z-10"></div>
            <p className="font-mono text-sm md:text-base leading-relaxed text-stone-600 max-w-md border-l-2 border-[#c2410c] pl-6 py-2">
              Notes on the intersection of human creativity and machine intelligence. 
              Engineering deep dives, product philosophy, and the future of local-first software.
            </p>
          </div>
        </div>

        {/* Featured Post - Deconstructed Card */}
        <div className="mb-32 relative">
          {POSTS.filter(p => p.featured).map(post => (
            <div key={post.slug} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 relative">
                <div className="absolute -inset-4 bg-white/50 rounded-[2rem] -rotate-1 border border-stone-200 z-0"></div>
                <div className="relative bg-white border border-stone-900 rounded-[1.5rem] p-8 md:p-12 shadow-[8px_8px_0px_0px_#1c1917] z-10 hover:-translate-y-1 transition-transform cursor-pointer">
                   <div className="font-mono text-xs text-[#c2410c] mb-4 uppercase tracking-widest">{post.date}</div>
                   <h2 className="font-serif text-4xl md:text-6xl mb-6 leading-tight hover:underline decoration-2 underline-offset-4 decoration-[#c2410c]">
                     {post.title}
                   </h2>
                   <p className="font-mono text-sm md:text-base text-stone-600 leading-relaxed max-w-2xl">
                     {post.excerpt}
                   </p>
                   <div className="mt-8 flex gap-2">
                     {post.tags.map(tag => (
                       <span key={tag} className="px-3 py-1 rounded-full border border-stone-900 text-xs font-bold uppercase bg-[#fefce8]">
                         {tag}
                       </span>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Posts - Masonry-ish */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 mb-24">
          <div className="md:col-span-2 mb-8 border-b border-stone-300 pb-4 flex justify-between items-end">
            <h3 className="font-serif text-3xl italic">Recent Signals</h3>
            <span className="font-mono text-xs text-stone-500">ARCHIVE_ACCESS</span>
          </div>

          {POSTS.filter(p => !p.featured).map((post, idx) => (
            <div 
              key={post.slug} 
              className={`
                group relative flex flex-col items-start
                ${idx % 2 === 1 ? 'md:mt-24' : ''} 
              `}
            >
              <div className="w-full bg-white border border-stone-200 p-8 rounded-none hover:rounded-[2rem] transition-all duration-300 hover:shadow-xl hover:shadow-[#c2410c]/10 hover:border-[#c2410c]/30">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-mono text-xs text-stone-400">{post.date}</span>
                  <span className="font-mono text-xs uppercase text-[#c2410c]">{post.author}</span>
                </div>
                <h3 className="font-serif text-3xl mb-4 leading-tight group-hover:text-[#c2410c] transition-colors">
                  {post.title}
                </h3>
                <p className="font-mono text-sm text-stone-500 mb-6 leading-relaxed">
                  {post.excerpt}
                </p>
                <Button asChild variant="outline" className="rounded-full border-stone-300 hover:border-[#c2410c] hover:text-[#c2410c]">
                  <a href="#">Read Entry →</a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter / CTA - Paper tear effect */}
        <div className="relative mt-32 max-w-4xl mx-auto text-center">
          <div className="absolute inset-0 bg-stone-900 rotate-1 rounded-sm -z-10"></div>
          <div className="bg-[#fefce8] border-2 border-dashed border-stone-900 p-12 md:p-24 -rotate-1">
            <h3 className="font-serif text-4xl md:text-5xl mb-6">Stay in the loop.</h3>
            <p className="font-mono text-stone-600 mb-8 max-w-lg mx-auto">
              We write about once a month. No spam, just updates on the structural web.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
               <Button asChild className="rounded-none bg-stone-900 text-[#fefce8] hover:bg-[#c2410c]">
                 <a href="https://twitter.com/codrag">Follow on Twitter</a>
               </Button>
               <Button asChild variant="outline" className="rounded-none border-stone-900 hover:bg-stone-100">
                 <a href="/rss">RSS Feed</a>
               </Button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
