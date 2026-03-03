import React, { useEffect, useState } from 'react';
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
  const [isHtmlDark, setIsHtmlDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const root = document.documentElement;
    const syncDarkClass = () => setIsHtmlDark(root.classList.contains('dark'));
    syncDarkClass();

    const classObserver = new MutationObserver(syncDarkClass);
    classObserver.observe(root, { attributes: true, attributeFilter: ['class'] });

    const allowedOrigins = new Set(['https://attributions.igem.org', 'https://teams.igem.org']);

    const handleAttributionResize = (event: MessageEvent) => {
      if (!allowedOrigins.has(event.origin)) {
        return;
      }

      let payload: any = event.data;

      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          return;
        }
      }

      if (!payload || payload.type !== 'igem-attribution-form') {
        return;
      }

      const rawHeight = Number(payload.data);
      if (!Number.isFinite(rawHeight) || rawHeight <= 0) {
        return;
      }

      const iframe = document.getElementById('igem-attribution-form') as HTMLIFrameElement | null;
      if (!iframe) {
        return;
      }

      iframe.style.height = `${Math.ceil(rawHeight + 50)}px`;
    };

    window.addEventListener('message', handleAttributionResize);
    return () => {
      classObserver.disconnect();
      window.removeEventListener('message', handleAttributionResize);
    };
  }, []);
  
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
          iframe({ node, style, ...props }: any) {
            const iframeStyle =
              style && typeof style === 'object' && !Array.isArray(style) ? style : {};
            const isAttributionIframe = props.id === 'igem-attribution-form';
            const darkModeStyle =
              isAttributionIframe && isHtmlDark
                ? {
                    filter: 'invert(1) hue-rotate(180deg)',
                  }
                : {};
            const mergedStyle = {
              width: '100%',
              border: 0,
              minHeight: '640px',
              ...iframeStyle,
              ...darkModeStyle,
            };

            return <iframe {...props} style={mergedStyle} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
