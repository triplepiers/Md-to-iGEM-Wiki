import React, { useEffect, useState } from 'react';
import { HeadingData } from '@/utils/slug';
import '@/stylesheet/TableOfContents.css';

interface TableOfContentsProps {
  content: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [activeId, setActiveId] = useState<string>('');
  const [headings, setHeadings] = useState<HeadingData[]>([]);

  useEffect(() => {
    const headingElements = Array.from(
      document.querySelectorAll<HTMLElement>('.prose h1[id], .prose h2[id], .prose h3[id], .prose h4[id]')
    );

    const nextHeadings = headingElements
      .map((element) => {
        const level = Number(element.tagName.slice(1));
        const text = element.textContent?.trim() ?? '';
        const id = element.id;

        if (!id || !text || Number.isNaN(level)) {
          return null;
        }

        return { id, text, level };
      })
      .filter((heading): heading is HeadingData => heading !== null);

    setHeadings(nextHeadings);
    setActiveId(nextHeadings[0]?.id ?? '');
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: '-10% 0px -80% 0px',
        threshold: 0.1,
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  const activeIndex = headings.findIndex((heading) => heading.id === activeId);

  const handleScrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      setActiveId(id);
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav className="toc-nav">
      <h4 className="toc-title">On this page</h4>
      <ul className="toc-list">
        {headings.map((heading, index) => {
          const isCurrent = activeId === heading.id;
          const isPast = activeIndex !== -1 && index < activeIndex;

          let stateClass = 'toc-link-future';
          if (isCurrent) stateClass = 'toc-link-active';
          else if (isPast) stateClass = 'toc-link-past';

          return (
            <li key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleScrollTo(e, heading.id)}
                className={`toc-link ${stateClass}`}
              >
                {heading.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
