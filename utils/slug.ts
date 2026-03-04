export const slugify = (text: string): string => {
  const normalized = text
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[\s\u2013\u2014]+/g, '-')
    .replace(/[^\p{Letter}\p{Number}_-]+/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '');

  return normalized || 'section';
};

export interface HeadingData {
  id: string;
  text: string;
  level: number;
}

const createHeadingIdGenerator = () => {
  const usedIds = new Map<string, number>();

  return (text: string): string => {
    const baseId = slugify(text);
    const currentCount = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, currentCount + 1);

    if (currentCount === 0) {
      return baseId;
    }

    return `${baseId}-${currentCount + 1}`;
  };
};

export const extractHeadings = (markdown: string): HeadingData[] => {
  const headingRegex = /^(#{1,4})\s+(.+)$/;
  const headings: HeadingData[] = [];
  const lines = markdown.split('\n');
  const nextHeadingId = createHeadingIdGenerator();
  let inFence = false;
  let fenceMarker: '`' | '~' | null = null;
  let fenceLength = 0;

  for (const line of lines) {
    const fenceMatch = line.match(/^(\s*)(`{3,}|~{3,})/);
    if (fenceMatch) {
      const markerText = fenceMatch[2];
      const markerChar = markerText[0] as '`' | '~';
      const markerLength = markerText.length;

      if (!inFence) {
        inFence = true;
        fenceMarker = markerChar;
        fenceLength = markerLength;
        continue;
      }

      if (fenceMarker === markerChar && markerLength >= fenceLength) {
        inFence = false;
        fenceMarker = null;
        fenceLength = 0;
      }
      continue;
    }

    if (inFence) {
      continue;
    }

    const match = line.match(headingRegex);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    const text = match[2].trim();
    const id = nextHeadingId(text);
    headings.push({ id, text, level });
  }

  return headings;
};
