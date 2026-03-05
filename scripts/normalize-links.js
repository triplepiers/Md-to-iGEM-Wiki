import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'content');

const OPTIONS = new Set(process.argv.slice(2));
const IS_CHECK_ONLY = OPTIONS.has('--check');
const IS_STRICT = OPTIONS.has('--strict');
const VERBOSE = OPTIONS.has('--verbose');

const shouldSkipNormalization = () => {
  const raw = process.env.BUILD_CONTEXT || process.env.BUILD_STATIC || '';
  const value = String(raw).toLowerCase();
  if (value === 'static' || value === '1' || value === 'true' || value === 'yes') {
    return true;
  }
  return false;
};

if (shouldSkipNormalization()) {
  console.log('[normalize-links] skipped (static build context detected).');
  process.exit(0);
}

const SYSTEM_IGNORES = new Set(['.DS_Store', 'Thumbs.db']);

const toForwardSlash = (input) => input.replace(/\\/g, '/');

const listContentFiles = (dir, relativePath = '') => {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || SYSTEM_IGNORES.has(entry.name)) {
      continue;
    }

    const entryRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    const virtualPath = toForwardSlash(entryRelative);
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...listContentFiles(fullPath, virtualPath));
      continue;
    }

    results.push(virtualPath);
  }

  return results;
};

const buildCaseInsensitiveMap = (paths) => {
  const map = new Map();
  const collisions = new Map();

  paths.forEach((p) => {
    const key = p.toLowerCase();
    if (map.has(key) && map.get(key) !== p) {
      const existing = map.get(key);
      const set = collisions.get(key) ?? new Set([existing]);
      set.add(p);
      collisions.set(key, set);
      return;
    }

    map.set(key, p);
  });

  if (collisions.size > 0) {
    const details = [...collisions.entries()]
      .map(([key, vals]) => `${key} => ${[...vals].sort().join(', ')}`)
      .join('\n');
    throw new Error(`Case-insensitive path collision(s) detected:\n${details}`);
  }

  return map;
};

const isExternalLink = (href) => /^(https?:)?\/\//i.test(href);
const isSpecialScheme = (href) => /^(mailto:|tel:|javascript:)/i.test(href);
const isInPageAnchor = (href) => href.startsWith('#') && !href.startsWith('#/');

const splitPath = (href) => {
  let prefix = '';
  let rest = href;

  if (href.startsWith('#/')) {
    prefix = '#/';
    rest = href.slice(2);
  } else if (href.startsWith('/')) {
    prefix = '/';
    rest = href.slice(1);
  }

  const [pathAndQuery, fragment = ''] = rest.split('#', 2);
  const [pathPart, query = ''] = pathAndQuery.split('?', 2);

  return { prefix, pathPart, query, fragment };
};

const buildCandidates = (pathPart) => {
  const cleaned = pathPart.replace(/^\.\/+/, '');
  if (!cleaned) return [];

  const ext = path.extname(cleaned).toLowerCase();
  if (ext && ext !== '.md' && ext !== '.html') {
    return [];
  }

  const candidates = [cleaned];
  if (!ext) {
    candidates.push(`${cleaned}.md`, `${cleaned}.html`);
  }

  return candidates;
};

const normalizeLink = (href, caseMap, stats, source) => {
  if (!href) return href;
  if (isExternalLink(href) || isSpecialScheme(href) || isInPageAnchor(href)) {
    return href;
  }

  const { prefix, pathPart, query, fragment } = splitPath(href);
  if (!pathPart) return href;

  const candidates = buildCandidates(pathPart);
  if (candidates.length === 0) {
    return href;
  }

  let resolved = null;
  for (const candidate of candidates) {
    const mapped = caseMap.get(candidate.toLowerCase());
    if (mapped) {
      resolved = mapped;
      break;
    }
  }

  if (!resolved) {
    stats.unresolved.push({ source, href });
    return href;
  }

  const normalized = `${prefix}${resolved}${query ? `?${query}` : ''}${fragment ? `#${fragment}` : ''}`;
  if (normalized !== href) {
    stats.changed.push({ source, from: href, to: normalized });
  }

  return normalized;
};

const htmlHrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
const mdLinkRegex = /(?<!\!)\[[^\]]*\]\(([^)\s]+)\)/g;

const normalizeContentLinks = (filePath, caseMap, stats) => {
  const fullPath = path.join(CONTENT_DIR, filePath);
  const original = fs.readFileSync(fullPath, 'utf-8');
  let updated = original;

  updated = updated.replace(htmlHrefRegex, (match, href) => {
    const normalized = normalizeLink(href, caseMap, stats, filePath);
    return match.replace(href, normalized);
  });

  updated = updated.replace(mdLinkRegex, (match, href) => {
    const normalized = normalizeLink(href, caseMap, stats, filePath);
    return match.replace(href, normalized);
  });

  if (updated !== original && !IS_CHECK_ONLY) {
    fs.writeFileSync(fullPath, updated, 'utf-8');
  }

  return updated !== original;
};

const main = () => {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error('Missing content directory.');
    process.exit(1);
  }

  const contentFiles = listContentFiles(CONTENT_DIR, '');
  const caseMap = buildCaseInsensitiveMap(contentFiles);

  const stats = {
    filesScanned: 0,
    filesChanged: 0,
    changed: [],
    unresolved: [],
  };

  const targetFiles = contentFiles.filter((p) => p.endsWith('.md') || p.endsWith('.html'));
  targetFiles.forEach((filePath) => {
    stats.filesScanned += 1;
    const changed = normalizeContentLinks(filePath, caseMap, stats);
    if (changed) stats.filesChanged += 1;
  });

  console.log(`[normalize-links] scanned ${stats.filesScanned} files`);
  console.log(`[normalize-links] updated ${stats.filesChanged} files${IS_CHECK_ONLY ? ' (check-only)' : ''}`);

  if (VERBOSE && stats.changed.length > 0) {
    console.log('[normalize-links] changes:');
    stats.changed.forEach((item) => {
      console.log(` - ${item.source}: ${item.from} -> ${item.to}`);
    });
  }

  if (stats.unresolved.length > 0) {
    console.warn('[normalize-links] unresolved internal links:');
    stats.unresolved.forEach((item) => {
      console.warn(` - ${item.source}: ${item.href}`);
    });
    if (IS_STRICT) {
      process.exit(1);
    }
  }

  if (IS_CHECK_ONLY && stats.changed.length > 0) {
    process.exit(2);
  }
};

main();
