import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
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
import { Check, ChevronDown, ChevronUp, Copy, Minus, Plus, X } from 'lucide-react';
import { slugify } from '@/utils/slug';
import { resolveAppLinkHref } from '@/utils/internalLink';
import { ExcelTable } from '@/components/ExcelTable';
import { EChart } from '@/components/EChart';

interface MarkdownRendererProps {
  content: string;
}

interface CodeBlockWithCopyProps {
  code: string;
  language: string;
}

interface FigureItem {
  declaredIndex: number;
  src: string;
  caption: string;
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

const extractFigureItems = (markdown: string): FigureItem[] => {
  const figures: FigureItem[] = [];
  const figureRegex =
    /<figure[^>]*class="md-figure"[^>]*data-figure-index="(\d+)"[^>]*>[\s\S]*?<img[^>]*class="md-figure-img"[^>]*src="([^"]+)"[^>]*>[\s\S]*?<figcaption[^>]*>([\s\S]*?)<\/figcaption>[\s\S]*?<\/figure>/g;

  let match: RegExpExecArray | null;
  while ((match = figureRegex.exec(markdown)) !== null) {
    const declaredIndex = Number(match[1]);
    const src = match[2]?.trim();
    const caption = match[3]?.replace(/<[^>]+>/g, '').trim();
    if (!src) {
      continue;
    }

    figures.push({
      declaredIndex: Number.isFinite(declaredIndex) ? declaredIndex : figures.length + 1,
      src,
      caption: caption || '',
    });
  }

  figures.sort((a, b) => a.declaredIndex - b.declaredIndex);
  return figures;
};

const chartModuleLoaders = import.meta.glob('./Charts/*.tsx');
const chartModuleByFile: Record<string, () => Promise<any>> = {};
Object.entries(chartModuleLoaders).forEach(([path, loader]) => {
  const fileName = path.split('/').pop();
  if (fileName) {
    chartModuleByFile[fileName] = loader as () => Promise<any>;
  }
});

const ChartRenderer: React.FC<{ file: string; height: number | string }> = ({
  file,
  height,
}) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;
    setComponent(null);
    setError('');

    const loader = chartModuleByFile[file];
    if (!loader) {
      setError(`Chart component not found: ${file}`);
      return () => {
        isActive = false;
      };
    }

    loader()
      .then((mod: any) => {
        const resolved = mod?.default ?? mod?.[Object.keys(mod ?? {})[0]];
        if (!resolved) {
          throw new Error('No component export found');
        }
        if (isActive) {
          setComponent(() => resolved);
        }
      })
      .catch((err: any) => {
        if (isActive) {
          setError(err?.message ?? 'Failed to load chart component');
        }
      });

    return () => {
      isActive = false;
    };
  }, [file]);

  if (error) {
    return <div className="text-sm text-red-600 dark:text-red-400">Warning: {error}</div>;
  }

  if (!Component) {
    return <div className="text-sm text-slate-500 dark:text-slate-400">Loading chart...</div>;
  }

  return <Component height={height} />;
};

