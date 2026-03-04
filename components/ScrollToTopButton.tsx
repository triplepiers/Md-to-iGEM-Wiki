import React from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  visible: boolean;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({ visible }) => {
  if (!visible) {
    return null;
  }

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      aria-label="Scroll to top"
      className="scroll-to-top-btn fixed bottom-6 right-6 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-lg backdrop-blur transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <ArrowUp size={20} />
    </button>
  );
};
