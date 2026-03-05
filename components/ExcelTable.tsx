import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

type ExcelTableProps = React.HTMLAttributes<HTMLElement> & {
  url?: string;
};

const escapeHtmlText = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const getCellText = (cell: XLSX.CellObject | undefined): string => {
  if (!cell) {
    return '';
  }
  const formatted = XLSX.utils.format_cell(cell);
  return formatted ?? '';
};

const buildExcelTableHtml = (worksheet: XLSX.WorkSheet): string => {
  const ref = worksheet['!ref'];
  if (!ref) {
    return '<tbody></tbody>';
  }

  const range = XLSX.utils.decode_range(ref);
  const merges = (worksheet['!merges'] ?? []) as XLSX.Range[];
  const mergeMap = new Map<string, { rowspan: number; colspan: number }>();
  const skipCells = new Set<string>();

  merges.forEach((merge) => {
    const rowspan = merge.e.r - merge.s.r + 1;
    const colspan = merge.e.c - merge.s.c + 1;
    const key = `${merge.s.r}:${merge.s.c}`;
    mergeMap.set(key, { rowspan, colspan });

    for (let r = merge.s.r; r <= merge.e.r; r += 1) {
      for (let c = merge.s.c; c <= merge.e.c; c += 1) {
        if (r === merge.s.r && c === merge.s.c) {
          continue;
        }
        skipCells.add(`${r}:${c}`);
      }
    }
  });

  const renderRow = (r: number, tag: 'td' | 'th'): string => {
    let rowHtml = '<tr>';
    for (let c = range.s.c; c <= range.e.c; c += 1) {
      const key = `${r}:${c}`;
      if (skipCells.has(key)) {
        continue;
      }

      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = worksheet[addr] as XLSX.CellObject | undefined;
      const rawText = getCellText(cell);
      const safeText = escapeHtmlText(String(rawText)).replace(/\n/g, '<br/>');
      const content = safeText || '&nbsp;';

      const mergeInfo = mergeMap.get(key);
      const rowSpanAttr = mergeInfo?.rowspan ? ` rowspan="${mergeInfo.rowspan}"` : '';
      const colSpanAttr = mergeInfo?.colspan ? ` colspan="${mergeInfo.colspan}"` : '';

      const styleParts: string[] = [];
      const font = (cell as any)?.s?.font;
      if (font?.bold) {
        styleParts.push('font-weight:700');
      }
      const alignment = (cell as any)?.s?.alignment;
      const horizontal = alignment?.horizontal;
      if (horizontal === 'center' || horizontal === 'centerContinuous') {
        styleParts.push('text-align:center');
      }
      const vertical = alignment?.vertical;
      if (vertical === 'center' || vertical === 'middle') {
        styleParts.push('vertical-align:middle');
      }

      const styleAttr = styleParts.length > 0 ? ` style="${styleParts.join(';')}"` : '';

      rowHtml += `<${tag}${rowSpanAttr}${colSpanAttr}${styleAttr}>${content}</${tag}>`;
    }
    rowHtml += '</tr>';
    return rowHtml;
  };

  let html = '';
  if (range.s.r <= range.e.r) {
    html += `<thead>${renderRow(range.s.r, 'th')}</thead>`;
  }
  html += '<tbody>';
  for (let r = range.s.r + 1; r <= range.e.r; r += 1) {
    html += renderRow(r, 'td');
  }
  html += '</tbody>';
  return html;
};

export const ExcelTable: React.FC<ExcelTableProps> = ({ url, className, ...props }) => {
  const dataUrl =
    (props as any)['data-url'] ??
    (props as any).dataUrl ??
    url ??
    (props as any).src ??
    '';

  const [html, setHtml] = useState<string>('');
  const [error, setError] = useState<string>('');

  const normalizedUrl = useMemo(() => String(dataUrl || '').trim(), [dataUrl]);
  const resolvedUrl = useMemo(() => {
    if (!normalizedUrl) return '';
    const isRemote = /^(https?:)?\/\//i.test(normalizedUrl);
    const isDataUrl = /^data:/i.test(normalizedUrl);
    const isAbsolute = normalizedUrl.startsWith('/');
    if (isRemote || isDataUrl || isAbsolute) {
      return normalizedUrl;
    }
    if (
      normalizedUrl.startsWith('attachment/execels/') ||
      normalizedUrl.startsWith('attachment/excels/')
    ) {
      return normalizedUrl;
    }
    if (
      normalizedUrl.startsWith('Attachment/execels/') ||
      normalizedUrl.startsWith('Attachment/excels/')
    ) {
      return normalizedUrl;
    }
    if (
      normalizedUrl.startsWith('content/Attachment/execels/') ||
      normalizedUrl.startsWith('content/Attachment/excels/')
    ) {
      return normalizedUrl;
    }
    return `attachment/excels/${normalizedUrl.replace(/^\.\/+/, '')}`;
  }, [normalizedUrl]);

  useEffect(() => {
    let isActive = true;
    setError('');
    setHtml('');

    if (!resolvedUrl) {
      setError('Table URL is empty');
      return () => {
        isActive = false;
      };
    }

    const load = async () => {
      try {
        const response = await fetch(resolvedUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch table: ${response.status}`);
        }
        const contentType = response.headers.get('content-type') ?? '';
        const buffer = await response.arrayBuffer();
        const headText = new TextDecoder('utf-8').decode(buffer.slice(0, 256)).trim();
        const looksLikeHtml =
          contentType.includes('text/html') ||
          headText.startsWith('<!DOCTYPE') ||
          headText.startsWith('<html') ||
          headText.startsWith('<head');
        if (looksLikeHtml) {
          throw new Error(
            'Excel file not found or server returned HTML. Check attachment/execels path and filename.'
          );
        }
        const workbook = XLSX.read(buffer, { type: 'array', cellStyles: true });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('No worksheet found');
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const tableHtml = buildExcelTableHtml(worksheet);

        if (isActive) {
          setHtml(tableHtml);
        }
      } catch (err: any) {
        if (isActive) {
          setError(err?.message ?? 'Failed to load table');
        }
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [normalizedUrl]);

  if (error) {
    return <div className="text-sm text-red-600 dark:text-red-400">Warning: {error}</div>;
  }

  if (!html) {
    return <div className="text-sm text-slate-500 dark:text-slate-400">Loading table...</div>;
  }

  return (
    <table
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
};
