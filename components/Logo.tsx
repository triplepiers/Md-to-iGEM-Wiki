import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <span className="leading-none">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300">
          iGEM
        </span>
        <span className="block text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
          FlowWiki
        </span>
      </span>
    </div>
  );
};
