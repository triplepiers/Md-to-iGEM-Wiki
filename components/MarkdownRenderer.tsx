import React, { useEffect, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import js from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import ts from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import { Check, Copy } from 'lucide-react';
import { slugify } from '@/utils/slug';
import { resolveAppLinkHref } from '@/utils/internalLink';

interface MarkdownRendererProps {
  content: string;
}

interface CodeBlockWithCopyProps {
  code: string;
  language: string;
}

SyntaxHighlighter.registerLanguage('js', js);
SyntaxHighlighter.registerLanguage('javascript', js);
SyntaxHighlighter.registerLanguage('ts', ts);
SyntaxHighlighter.registerLanguage('typescript', ts);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('xml', markup);
SyntaxHighlighter.registerLanguage('markdown', markup);

const CodeBlockWithCopy: React.FC<CodeBlockWithCopyProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Code copied' : 'Copy code'}
        className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-600/70 bg-slate-800/80 text-slate-100 transition-colors hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <SyntaxHighlighter
        // @ts-ignore
        style={oneDark}
        language={language}
        PreTag="div"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [isHtmlDark, setIsHtmlDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );

  const headingIdFactory = useMemo(() => {
    const usedIds = new Map<string, number>();

    return (text: string) => {
      const baseId = slugify(text);
      const count = usedIds.get(baseId) ?? 0;
      usedIds.set(baseId, count + 1);
      return count === 0 ? baseId : `${baseId}-${count + 1}`;
    };
  }, [content]);

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
      const id = headingIdFactory(text);
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
          pre({ node, children, ...props }: any) {
            const child = React.Children.toArray(children)[0];

            if (!React.isValidElement(child)) {
              return <pre {...props}>{children}</pre>;
            }

            const className = ((child.props as { className?: string }).className || '');
            const match = /language-(\w+)/.exec(className);
            const codeContent = String((child.props as { children?: React.ReactNode }).children ?? '').replace(
              /\n$/,
              ''
            );

            return <CodeBlockWithCopy code={codeContent} language={match?.[1] || 'text'} />;
          },
          code({ className, children, ...props }: any) {
            return (
              <code className={['inline', className].filter(Boolean).join(' ')} {...props}>
                {children}
              </code>
            );
          },
          // Custom handling for links
          a({ node, href, children, ...props }) {
            const isExternal = !!href && /^(https?:)?\/\//i.test(href);
            const isSpecialScheme = !!href && /^(mailto:|tel:)/i.test(href);
            const isInPageAnchor = !!href && href.startsWith('#') && !href.startsWith('#/');
            const processedHref = href ? resolveAppLinkHref(href) : href;

            const handleAnchorClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
              if (!isInPageAnchor || !href) {
                return;
              }

              const targetId = href.slice(1);
              if (!targetId) {
                return;
              }

              const element = document.getElementById(targetId);
              if (!element) {
                return;
              }

              event.preventDefault();
              const headerOffset = 80;
              const elementPosition = element.getBoundingClientRect().top;
              const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
              });
            };
            
            return (
              <a 
                href={processedHref} 
                onClick={handleAnchorClick}
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
