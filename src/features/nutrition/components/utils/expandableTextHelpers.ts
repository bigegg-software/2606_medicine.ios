/** 估算中英混排文本宽度（用于两行截断） */
export function estimateTextWidth(text: string, fontSize: number) {
  let width = 0;
  for (const char of text) {
    if (char === '\n' || char === '\r') continue;
    if (/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(char)) {
      width += fontSize;
    } else if (char === ' ' || char === '\t') {
      width += fontSize * 0.33;
    } else {
      width += fontSize * 0.58;
    }
  }
  return width;
}

/** 按最大宽度截断文本（二分） */
export function truncateTextToWidth(text: string, maxWidth: number, fontSize: number) {
  if (!text || maxWidth <= 0) return '';
  if (estimateTextWidth(text, fontSize) <= maxWidth) return text;

  let lo = 0;
  let hi = text.length;
  let best = '';
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const slice = text.slice(0, mid);
    if (estimateTextWidth(slice, fontSize) <= maxWidth) {
      best = slice;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best.replace(/\s+$/u, '');
}

export type TwoLineCollapsedResult = {
  needsExpand: boolean;
  firstLine: string;
  secondLine: string;
};

/**
 * 根据 Text 行布局 + 容器宽度，生成收起态两行文案：
 * 第一行自然铺满；第二行按宽度截断，末尾留给 ... + 展开按钮。
 */
export function buildTwoLineCollapsedText(
  text: string,
  lines: Array<{ text: string }>,
  containerWidth: number,
  options?: { fontSize?: number; expandReserve?: number },
): TwoLineCollapsedResult {
  const fontSize = options?.fontSize ?? 14;
  const expandReserve = options?.expandReserve ?? 52;
  const source = text ?? '';

  if (!source.trim() || containerWidth <= 0) {
    return { needsExpand: false, firstLine: source, secondLine: '' };
  }

  if (lines.length <= 2) {
    return { needsExpand: false, firstLine: source, secondLine: '' };
  }

  const firstLine = lines[0]?.text ?? '';
  const rest = source.slice(firstLine.length).replace(/^\n/, '');
  const ellipsisWidth = estimateTextWidth('...', fontSize);
  const maxSecond = Math.max(0, containerWidth - expandReserve - ellipsisWidth);
  const secondLine = truncateTextToWidth(rest, maxSecond, fontSize);

  return { needsExpand: true, firstLine, secondLine };
}
