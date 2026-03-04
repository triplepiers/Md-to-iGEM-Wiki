import React from 'react';
import { ParsedFile } from '../../types';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { TableOfContents } from '../TableOfContents';

interface Props {
  file: ParsedFile;
}

export const DefaultTemplate: React.FC<Props> = ({ file }) => {
  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 md:py-12 flex items-start gap-12">
      {/* Main Content Column */}
      <div className="flex-1 min-w-0 max-w-4xl mx-auto xl:mx-0">
        {file.meta.title
        ?(<div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--c-h1)' }}>
            {file.meta.title}
          </h1>
          {file.meta.description && (
            <p className="mt-2 text-lg" style={{ color: 'var(--ft-clr)' }}>
              {file.meta.description}
            </p>
          )}
        </div>)
        :(<></>)}

        <MarkdownRenderer content={file.content} />
        
      </div>

      {/* Right Sidebar - Table of Contents */}
      <TableOfContents content={file.content} />
    </div>
  );
};
