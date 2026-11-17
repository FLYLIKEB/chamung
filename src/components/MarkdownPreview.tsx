import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from './ui/utils';

// Preview content is readable Markdown, with navigation owned by the card.
export function MarkdownPreview({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('whitespace-pre-line break-words [&_p]:m-0 [&_pre]:whitespace-pre-wrap [&_code]:font-[inherit] [&_h1]:font-[inherit] [&_h2]:font-[inherit] [&_h3]:font-[inherit]', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ children }) => <span>{children}</span>,
          img: ({ alt }) => <span>{alt}</span>,
          input: () => null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

