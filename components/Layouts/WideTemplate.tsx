import React from 'react';
import { ParsedFile } from '@/types';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import '@/stylesheet/default.css';

interface Props {
  file: ParsedFile;
}

export const WideTemplate: React.FC<Props> = ({ file }) => {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-12">
      <div className="rounded-xl p-8 mb-8 border border-slate-200 dark:border-slate-800">
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">
            {file.meta.title}
        </h1>
        <div className="font-mono text-sm">Template: Wide</div>
      </div>
      
      <div className="rounded-xl p-0 md:p-6">
        <MarkdownRenderer content={file.content} />
      </div>
    </div>
  );
};
