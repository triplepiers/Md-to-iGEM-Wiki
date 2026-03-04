import React, { useEffect } from 'react';

interface LoadingOverlayProps {
  visible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible }) => {
  const loadingText = 'loading ...';

  useEffect(() => {
    if (!visible) {
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
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-label="Loading">
      <div className="loading-overlay-inner">
        <svg
          className="loading-spinner"
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle className="loading-spinner-ring" cx="32" cy="32" r="22" />
          <circle className="loading-spinner-dot" cx="32" cy="10" r="4" />
        </svg>
        <p className="loading-text" aria-hidden="true">
          {loadingText.split('').map((char, index) => (
            <span
              key={`${char}-${index}`}
              className="loading-text-char"
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
};
