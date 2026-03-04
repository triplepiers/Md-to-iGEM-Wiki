import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'content');
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'dist-static');
const CONFIG_PATH = path.join(PROJECT_ROOT, 'config/static-export.json');

const SYSTEM_IGNORES = new Set(['.DS_Store', 'Thumbs.db']);
const HOME_MARKDOWN_PATH = 'Home.md';

const toForwardSlash = (input) => input.replace(/\\/g, '/');

const ensureHtmlExtension = (urlPath) => {
  return urlPath.endsWith('.html') ? urlPath : `${urlPath}.html`;
};

const removeExtension = (virtualPath) => {
  return virtualPath.replace(/\.(md|html)$/i, '');
};

const getBaseNameWithoutExtension = (virtualPath) => {
  return path.posix.basename(removeExtension(virtualPath));
};

const shouldIgnorePath = (virtualPath, ignores) => {
  for (const ignorePath of ignores) {
    if (!ignorePath) {
      continue;
    }
    if (virtualPath === ignorePath || virtualPath.startsWith(`${ignorePath}/`)) {
      return true;
    }
  }
  return false;
};

const loadConfig = () => {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { ignore: [] };
  }

  const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
  const parsed = JSON.parse(raw);

  return {
    ignore: Array.isArray(parsed.ignore)
      ? parsed.ignore.map((item) => toForwardSlash(String(item).replace(/^\/+|\/+$/g, '')))
      : [],
  };
};

const listContentFiles = (dir, relativePath = '', ignores = []) => {
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

    if (shouldIgnorePath(virtualPath, ignores)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listContentFiles(fullPath, virtualPath, ignores));
      continue;
    }

    results.push(virtualPath);
  }

  return results;
};

const collectStaticPages = (files) => {
  const pages = [];
  const navPages = files.filter((filePath) => {
    if (!/\.(md|html)$/i.test(filePath)) {
      return false;
    }
    if (filePath === 'index.html' || filePath === HOME_MARKDOWN_PATH) {
      return false;
    }
    if (filePath.includes('/snippets/')) {
      return false;
    }
    return true;
  });

  pages.push({
    sourcePath: 'index.html',
    routeHash: '#/',
    sourceKey: 'index',
    title: 'Home',
  });

  navPages.forEach((sourcePath) => {
    pages.push({
      sourcePath,
      routeHash: `#/${sourcePath}`,
      sourceKey: removeExtension(sourcePath),
      title: sourcePath,
    });
  });

  return pages;
};

const resolveExportPath = (page) => {
  if (page.sourcePath === 'index.html') {
    return 'index.html';
  }

  const lowerName = getBaseNameWithoutExtension(page.sourcePath).toLowerCase();
  return ensureHtmlExtension(lowerName);
};

const buildStaticPathMap = (routes) => {
  const pathMap = {
    index: 'index.html',
    'index.html': 'index.html',
    '/': 'index.html',
    '/index': 'index.html',
    '/index.html': 'index.html',
  };

  routes.forEach((route) => {
    if (route.sourcePath === 'index.html') {
      return;
    }

    const sourcePath = toForwardSlash(route.sourcePath).replace(/^\/+/, '');
    const noExtPath = removeExtension(sourcePath);
    const exportPath = route.exportPath;

    pathMap[sourcePath] = exportPath;
    pathMap[noExtPath] = exportPath;
    pathMap[`/${sourcePath}`] = exportPath;
    pathMap[`/${noExtPath}`] = exportPath;
  });

  return pathMap;
};

const buildRuntimeScript = (pathMap, sourcePath) => {
  const runtimeConfig = {
    enabled: true,
    pathToFile: pathMap,
    currentSourcePath: sourcePath,
  };

  return `<script>window.__STATIC_EXPORT__=${JSON.stringify(runtimeConfig)};</script>`;
};

const renderPageHtml = (templateHtml, exportPath, pathMap, sourcePath) => {
  const depth = exportPath.split('/').length - 1;
  const relativePrefix = depth === 0 ? '' : '../'.repeat(depth);

  const rewriteAssetUrl = (url) => {
    if (url.startsWith('/')) {
      return `${relativePrefix}${url.slice(1)}`;
    }
    return url;
  };

  let html = templateHtml.replace(
    /(href|src)=["']([^"']+)["']/g,
    (_match, attr, url) => `${attr}="${rewriteAssetUrl(url)}"`
  );

  // Inject static-export runtime mapping before the React bundle initializes.
  html = html.replace('</head>', `${buildRuntimeScript(pathMap, sourcePath)}\n</head>`);
  return html;
};

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const writePage = (baseDir, exportPath, html) => {
  const targetPath = path.join(baseDir, exportPath);
  ensureDir(path.dirname(targetPath));
  fs.writeFileSync(targetPath, html, 'utf-8');
  return targetPath;
};

const copyDir = (source, target) => {
  fs.cpSync(source, target, { recursive: true });
};

const main = () => {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('Missing dist/. Run `npm run build` first.');
    process.exit(1);
  }

  const config = loadConfig();
  const contentFiles = listContentFiles(CONTENT_DIR, '', config.ignore);
  const pages = collectStaticPages(contentFiles);
  const routes = pages.map((page) => ({
    ...page,
    exportPath: toForwardSlash(resolveExportPath(page)).replace(/^\/+/, ''),
  }));

  const duplicates = new Map();
  routes.forEach((route) => {
    const count = duplicates.get(route.exportPath) ?? 0;
    duplicates.set(route.exportPath, count + 1);
  });
  const conflicts = [...duplicates.entries()].filter(([, count]) => count > 1);
  if (conflicts.length > 0) {
    console.error('Export filename conflict detected. Lower-cased filenames must be unique.');
    conflicts.forEach(([exportPath]) => {
      console.error(` - ${exportPath}`);
    });
    process.exit(1);
  }

  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }

  copyDir(DIST_DIR, OUTPUT_DIR);

  const templateHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
  const manifest = [];
  const pathMap = buildStaticPathMap(routes);

  routes.forEach((route) => {
    const pageHtml = renderPageHtml(templateHtml, route.exportPath, pathMap, route.sourcePath);
    const filePath = writePage(OUTPUT_DIR, route.exportPath, pageHtml);
    manifest.push({
      sourcePath: route.sourcePath,
      routeHash: route.routeHash,
      exportPath: route.exportPath,
      absoluteFilePath: filePath,
    });
  });

  console.log(`✅ Static export complete: ${manifest.length} pages`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
};

main();
