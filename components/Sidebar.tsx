import React, { useState } from 'react';
import { NavigationItem } from '@/types';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface MobileMenuProps {
  navItems: NavigationItem[];
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
}

const MobileNavItem: React.FC<{ item: NavigationItem; currentPath: string; onClose: () => void }> = ({ item, currentPath, onClose }) => {
  const [expanded, setExpanded] = useState(true);
  const isActive = currentPath === item.path;
  const isDirectory = !!item.children;

  const handleToggle = (e: React.MouseEvent) => {
    if (isDirectory) {
      e.preventDefault();
      setExpanded(!expanded);
    }
  };

  return (
    <div className="mb-1">
      <div
        className={`
          flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer text-sm font-medium transition-colors select-none
          ${isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
        `}
        style={{ paddingLeft: `${item.level * 16 + 16}px` }}
      >
        {isDirectory ? (
          <div onClick={handleToggle} className="mr-3 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400">
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
        ) : (
           <span className="w-4 mr-3" /> // Spacer
        )}
        
        {isDirectory ? (
          <span className="flex-1" onClick={handleToggle}>{item.title}</span>
        ) : (
          <a 
             href={`#/${item.path}`} 
             className="flex-1 block"
             onClick={() => onClose()}
          >
            {item.title}
          </a>
        )}
      </div>

      {isDirectory && expanded && item.children && (
        <div className="bg-slate-50/50 dark:bg-black/20">
          {item.children.map((child) => (
            <MobileNavItem 
                key={child.path} 
                item={child} 
                currentPath={currentPath} 
                onClose={onClose}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const MobileMenu: React.FC<MobileMenuProps> = ({ navItems, currentPath, isOpen, onClose }) => {
  return (
    <div className="md:hidden">
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Mobile Drawer */}
      <aside 
        className={`
          fixed top-0 bottom-0 left-0 w-[80%] max-w-sm bg-white dark:bg-slate-900 shadow-2xl
          z-50 transform transition-transform duration-300 ease-out overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="font-bold text-lg text-slate-800 dark:text-slate-100">Menu</span>
            <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                ✕
            </button>
        </div>
        <nav className="py-2">
            {navItems.map((item) => (
                <MobileNavItem 
                    key={item.path} 
                    item={item} 
                    currentPath={currentPath} 
                    onClose={onClose}
                />
            ))}
        </nav>
      </aside>
    </div>
  );
};