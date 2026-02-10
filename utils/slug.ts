export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/&/g, '-and-')   // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-');  // Replace multiple - with single -
};

export interface HeadingData {
  id: string;
  text: string;
  level: number;
}

export const extractHeadings = (markdown: string): HeadingData[] => {
  const headingRegex = /^(#{1,4})\s+(.+)$/gm;
  const headings: HeadingData[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);
    headings.push({ id, text, level });
  }

  return headings;
};