const normalizePath = (value: string): string => {
  return value.replace(/^\/+/, '').replace(/\\/g, '/');
};

const splitPathAndHash = (href: string): { path: string; hash: string } => {
  const hashIndex = href.indexOf('#');
  if (hashIndex === -1) {
    return { path: href, hash: '' };
  }

  return {
    path: href.slice(0, hashIndex),
    hash: href.slice(hashIndex),
  };
};

const stripExtension = (value: string): string => {
  return value.replace(/\.(md|html)$/i, '');
};

const getStaticPathMap = (): Record<string, string> | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const runtime = (window as any).__STATIC_EXPORT__;
  if (!runtime || runtime.enabled !== true || typeof runtime.pathToFile !== 'object') {
    return null;
  }

  return runtime.pathToFile as Record<string, string>;
};

const resolveStaticPath = (path: string): string | null => {
  const pathMap = getStaticPathMap();
  if (!pathMap) {
    return null;
  }

  const normalizedPath = normalizePath(path);
  const candidates = [
    normalizedPath,
    stripExtension(normalizedPath),
    `/${normalizedPath}`,
    `/${stripExtension(normalizedPath)}`,
  ];

  for (const key of candidates) {
    const mapped = pathMap[key];
    if (mapped) {
      return mapped;
    }
  }

  return null;
};

export const resolveAppPathHref = (path: string): string => {
  const normalizedPath = normalizePath(path);
  const staticHref = resolveStaticPath(normalizedPath);
  if (staticHref) {
    return staticHref;
  }

  return `#/${normalizedPath}`;
};

export const resolveAppLinkHref = (href: string): string => {
  const rawHref = href.trim();
  if (!rawHref) {
    return rawHref;
  }

  const isExternal = /^(https?:)?\/\//i.test(rawHref);
  const isSpecialScheme = /^(mailto:|tel:)/i.test(rawHref);
  const isInPageAnchor = rawHref.startsWith('#') && !rawHref.startsWith('#/');
  if (isExternal || isSpecialScheme || isInPageAnchor) {
    return rawHref;
  }

  const withoutHashRoutePrefix = rawHref.startsWith('#/') ? rawHref.slice(2) : rawHref;
  const { path, hash } = splitPathAndHash(withoutHashRoutePrefix);
  const normalizedPath = normalizePath(path);
  const staticHref = resolveStaticPath(normalizedPath);
  if (staticHref) {
    return `${staticHref}${hash}`;
  }

  return `#/${normalizedPath}${hash}`;
};
