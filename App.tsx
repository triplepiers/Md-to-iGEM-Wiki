import React, { useState, useEffect, useMemo } from 'react';
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
import { HomeTemplate } from './components/Layouts/HomeTemplate';
import { DefaultTemplate } from './components/Layouts/DefaultTemplate';
import { WideTemplate } from './components/Layouts/WideTemplate';

const App: React.FC = () => {
  // 1. Router State
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setDarkMode] = useState(false);

  // 2. Computed Data
  const fileMap = useMemo(() => buildFileMap(VIRTUAL_FILE_SYSTEM), []);
  const navItems = useMemo(() => buildNavigation(VIRTUAL_FILE_SYSTEM), []);

  // 3. Current Path Logic
  const rawPath = currentHash.replace(/^#\/?/, '');
  const cleanPath = rawPath === '' ? 'index.html' : rawPath;

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

  // 6. Router Listeners
  useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 7. Theme Toggle
  useEffect(() => {
      if (isDarkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [isDarkMode]);

  // 8. Template Selection
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
        return <HomeTemplate file={parsedFile} />;
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
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
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
      
      {/* Global styles for raw HTML injection */}
      <style>{`
        .hero { 
            text-align: center; 
            padding: 6rem 1rem; 
        }
        .hero h1 { 
            font-size: 3.5rem; 
            font-weight: 800; 
            margin-bottom: 1.5rem;
            letter-spacing: -0.05em;
        }
        .dark .hero h1 { color: white; }
        .hero p { 
            font-size: 1.25rem; 
            color: #64748b; 
            max-width: 600px; 
            margin: 0 auto 2.5rem; 
        }
        .dark .hero p { color: #94a3b8; }
        .actions { 
            display: flex; 
            gap: 1rem; 
            justify-content: center; 
        }
        .btn-primary { 
            background: #2563eb; 
            color: white; 
            padding: 0.75rem 1.5rem; 
            border-radius: 0.5rem; 
            font-weight: 600; 
            text-decoration: none; 
            transition: background 0.2s;
        }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-secondary { 
            background: #f1f5f9; 
            color: #0f172a; 
            padding: 0.75rem 1.5rem; 
            border-radius: 0.5rem; 
            font-weight: 600; 
            text-decoration: none; 
            transition: background 0.2s;
        }
        .dark .btn-secondary { background: #1e293b; color: white; }
        .btn-secondary:hover { background: #e2e8f0; }
        .dark .btn-secondary:hover { background: #334155; }
      `}</style>
    </div>
  );
};

export default App;