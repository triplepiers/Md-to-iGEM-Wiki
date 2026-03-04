import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import { slugify } from '@/utils/slug';
import {
  FileNode,
  FileType,
  FrontMatter,
  NavigationItem,
  NavigationOrderConfig,
} from '@/types';

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
 * Current support:
 * - {{ embed: path/to/file }}
 * - {{ ref: alias }} + ## Reference section definitions
 */
type OffsetRange = {
  start: number;
  end: number;
};

/**
 * AST-based protection to prevent parsing embed directives inside
 * markdown code regions (`inlineCode` and fenced/indented `code` blocks).
 */
const getCodeRanges = (markdown: string): OffsetRange[] => {
  const tree = unified().use(remarkParse).parse(markdown);
  const ranges: OffsetRange[] = [];

  visit(tree, (node: any) => {
    if (node.type !== 'inlineCode' && node.type !== 'code') {
      return;
    }

    const start = node.position?.start?.offset;
    const end = node.position?.end?.offset;
    if (typeof start === 'number' && typeof end === 'number' && start < end) {
      ranges.push({ start, end });
    }
  });

  if (ranges.length <= 1) {
    return ranges;
  }

  ranges.sort((a, b) => a.start - b.start);
  const merged: OffsetRange[] = [ranges[0]];

  for (let i = 1; i < ranges.length; i += 1) {
    const current = ranges[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
};

const buildReferenceAwareMarkdown = (content: string): string => {
  const lines = content.split('\n');
  const lineStartOffsets: number[] = [];
  let absoluteOffset = 0;
  for (const line of lines) {
    lineStartOffsets.push(absoluteOffset);
    absoluteOffset += line.length + 1;
  }

  const referenceCodeRanges = getCodeRanges(content);
  const citationRefRegex = /\{\{\s*ref:\s*([^\s}]+)\s*\}\}/g;
  const referenceHeadingRegex = /^##\s+references?\s*$/i;
  const h2Regex = /^##\s+/;
  const isOffsetInsideCode = (start: number, end: number) =>
    referenceCodeRanges.some((range) => range.start < end && start < range.end);

  const usedAliases = new Set<string>();
  let refScanRangeCursor = 0;
  let refScanMatch: RegExpExecArray | null;
  while ((refScanMatch = citationRefRegex.exec(content)) !== null) {
    const fullMatch = refScanMatch[0];
    const alias = refScanMatch[1];
    const matchStart = refScanMatch.index;
    const matchEnd = matchStart + fullMatch.length;

    while (
      refScanRangeCursor < referenceCodeRanges.length &&
      referenceCodeRanges[refScanRangeCursor].end <= matchStart
    ) {
      refScanRangeCursor += 1;
    }

    const currentCodeRange = referenceCodeRanges[refScanRangeCursor];
    const isInsideCode =
      !!currentCodeRange && currentCodeRange.start < matchEnd && matchStart < currentCodeRange.end;

    if (isInsideCode) {
      continue;
    }

    if (alias) {
      usedAliases.add(alias.trim());
    }
  }

  let referenceStart = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineStart = lineStartOffsets[i] ?? 0;
    const lineEnd = lineStart + line.length;
    if (isOffsetInsideCode(lineStart, lineEnd)) {
      continue;
    }

    if (referenceHeadingRegex.test(line.trim())) {
      referenceStart = i;
      break;
    }
  }

  if (referenceStart === -1) {
    return content;
  }

  let referenceEnd = lines.length;
  for (let i = referenceStart + 1; i < lines.length; i += 1) {
    const line = lines[i];
    const lineStart = lineStartOffsets[i] ?? 0;
    const lineEnd = lineStart + line.length;
    if (isOffsetInsideCode(lineStart, lineEnd)) {
      continue;
    }

    if (h2Regex.test(line)) {
      referenceEnd = i;
      break;
    }
  }

  // Preferred syntax: [alias]: citation content (supports markdown links in content).
  // Backward-compatible syntax: [alias](citation content)
  const referenceItemRegex = /^\s*\[([^\]]+)\]\s*:\s+(.+?)\s*$/;
  const legacyReferenceItemRegex = /^\s*\[([^\]]+)\]\((.+)\)\s*$/;
  const aliasToCitation = new Map<
    string,
    {
      order: number;
      anchorId: string;
      content: string;
    }
  >();
  const orderedAliases: string[] = [];
  const rewrittenReferenceSection: string[] = [];
  let codeRangeCursor = 0;

  for (let i = referenceStart; i < referenceEnd; i += 1) {
    const line = lines[i];
    const lineStart = lineStartOffsets[i] ?? 0;
    const lineEnd = lineStart + line.length;

    while (
      codeRangeCursor < referenceCodeRanges.length &&
      referenceCodeRanges[codeRangeCursor].end <= lineStart
    ) {
      codeRangeCursor += 1;
    }

    const currentCodeRange = referenceCodeRanges[codeRangeCursor];
    const isLineInsideCode =
      !!currentCodeRange && currentCodeRange.start < lineEnd && lineStart < currentCodeRange.end;
    if (i === referenceStart) {
      rewrittenReferenceSection.push(line);
      continue;
    }

    if (isLineInsideCode) {
      rewrittenReferenceSection.push(line);
      continue;
    }

    const match = line.match(referenceItemRegex) ?? line.match(legacyReferenceItemRegex);
    if (!match) {
      rewrittenReferenceSection.push(line);
      continue;
    }

    const alias = match[1].trim();
    const citationContent = match[2].trim();
    if (!alias || !citationContent) {
      rewrittenReferenceSection.push(line);
      continue;
    }

    if (!usedAliases.has(alias)) {
      rewrittenReferenceSection.push(line);
      continue;
    }

    if (!aliasToCitation.has(alias)) {
      const order = orderedAliases.length + 1;
      const anchorId = `ref-${slugify(alias)}`;
      orderedAliases.push(alias);
      aliasToCitation.set(alias, {
        order,
        anchorId,
        content: citationContent,
      });
    }

    const citation = aliasToCitation.get(alias);
    if (!citation) {
      rewrittenReferenceSection.push(line);
      continue;
    }

    rewrittenReferenceSection.push(
      `${citation.order}. <span id="${citation.anchorId}"></span> ${citation.content}`
    );
  }

  if (aliasToCitation.size === 0) {
    return content;
  }

  const rebuiltContent = [
    ...lines.slice(0, referenceStart),
    ...rewrittenReferenceSection,
    ...lines.slice(referenceEnd),
  ].join('\n');

  const codeRanges = getCodeRanges(rebuiltContent);
  citationRefRegex.lastIndex = 0;
  let rangeCursor = 0;
  let lastHandledIndex = 0;
  let output = '';

  let match: RegExpExecArray | null;
  while ((match = citationRefRegex.exec(rebuiltContent)) !== null) {
    const fullMatch = match[0];
    const alias = match[1];
    const matchStart = match.index;
    const matchEnd = matchStart + fullMatch.length;

    while (rangeCursor < codeRanges.length && codeRanges[rangeCursor].end <= matchStart) {
      rangeCursor += 1;
    }

    const currentRange = codeRanges[rangeCursor];
    const isInsideCode =
      !!currentRange && currentRange.start < matchEnd && matchStart < currentRange.end;

    if (isInsideCode) {
      continue;
    }

    output += rebuiltContent.slice(lastHandledIndex, matchStart);

    const citation = aliasToCitation.get(alias);
    if (!citation) {
      output += `<sup><span class="citation-undefined">[?]</span></sup>`;
    } else {
      output += `<sup><a href="#${citation.anchorId}">[${citation.order}]</a></sup>`;
    }

    lastHandledIndex = matchEnd;
  }

  output += rebuiltContent.slice(lastHandledIndex);
  return output;
};

