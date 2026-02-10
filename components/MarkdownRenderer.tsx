import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { slugify } from '@/utils/slug';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  
  // Helper to create heading components with IDs
  const createHeading = (level: number) => {
    return ({ children, ...props }: any) => {
      // Recursively extract text content from children to generate the slug
      const extractText = (node: React.ReactNode): string => {
        if (typeof node === 'string' || typeof node === 'number') {
          return String(node);
        }
        if (React.isValidElement(node)) {
          const { children } = node.props as { children?: React.ReactNode };
          return extractText(children);
        }
        if (Array.isArray(node)) {
          return node.map(extractText).join('');
        }
        return '';
      };

      const text = extractText(children);
      
      const id = slugify(text);
      const Tag = `h${level}` as React.ElementType;

      return (
        <Tag id={id} className="group relative" {...props}>
          {children}
        </Tag>
      );
    };
  };

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                // @ts-ignore
                style={oneDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Custom handling for links
          a({ node, href, children, ...props }) {
            const isExternal = href?.startsWith('http');
            const processedHref = isExternal ? href : `#/${href?.replace(/^\//, '')}`;
            
            return (
              <a 
                href={processedHref} 
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            );
          },
          // Headings with IDs
          h1: createHeading(1),
          h2: createHeading(2),
          h3: createHeading(3),
          h4: createHeading(4),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};