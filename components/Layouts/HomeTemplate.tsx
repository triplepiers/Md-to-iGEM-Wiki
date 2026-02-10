import React from 'react';
import { ParsedFile } from '@/types';

interface Props {
  file: ParsedFile;
}

export const HomeTemplate: React.FC<Props> = ({ file }) => {
  // If it's an HTML file, we can render it raw or parse it.
  // For the demo, we render raw HTML content if the extension is .html
  if (file.extension === 'html') {
    return (
      <div 
        className="w-full h-full min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-white dark:bg-slate-950 px-4"
        dangerouslySetInnerHTML={{ __html: file.content }}
      />
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
