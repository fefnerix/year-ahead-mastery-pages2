import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import type { Components } from "react-markdown";

interface MarkdownRendererProps {
  content: string | null | undefined;
  className?: string;
}

const components: Components = {
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed text-foreground/90">{children}</p>
  ),
  h1: ({ children }) => (
    <h1 className="text-lg font-bold text-foreground mt-4 mb-2">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold text-foreground mt-3 mb-1.5">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-foreground mt-3 mb-1.5">{children}</h3>
  ),
  ul: ({ children }) => (
    <ul className="ml-5 mb-3 list-disc space-y-1 text-foreground/90">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="ml-5 mb-3 list-decimal space-y-1 text-foreground/90">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm leading-relaxed">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="text-foreground font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic">{children}</em>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline text-primary hover:text-primary/80 transition-colors"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary/40 pl-4 my-3 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-border/40" />,
  code: ({ children }) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground/80">
      {children}
    </code>
  ),
};

const MarkdownRenderer = ({ content, className = "" }: MarkdownRendererProps) => {
  if (!content) return null;

  return (
    <div className={`text-sm break-words ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
