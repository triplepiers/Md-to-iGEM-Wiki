import React, { useState, useEffect, useMemo, useLayoutEffect, useRef } from 'react';
import { VIRTUAL_FILE_SYSTEM } from './constants';
import { 
  buildFileMap, 
  parseFrontMatter, 
  processCustomExtensions, 
  buildNavigation 
} from './utils/fs';
import { ParsedFile, FileType } from './types';
import { MobileMenu } from './components/Sidebar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeTemplate } from './components/Layouts/HomeTemplate';
import { DefaultTemplate } from './components/Layouts/DefaultTemplate';
import { WideTemplate } from './components/Layouts/WideTemplate';
import { NAVIGATION_ORDER } from './config/navOrder';

const HOME_MARKDOWN_PATH = 'Home.md';

const getCleanPathFromHash = (hash: string): string => {
  const rawPath = hash.replace(/^#\/?/, '');
  return rawPath === '' ? 'index.html' : rawPath;
};

const App: React.FC = () => {
  // 1. Router State
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setDarkMode] = useState(false);
  const scrollPositionsRef = useRef<Record<string, number>>({});
  const currentPathRef = useRef(getCleanPathFromHash(window.location.hash || '#/'));

  // 2. Computed Data
  const fileMap = useMemo(() => buildFileMap(VIRTUAL_FILE_SYSTEM), []);
  const navItems = useMemo(() => {
    return buildNavigation(VIRTUAL_FILE_SYSTEM, 0, NAVIGATION_ORDER).filter(
      (item) => item.path !== HOME_MARKDOWN_PATH
    );
  }, []);

  // 3. Current Path Logic
  const cleanPath = getCleanPathFromHash(currentHash);

  // 4. File Resolution
  const activeFileNode = fileMap[cleanPath] || fileMap[`${cleanPath}/index.html`] || null;
  
  // 5. Load Content & Parse
  const parsedFile: ParsedFile | null = useMemo(() => {
    if (!activeFileNode || activeFileNode.type !== FileType.FILE || !activeFileNode.content) return null;

    if (activeFileNode.name.endsWith('.html')) {
        return {
            meta: { template: 'home' },
            content: activeFileNode.content,
            rawContent: activeFileNode.content,
            path: activeFileNode.path,
            extension: 'html'
        };
    }

    const { meta, body } = parseFrontMatter(activeFileNode.content);
    const processedBody = processCustomExtensions(body, fileMap);

    return {
      meta,
      content: processedBody,
      rawContent: activeFileNode.content,
      path: activeFileNode.path,
      extension: 'md'
    };
  }, [activeFileNode, fileMap]);

  const homeMarkdownSection = useMemo(() => {
    const homeFileNode = fileMap[HOME_MARKDOWN_PATH];
    if (!homeFileNode || homeFileNode.type !== FileType.FILE || !homeFileNode.content) {
      return null;
    }

    const { meta, body } = parseFrontMatter(homeFileNode.content);
    const processedBody = processCustomExtensions(body, fileMap);

    return {
      meta,
      content: processedBody,
    };
  }, [fileMap]);

  // 6. Router Listeners
  useEffect(() => {
    const handleHashChange = () => {
      const previousPath = currentPathRef.current;
      scrollPositionsRef.current[previousPath] = window.scrollY;
      setCurrentHash(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 7. Per-page scroll memory
  useLayoutEffect(() => {
    const savedScrollY = scrollPositionsRef.current[cleanPath] ?? 0;
    window.scrollTo(0, savedScrollY);
    currentPathRef.current = cleanPath;
  }, [cleanPath]);

  // 8. Theme Toggle
  useEffect(() => {
      if (isDarkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [isDarkMode]);

  // 9. Template Selection
  const renderTemplate = () => {
    if (!parsedFile) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
                <h2 className="text-2xl font-bold mb-2">404 Not Found</h2>
                <p>Could not find file: {cleanPath}</p>
                <a href="#/" className="text-blue-500 hover:underline mt-4">Go Home</a>
            </div>
        );
    }

    // Special case for Home
    if (parsedFile.path === 'index.html' || parsedFile.meta.template === 'home') {
        return <HomeTemplate file={parsedFile} markdownSection={homeMarkdownSection} />;
    }

    switch (parsedFile.meta.template) {
        case 'wide':
            return <WideTemplate file={parsedFile} />;
        case 'default':
        default:
            return <DefaultTemplate file={parsedFile} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        navItems={navItems}
        currentPath={parsedFile?.path || ''}
        isDarkMode={isDarkMode}
        setDarkMode={setDarkMode}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Mobile Menu (Slide-out) */}
      <MobileMenu 
        navItems={navItems} 
        currentPath={parsedFile?.path || ''} 
        isOpen={isMobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <main className="pt-16 flex-1 w-full">
         {renderTemplate()}
      </main>

      <Footer />
    </div>
  );
};

export default App;