export const processCustomExtensions = (
  content: string,
  fileMap: Record<string, FileNode>
): string => {
  const codeRanges = getCodeRanges(content);
  const embedRegex = /\{\{\s*embed:\s*([^\s}]+)\s*\}\}/g;
  let rangeCursor = 0;
  let lastHandledIndex = 0;
  let output = '';

  let match: RegExpExecArray | null;
  while ((match = embedRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const path = match[1];
    const matchStart = match.index;
    const matchEnd = matchStart + fullMatch.length;

    while (rangeCursor < codeRanges.length && codeRanges[rangeCursor].end <= matchStart) {
      rangeCursor += 1;
    }

    const currentRange = codeRanges[rangeCursor];
    const isInsideCode =
      !!currentRange && currentRange.start < matchEnd && matchStart < currentRange.end;

    if (isInsideCode) {
      continue;
    }

    output += content.slice(lastHandledIndex, matchStart);
    const targetFile = fileMap[path];
    if (targetFile && targetFile.content) {
      // Recursively process the embedded content, preserving the same AST-aware behavior.
      output += `\n\n<!-- Start Embed: ${path} -->\n${processCustomExtensions(
        targetFile.content,
        fileMap
      )}\n<!-- End Embed -->\n\n`;
    } else {
      output += `\n> ⚠️ Error: Could not embed file "${path}". Not found.\n`;
    }

    lastHandledIndex = matchEnd;
  }

  output += content.slice(lastHandledIndex);
  return buildReferenceAwareMarkdown(output);
};

