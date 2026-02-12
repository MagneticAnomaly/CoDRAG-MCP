// @ts-nocheck
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-ignore - Types are missing for some languages in @types/react-syntax-highlighter
import { 
  bash, 
  c, 
  cpp, 
  csharp,
  css, 
  dart,
  go, 
  java, 
  javascript, 
  json, 
  kotlin,
  lua,
  markdown, 
  objectivec,
  php,
  python, 
  r,
  ruby,
  rust, 
  scala,
  sql, 
  swift,
  typescript, 
  yaml,
  ini,
} from 'react-syntax-highlighter/dist/esm/languages/prism';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import docker from 'react-syntax-highlighter/dist/esm/languages/prism/docker';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '../../lib/utils';
import { CopyButton } from '../context/CopyButton';

// Register languages
let languagesRegistered = false;
function registerLanguages() {
  if (languagesRegistered) return;
  
  SyntaxHighlighter.registerLanguage('typescript', typescript);
  SyntaxHighlighter.registerLanguage('tsx', typescript);
  SyntaxHighlighter.registerLanguage('javascript', javascript);
  SyntaxHighlighter.registerLanguage('jsx', javascript);
  SyntaxHighlighter.registerLanguage('python', python);
  SyntaxHighlighter.registerLanguage('go', go);
  SyntaxHighlighter.registerLanguage('rust', rust);
  SyntaxHighlighter.registerLanguage('java', java);
  SyntaxHighlighter.registerLanguage('kotlin', kotlin);
  SyntaxHighlighter.registerLanguage('c', c);
  SyntaxHighlighter.registerLanguage('cpp', cpp);
  SyntaxHighlighter.registerLanguage('csharp', csharp);
  SyntaxHighlighter.registerLanguage('swift', swift);
  SyntaxHighlighter.registerLanguage('objectivec', objectivec);
  SyntaxHighlighter.registerLanguage('dart', dart);
  SyntaxHighlighter.registerLanguage('ruby', ruby);
  SyntaxHighlighter.registerLanguage('php', php);
  SyntaxHighlighter.registerLanguage('scala', scala);
  SyntaxHighlighter.registerLanguage('lua', lua);
  SyntaxHighlighter.registerLanguage('r', r);
  SyntaxHighlighter.registerLanguage('json', json);
  SyntaxHighlighter.registerLanguage('markdown', markdown);
  SyntaxHighlighter.registerLanguage('yaml', yaml);
  SyntaxHighlighter.registerLanguage('bash', bash);
  SyntaxHighlighter.registerLanguage('sql', sql);
  SyntaxHighlighter.registerLanguage('html', markup);
  SyntaxHighlighter.registerLanguage('css', css);
  SyntaxHighlighter.registerLanguage('xml', markup);
  SyntaxHighlighter.registerLanguage('ini', ini);
  SyntaxHighlighter.registerLanguage('dockerfile', docker);
  
  languagesRegistered = true;
}

export interface CodeViewerProps {
  content: string;
  path?: string;
  language?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export function detectLanguage(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'js':
    case 'jsx':
    case 'cjs':
    case 'mjs':
      return 'javascript';
    case 'py':
    case 'pyi':
      return 'python';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'java':
      return 'java';
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'hpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'cs':
      return 'csharp';
    case 'swift':
      return 'swift';
    case 'm':
    case 'mm':
      return 'objectivec';
    case 'dart':
      return 'dart';
    case 'rb':
      return 'ruby';
    case 'php':
      return 'php';
    case 'scala':
    case 'sc':
      return 'scala';
    case 'lua':
      return 'lua';
    case 'r':
    case 'R':
      return 'r';
    case 'json':
      return 'json';
    case 'md':
    case 'mdx':
      return 'markdown';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'bash';
    case 'sql':
      return 'sql';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return 'css';
    case 'xml':
    case 'svg':
      return 'xml';
    case 'ini':
    case 'toml':
    case 'cfg':
    case 'conf':
    case 'properties':
    case 'env':
      return 'ini';
    case 'dockerfile':
      return 'dockerfile';
    default:
      if (path.toLowerCase().includes('dockerfile')) return 'dockerfile';
      if (path.toLowerCase().includes('makefile')) return 'bash'; // Close enough
      return 'text';
  }
}

export function CodeViewer({
  content,
  path,
  language,
  className,
  showLineNumbers = true,
}: CodeViewerProps) {
  // Ensure languages are registered (safe to call multiple times)
  registerLanguages();

  const lang = language || (path ? detectLanguage(path) : 'text');

  return (
    <div className={cn("flex-1 min-h-0 bg-[#1e1e1e] border border-border rounded-lg overflow-hidden flex flex-col", className)}>
      {path && (
        <div className="px-3 py-2 border-b border-border/20 bg-[#252526] text-xs font-mono text-gray-300 truncate flex justify-between items-center shrink-0">
          <span>{path}</span>
          <span className="text-gray-500">{lang}</span>
        </div>
      )}
      
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar relative group">
        <SyntaxHighlighter
          language={lang}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.75rem',
            lineHeight: '1.5',
            background: 'transparent', // Let container bg handle it
          }}
          showLineNumbers={showLineNumbers}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#6e7681',
            textAlign: 'right',
          }}
          wrapLines={true}
          wrapLongLines={true}
        >
          {content}
        </SyntaxHighlighter>
        
        {/* Floating Copy Button for easy access */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton 
            text={content} 
            variant="ghost" 
            size="icon-sm" 
            className="bg-[#252526] text-gray-300 hover:text-white hover:bg-[#323233] border border-gray-700" 
          />
        </div>
      </div>
    </div>
  );
}
