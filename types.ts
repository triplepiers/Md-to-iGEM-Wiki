export const FileType = {
  FILE: 'file',
  DIRECTORY: 'directory',
};
export type FileType = typeof FileType[keyof typeof FileType];

export interface FrontMatter {
  template?: 'default' | 'home' | 'wide' | 'raw';
  title?: string;
  description?: string;
  author?: string;
  [key: string]: any;
}

export interface FileNode {
  name: string;
  type: FileType;
  path: string; // Virtual path e.g., "docs/intro.md"
  content?: string; // Only for files
  children?: FileNode[]; // Only for directories
}

export interface ParsedFile {
  meta: FrontMatter;
  content: string;
  rawContent: string;
  path: string;
  extension: string;
}

export interface NavigationItem {
  title: string;
  path: string;
  children?: NavigationItem[];
  level: number;
}
