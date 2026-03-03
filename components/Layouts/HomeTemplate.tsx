import React from 'react';
import { FrontMatter, ParsedFile } from '@/types';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import '@/stylesheet/home.css';

interface Props {
  file: ParsedFile;
  markdownSection?: {
    meta: FrontMatter;
    content: string;
  } | null;
}

export const HomeTemplate: React.FC<Props> = ({ file, markdownSection }) => {
  // If it's an HTML file, we can render it raw or parse it.
  // Render raw landing section first, and optionally append markdown section from Home.md.
  if (file.extension === 'html') {
    return (
      <div className="w-full">
        <div dangerouslySetInnerHTML={{ __html: file.content }} />
        {markdownSection && (
          <section className="w-full ">
            <div className="mx-auto max-w-4xl px-4 py-12">
              {markdownSection.meta.title && (
                <h2 className="mb-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {markdownSection.meta.title}
                </h2>
              )}
              <MarkdownRenderer content={markdownSection.content} />
            </div>
          </section>
        )}
      </div>
    );
  }

  // Fallback if it's markdown
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-4">{file.meta.title}</h1>
      <div>{file.content}</div>
    </div>
  );
};
