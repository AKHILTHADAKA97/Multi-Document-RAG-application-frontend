import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';

const sanitizeSchema = {
  tagNames: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'blockquote', 'hr',
    'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div',
  ],
  attributes: {
    '*': ['className', 'id'],
    a: ['href', 'target', 'rel', 'title'],
    code: ['className'],
    th: ['align'],
    td: ['align'],
  },
  allowComments: false,
};

function CodeBlock({ node, ...props }) {
  const className = node.className || '';
  const language = className.replace(/language-/, '') || 'plaintext';
  const codeString = String(props.children).replace(/\n$/, '');

  const [copied, setCopied] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {language === 'plaintext' ? 'code' : language}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleCopy}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
            title="Copy code"
          >
            {copied ? (
              <>
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className={expanded ? '' : 'max-h-64 overflow-y-auto'}>
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            padding: '1rem 1.25rem',
            fontSize: '0.8125rem',
            lineHeight: '1.6',
            fontFamily: 'JetBrains Mono, Fira Code, Menlo, Monaco, monospace',
            overflowX: 'auto',
            minHeight: expanded ? 'auto' : '0',
            maxHeight: expanded ? 'none' : '600px',
          }}
          showLineNumbers={true}
          lineNumberStyle={{
            color: '#5e6b8a',
            paddingRight: '1rem',
            userSelect: 'none',
          }}
          wrapLines={true}
          lineProps={{ className: 'code-line' }}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function InlineCode({ children, ...props }) {
  return (
    <code
      className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-200"
      {...props}
    >
      {children}
    </code>
  );
}

function Table({ children, ...props }) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm" {...props}>
        {children}
      </table>
    </div>
  );
}

function Thead({ children, ...props }) {
  return (
    <thead className="bg-slate-50" {...props}>
      {children}
    </thead>
  );
}

function Th({ children, ...props }) {
  return (
    <th className="px-4 py-3 text-left font-semibold text-slate-900 border-b border-slate-200" {...props}>
      {children}
    </th>
  );
}

function Tbody({ children, ...props }) {
  return (
    <tbody className="bg-white divide-y divide-slate-100" {...props}>
      {children}
    </tbody>
  );
}

function Tr({ children, ...props }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors" {...props}>
      {children}
    </tr>
  );
}

function Td({ children, ...props }) {
  return (
    <td className="px-4 py-3 text-slate-700" {...props}>
      {children}
    </td>
  );
}

function Blockquote({ children, ...props }) {
  return (
    <blockquote className="my-4 border-l-4 border-primary-400 pl-4 py-1 italic text-slate-600 bg-slate-50/50 rounded-r-lg" {...props}>
      {children}
    </blockquote>
  );
}

function Hr({ ...props }) {
  return <hr className="my-6 border-slate-200" {...props} />;
}

function Link({ href, children, ...props }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary-600 underline underline-offset-2 hover:text-primary-700 transition-colors"
      {...props}
    >
      {children}
    </a>
  );
}

function Ul({ children, ...props }) {
  return (
    <ul className="list-disc pl-6 my-3 space-y-1.5 text-slate-800" {...props}>
      {children}
    </ul>
  );
}

function Ol({ children, ...props }) {
  return (
    <ol className="list-decimal pl-6 my-3 space-y-1.5 text-slate-800" {...props}>
      {children}
    </ol>
  );
}

function Li({ children, ...props }) {
  return (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  );
}

function Strong({ children, ...props }) {
  return <strong className="font-semibold text-slate-900" {...props}>{children}</strong>;
}

function Em({ children, ...props }) {
  return <em className="italic text-slate-800" {...props}>{children}</em>;
}

function Paragraph({ children, ...props }) {
  return <p className="mb-4 leading-relaxed text-slate-800" {...props}>{children}</p>;
}

function Heading1({ children, ...props }) {
  return <h1 className="text-2xl font-bold text-slate-900 mt-8 mb-4 leading-tight" {...props}>{children}</h1>;
}

function Heading2({ children, ...props }) {
  return <h2 className="text-xl font-bold text-slate-900 mt-7 mb-3 leading-tight" {...props}>{children}</h2>;
}

function Heading3({ children, ...props }) {
  return <h3 className="text-lg font-semibold text-slate-900 mt-6 mb-2 leading-snug" {...props}>{children}</h3>;
}

function Heading4({ children, ...props }) {
  return <h4 className="text-base font-semibold text-slate-900 mt-5 mb-2 leading-snug" {...props}>{children}</h4>;
}

const components = {
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  h4: Heading4,
  p: Paragraph,
  strong: Strong,
  em: Em,
  code: InlineCode,
  pre: CodeBlock,
  blockquote: Blockquote,
  hr: Hr,
  table: Table,
  thead: Thead,
  th: Th,
  tbody: Tbody,
  tr: Tr,
  td: Td,
  a: Link,
  ul: Ul,
  ol: Ol,
  li: Li,
};

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content || !content.trim()) {
    return <div className={className} />;
  }

  return (
    <div className={`prose prose-slate max-w-none ${className}`}>
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        allowedElements={sanitizeSchema.tagNames}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}