const resolveChartHeight = (rawValue: unknown): number | string => {
  const normalized = String(rawValue ?? '').trim();
  if (!normalized) {
    return 360;
  }

  if (/^\d+(\.\d+)?$/.test(normalized)) {
    return Number(normalized);
  }

  return normalized;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [isHtmlDark, setIsHtmlDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [slideToken, setSlideToken] = useState(0);
  const [isLightboxClosing, setIsLightboxClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const figureItems = useMemo(() => extractFigureItems(content), [content]);
  const figureDeclaredIndexToPosition = useMemo(() => {
    const mapping = new Map<number, number>();
    figureItems.forEach((item, index) => {
      mapping.set(item.declaredIndex, index);
    });
    return mapping;
  }, [figureItems]);
  const isLightboxOpen = lightboxIndex !== null && lightboxIndex >= 0 && lightboxIndex < figureItems.length;
  const currentFigure = isLightboxOpen ? figureItems[lightboxIndex] : null;

  const openLightboxAt = useCallback((index: number) => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsLightboxClosing(false);
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    if (!isLightboxOpen || isLightboxClosing) {
      return;
    }

    setIsLightboxClosing(true);
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      setLightboxIndex(null);
      setIsLightboxClosing(false);
      closeTimerRef.current = null;
    }, 180);
  }, [isLightboxClosing, isLightboxOpen]);

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

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isLightboxOpen]);

  useEffect(
    () => () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, [lightboxIndex]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeLightbox();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setLightboxIndex((prev) => {
          if (prev === null || figureItems.length === 0) return prev;
          return (prev - 1 + figureItems.length) % figureItems.length;
        });
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setLightboxIndex((prev) => {
          if (prev === null || figureItems.length === 0) return prev;
          return (prev + 1) % figureItems.length;
        });
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [closeLightbox, figureItems.length, isLightboxOpen]);

  const goPrev = () => {
    setLightboxIndex((prev) => {
      if (prev === null || figureItems.length === 0) return prev;
      setSlideDirection('right');
      setSlideToken((token) => token + 1);
      return (prev - 1 + figureItems.length) % figureItems.length;
    });
  };

  const goNext = () => {
    setLightboxIndex((prev) => {
      if (prev === null || figureItems.length === 0) return prev;
      setSlideDirection('left');
      setSlideToken((token) => token + 1);
      return (prev + 1) % figureItems.length;
    });
  };

  const applyZoom = (nextZoom: number) => {
    const clamped = Math.min(4, Math.max(0.6, Number(nextZoom.toFixed(2))));
    setZoom(clamped);
    if (clamped <= 1) {
      setOffset({ x: 0, y: 0 });
    }
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (!event.ctrlKey) {
      return;
    }
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.12 : -0.12;
    applyZoom(zoom + delta);
  };

  const handlePointerDown = (event: React.MouseEvent) => {
    if (zoom <= 1) {
      return;
    }
    setIsDragging(true);
    setDragStart({
      x: event.clientX - offset.x,
      y: event.clientY - offset.y,
    });
  };

  const handlePointerMove = (event: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) {
      return;
    }
    setOffset({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

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
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
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
          table: (props: any) => {
            const dataUrl =
              props?.['data-excel-url'] ??
              (props as any)?.dataExcelUrl ??
              (props as any)?.['data-url'];
            if (dataUrl) {
              return <ExcelTable url={String(dataUrl)} />;
            }
            return <table {...props} />;
          },
          div: (props: any) => {
            const rawFile =
              props?.['data-chart-file'] ??
              (props as any)?.dataChartFile ??
              '';
            if (!rawFile) {
              return <div {...props} />;
            }

            const rawHeight =
              props?.['data-height'] ??
              (props as any)?.dataHeight ??
              '';
            const file = String(rawFile).trim();
            const height = resolveChartHeight(rawHeight);

            return <ChartRenderer file={file} height={height} />;
          },
          echart: (props: any) => <EChart {...props} />,
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
          img({ node, className, src, alt, ...props }: any) {
            const mergedClassName = [className, ''].filter(Boolean).join(' ').trim();
            const isFigureImage = /\bmd-figure-img\b/.test(mergedClassName);
            if (!isFigureImage) {
              return <img className={className} src={src} alt={alt} {...props} />;
            }
            const rawDeclaredIndex =
              (props as any)['data-figure-index'] ?? node?.properties?.['data-figure-index'];
            const declaredIndex = Number(rawDeclaredIndex);
            const currentIndex =
              (Number.isFinite(declaredIndex) &&
                figureDeclaredIndexToPosition.get(declaredIndex) !== undefined)
                ? (figureDeclaredIndexToPosition.get(declaredIndex) as number)
                : -1;

            return (
              <img
                className={mergedClassName}
                src={src}
                alt={alt}
                onClick={(event) => {
                  if (currentIndex < 0) {
                    return;
                  }
                  event.stopPropagation();
                  setSlideDirection('left');
                  setSlideToken((token) => token + 1);
                  openLightboxAt(currentIndex);
                }}
                {...props}
              />
            );
          },
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

      {isLightboxOpen && currentFigure && (
        <div
          className={`figure-lightbox-overlay ${isLightboxClosing ? 'is-closing' : ''}`}
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            type="button"
            className="figure-lightbox-close"
            aria-label="Close image viewer"
            onClick={closeLightbox}
          >
            <X size={20} />
          </button>

          <div className="figure-lightbox-controls" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="figure-lightbox-control-btn"
              aria-label="Zoom in"
              onClick={() => applyZoom(zoom + 0.15)}
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              className="figure-lightbox-control-btn"
              aria-label="Zoom out"
              onClick={() => applyZoom(zoom - 0.15)}
            >
              <Minus size={16} />
            </button>
            <button
              type="button"
              className="figure-lightbox-control-btn"
              aria-label="Previous image"
              onClick={goPrev}
            >
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              className="figure-lightbox-control-btn"
              aria-label="Next image"
              onClick={goNext}
            >
              <ChevronDown size={16} />
            </button>
          </div>

          <div
            className="figure-lightbox-stage"
            onClick={(event) => event.stopPropagation()}
            onWheel={handleWheel}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
          >
            <div
              key={`${lightboxIndex}-${slideToken}`}
              className={`figure-lightbox-image-shell ${
                slideDirection === 'left'
                  ? 'figure-lightbox-image-shell-enter-left'
                  : 'figure-lightbox-image-shell-enter-right'
              }`}
            >
              <img
                src={currentFigure.src}
                alt={currentFigure.caption || 'Image preview'}
                className={`figure-lightbox-image ${isDragging ? 'is-dragging' : ''}`}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                }}
                onMouseDown={handlePointerDown}
                draggable={false}
              />
            </div>
          </div>

          <div className="figure-lightbox-footer" onClick={(event) => event.stopPropagation()}>
            <div className="figure-lightbox-caption">{currentFigure.caption}</div>
            {figureItems.length <= 5 ? (
              <div className="figure-lightbox-dots">
                {figureItems.map((_, index) => (
                  <button
                    key={`dot-${index}`}
                    type="button"
                    className={`figure-lightbox-dot ${index === lightboxIndex ? 'is-active' : ''}`}
                    onClick={() => {
                      if (lightboxIndex === null) {
                        setSlideDirection('left');
                      } else {
                        setSlideDirection(index >= lightboxIndex ? 'left' : 'right');
                      }
                      setSlideToken((token) => token + 1);
                      setLightboxIndex(index);
                    }}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            ) : (
              <div className="figure-lightbox-counter">
                {String((lightboxIndex ?? 0) + 1).padStart(2, '0')}/
                {String(figureItems.length).padStart(2, '0')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
