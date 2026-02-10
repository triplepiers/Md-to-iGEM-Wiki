import React, { useEffect, useState, useMemo } from 'react';
import { extractHeadings } from '@/utils/slug';
import '@/stylesheet/TableOfContents.css';

interface TableOfContentsProps {
  content: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ content }) => {
  const [activeId, setActiveId] = useState<string>('');
  const headings = useMemo(() => extractHeadings(content), [content]);

  // Determine the index of the currently active heading
  const activeIndex = useMemo(() => {
    return headings.findIndex((heading) => heading.id === activeId);
  }, [activeId, headings]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-10% 0px -80% 0px', // Trigger when element is near the top
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

  const handleScrollTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Adjust offset for fixed header
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update active ID manually for immediate feedback
      setActiveId(id);
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav className="toc-nav">
      <h4 className="toc-title">
        On this page
      </h4>
      <ul className="toc-list">
        {headings.map((heading, index) => {
          // Determine state: Current, Past, or Future
          const isCurrent = activeId === heading.id;
          const isPast = activeIndex !== -1 && index < activeIndex;
          
          let stateClass = 'toc-link-future';
          if (isCurrent) stateClass = 'toc-link-active';
          else if (isPast) stateClass = 'toc-link-past';

          return (
            <li 
              key={heading.id} 
              style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
            >
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