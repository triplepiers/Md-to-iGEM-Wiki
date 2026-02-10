import React from 'react';
import { NavigationItem } from '@/types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TopNavProps {
  navItems: NavigationItem[];
  currentPath: string;
}

const TopNavItem: React.FC<{ item: NavigationItem; currentPath: string; depth?: number }> = ({ item, currentPath, depth = 0 }) => {
  const isDirectory = !!item.children;
  const isActive = currentPath === item.path || (isDirectory && currentPath.startsWith(item.path));

  // Render Leaf (File)
  if (!isDirectory) {
    return (
      <a
        href={`#/${item.path}`}
        className={`
          block px-4 py-2 text-sm whitespace-nowrap transition-colors
          ${isActive 
            ? 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400' 
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }
        `}
      >
        {item.title}
      </a>
    );
  }

  // Render Directory (Dropdown)
  return (
    <div className="group relative">
      {/* Trigger */}
      <div 
        className={`
          flex items-center gap-1 px-3 py-2 text-sm font-medium cursor-pointer transition-colors rounded-md
          ${isActive 
             ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-slate-800/50' 
             : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }
          ${depth > 0 ? 'justify-between w-full px-4' : ''}
        `}
      >
        <span>{item.title}</span>
        {depth === 0 ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </div>

      {/* Dropdown Content */}
      <div 
        className={`
          absolute z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200
          bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 min-w-[200px]
          ${depth === 0 ? 'top-full left-0 mt-1' : 'top-0 left-full ml-1'}
        `}
      >
        {item.children?.map((child) => (
          <TopNavItem 
            key={child.path} 
            item={child} 
            currentPath={currentPath} 
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  );
};

export const TopNav: React.FC<TopNavProps> = ({ navItems, currentPath }) => {
  return (
    <nav className="hidden md:flex items-center gap-1">
      {navItems.map((item) => (
        <TopNavItem key={item.path} item={item} currentPath={currentPath} />
      ))}
    </nav>
  );
};