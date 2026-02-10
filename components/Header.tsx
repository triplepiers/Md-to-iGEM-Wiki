import React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { TopNav } from './TopNav';
import { NavigationItem } from '../types';

interface HeaderProps {
    navItems: NavigationItem[];
    currentPath: string;
    isDarkMode: boolean;
    setDarkMode: (value: boolean) => void;
    setMobileMenuOpen: (value: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
    navItems,
    currentPath,
    isDarkMode,
    setDarkMode,
    setMobileMenuOpen,
}) => {
    return (
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 fixed top-0 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur z-40">
            <div className="max-w-[1600px] mx-auto h-full px-4 flex items-center justify-between">
                {/* 左侧内容：icon 和 Team */}
                <div className="flex items-center gap-6">
                    {/* Logo */}
                    <a
                        href="#/"
                        className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mr-4"
                    >
                        ReactDocs
                    </a>
                </div>
                {/* 右侧内容 */}
                <div className="flex items-center gap-2">
                    {/* 竖屏 Menu */}
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                    >
                        <Menu size={24} />
                    </button>
                    {/* 横屏 Menu */}
                    <TopNav navItems={navItems} currentPath={currentPath} />
                    {/* 亮暗模式切换 */}
                    <button
                        onClick={() => setDarkMode(!isDarkMode)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </div>
        </header>
    );
};