/**
 * Recursively builds a navigation tree for the sidebar.
 */
const formatNavigationTitle = (name: string): string => {
  const baseName = name.replace(/\.(md|html)$/i, '');
  return baseName
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const resolveOrderPath = (path: string, parentPath: string): string => {
  const normalizedPath = path.replace(/^\/+|\/+$/g, '');
  if (!normalizedPath) {
    return parentPath;
  }

  if (normalizedPath.includes('/')) {
    return normalizedPath;
  }

  return parentPath ? `${parentPath}/${normalizedPath}` : normalizedPath;
};

const buildOrderContext = (
  orderConfig: NavigationOrderConfig,
  parentPath: string
): {
  orderMap: Map<string, number>;
  childConfigMap: Map<string, NavigationOrderConfig>;
} => {
  const orderMap = new Map<string, number>();
  const childConfigMap = new Map<string, NavigationOrderConfig>();

  orderConfig.forEach((entry, index) => {
    const rawPath = typeof entry === 'string' ? entry : entry.path;
    const resolvedPath = resolveOrderPath(rawPath, parentPath);
    orderMap.set(resolvedPath, index);

    if (typeof entry !== 'string' && entry.children && entry.children.length > 0) {
      childConfigMap.set(resolvedPath, entry.children);
    }
  });

  return { orderMap, childConfigMap };
};

const applyCustomNavigationOrder = (
  nodes: FileNode[],
  orderMap: Map<string, number>
): FileNode[] => {
  if (orderMap.size === 0) {
    return nodes;
  }

  const prioritized: FileNode[] = [];
  const rest: FileNode[] = [];

  nodes.forEach((node) => {
    if (orderMap.has(node.path)) {
      prioritized.push(node);
    } else {
      rest.push(node);
    }
  });

  prioritized.sort((a, b) => {
    const aIndex = orderMap.get(a.path) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = orderMap.get(b.path) ?? Number.MAX_SAFE_INTEGER;
    return aIndex - bIndex;
  });

  return [...prioritized, ...rest];
};

export const buildNavigation = (
  nodes: FileNode[],
  level = 0,
  orderConfig: NavigationOrderConfig = [],
  parentPath = ''
): NavigationItem[] => {
  const { orderMap, childConfigMap } = buildOrderContext(orderConfig, parentPath);
  const orderedNodes = applyCustomNavigationOrder(nodes, orderMap);

  return orderedNodes
    .filter(node => {
        // Hide snippets and index.html from sidebar usually, or specific config
        if (node.path.includes('snippets')) return false;
        if (node.name === 'index.html') return false;
        return true;
    })
    .map((node) => {
      const item: NavigationItem = {
        title: formatNavigationTitle(node.name),
        path: node.path,
        level,
      };

      if (node.children) {
        const childOrderConfig = childConfigMap.get(node.path) ?? [];
        item.children = buildNavigation(node.children, level + 1, childOrderConfig, node.path);
      }
      return item;
    });
};
