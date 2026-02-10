import { FileNode, FileType, FrontMatter, ParsedFile } from '@/types';

/**
 * Parses raw file content into frontmatter and body.
 * Simulates libraries like gray-matter.
 */
export const parseFrontMatter = (raw: string): { meta: FrontMatter; body: string } => {
  const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = raw.match(frontMatterRegex);

  if (!match) {
    return { meta: {}, body: raw };
  }

  const yamlBlock = match[1];
  const body = match[2];

  const meta: FrontMatter = {};
  yamlBlock.split('\n').forEach((line) => {
    const [key, ...values] = line.split(':');
    if (key && values.length) {
      meta[key.trim()] = values.join(':').trim();
    }
  });

  return { meta, body };
};

/**
 * Flattens the file tree into a map for O(1) access by path.
 */
export const buildFileMap = (
  nodes: FileNode[],
  acc: Record<string, FileNode> = {}
): Record<string, FileNode> => {
  nodes.forEach((node) => {
    acc[node.path] = node;
    if (node.children) {
      buildFileMap(node.children, acc);
    }
  });
  return acc;
};

/**
 * Finds a file in the recursive tree by path.
 */
export const getFileByPath = (nodes: FileNode[], path: string): FileNode | null => {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = getFileByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Pre-processes Markdown to handle custom syntax extensions.
 * Current support: {{ embed: path/to/file }}
 */
export const processCustomExtensions = (
  content: string,
  fileMap: Record<string, FileNode>
): string => {
  const embedRegex = /\{\{\s*embed:\s*([^\s}]+)\s*\}\}/g;

  return content.replace(embedRegex, (match, path) => {
    const targetFile = fileMap[path];
    if (targetFile && targetFile.content) {
      // Recursively process the embedded content just in case
      return `\n\n<!-- Start Embed: ${path} -->\n${processCustomExtensions(
        targetFile.content,
        fileMap
      )}\n<!-- End Embed -->\n\n`;
    }
    return `\n> ⚠️ Error: Could not embed file "${path}". Not found.\n`;
  });
};

/**
 * Recursively builds a navigation tree for the sidebar.
 */
import { NavigationItem } from '../types';

export const buildNavigation = (nodes: FileNode[], level = 0): NavigationItem[] => {
  return nodes
    .filter(node => {
        // Hide snippets and index.html from sidebar usually, or specific config
        if (node.path.includes('snippets')) return false;
        if (node.name === 'index.html') return false;
        return true;
    })
    .map((node) => {
      const item: NavigationItem = {
        title: node.name.replace(/\.(md|html)$/, '').replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()),
        path: node.path,
        level,
      };

      if (node.children) {
        item.children = buildNavigation(node.children, level + 1);
      }
      return item;
    });
};
