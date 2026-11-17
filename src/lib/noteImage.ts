import { teawareApi } from './api/teaware.api';

const WIDTH = 1080;
const PADDING = 72;
const CONTENT_WIDTH = WIDTH - PADDING * 2;
const INK = '#f4f3da';
const MUTED = '#c2c9a3';
const BLOCK_ELEMENTS = new Set(['P', 'DIV', 'LI', 'UL', 'OL', 'BLOCKQUOTE', 'PRE', 'H1', 'H2', 'H3', 'H4', 'TR']);

/** Read rendered Markdown, retaining its paragraph and explicit line breaks. */
export function noteImageText(element: Element | null): string {
  if (!element) return '';
  const read = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (!(node instanceof Element)) return '';
    if (node.tagName === 'BR') return '\n';
    if (node.matches('button, [aria-hidden="true"], [data-note-image-exclude]')) return '';
    const content = Array.from(node.childNodes, read).join('');
    if (node.tagName === 'LI') return `• ${content.trim()}\n`;
    return BLOCK_ELEMENTS.has(node.tagName) ? `${content}\n` : content;
  };
  return Array.from(element.childNodes, read).join('').replace(/\n{3,}/g, '\n\n').trim();
}

/** Wrap whole words first, splitting an overlong Korean/Latin word only if necessary. */
export function wrapImageText(text: string, width: number, measure: (text: string) => number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (!paragraph.trim()) { lines.push(''); continue; }
    let line = '';
    for (const word of paragraph.trim().split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= width) { line = candidate; continue; }
      if (line) { lines.push(line); line = ''; }
      for (const character of Array.from(word)) {
        if (line && measure(line + character) > width) { lines.push(line); line = ''; }
        line += character;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

/**
 * Export the complete note as a portable PNG, without DOM screenshots or remote
 * image dependencies. Semantic text and rating blocks keep long notes readable.
 */
async function loadToolImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => reject(new Error('다구 사진을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')), 10000);
    image.crossOrigin = 'anonymous';
    image.onload = () => { window.clearTimeout(timeout); resolve(image); };
    image.onerror = () => { window.clearTimeout(timeout); reject(new Error('다구 사진을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')); };
    image.src = src;
  });
}

export async function createNoteImage(card: HTMLElement, filename = '차록.png'): Promise<File> {
  if (document.fonts) await document.fonts.ready;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('이미지를 만들 수 없는 브라우저입니다.');
  const family = getComputedStyle(card).fontFamily || 'sans-serif';
  const titleElement = card.querySelector('[data-note-image="title"], .note-detail-tea-title');
  const titleFamily = titleElement ? getComputedStyle(titleElement).fontFamily || family : family;
  const field = (name: string, fallback?: string) => {
    const element = card.querySelector(`[data-note-image="${name}"]${fallback ? `, ${fallback}` : ''}`);
    if (element && ['meta', 'chips', 'tags'].includes(name) && element.children.length) {
      return Array.from(element.children, child => noteImageText(child)).filter(Boolean).join(' · ');
    }
    return noteImageText(element);
  };
  const commands: Array<() => void> = [];
  let y = PADDING;
  const text = (value: string, size = 34, color = INK, bold = false, font = family) => {
    if (!value) return;
    const cssFont = `${bold ? '700' : '400'} ${size}px ${font}`;
    context.font = cssFont;
    const lines = wrapImageText(value, CONTENT_WIDTH, line => context.measureText(line).width);
    const top = y;
    const lineHeight = Math.ceil(size * 1.6);
    commands.push(() => {
      context.font = cssFont;
      context.fillStyle = color;
      context.textBaseline = 'top';
      lines.forEach((line, index) => context.fillText(line, PADDING, top + index * lineHeight));
    });
    y += lines.length * lineHeight;
  };
  const section = (label: string) => { y += 34; text(label, 26, MUTED, true); y += 16; };
  text([field('author'), field('date')].filter(Boolean).join('  ·  '), 28, MUTED);
  y += 28;
  text(noteImageText(titleElement) || '차록', 60, INK, true, titleFamily);
  const rating = field('rating');
  if (rating) { y += 14; text(`평점  ${rating}`, 34, INK, true); }
  const metadata = field('meta');
  if (metadata) { y += 14; text(metadata, 28, MUTED); }
  const chips = field('chips');
  if (chips) { y += 12; text(chips, 28, MUTED); }
  const tools = Array.from(card.querySelectorAll<HTMLElement>('[data-teaware-kind]'));
  if (tools.length) {
    section('사용한 다구');
    const images = await Promise.all(tools.map(tool => {
      const image = tool.querySelector('img');
      const src = tool.dataset.teawareImageUrl || image?.src || `/teaware/${tool.dataset.teawareKind}.svg`;
      return tool.dataset.teawareImageUrl || image?.classList.contains('teaware-photo')
        ? teawareApi.getImageData(src).then(({ dataUrl }) => loadToolImage(dataUrl))
        : loadToolImage(src);
    }));
    const top = y;
    const columnWidth = CONTENT_WIDTH / 3;
    const labels = tools.map(tool => wrapImageText(noteImageText(tool.querySelector('figcaption')), columnWidth - 32, line => {
      context.font = `400 26px ${family}`;
      return context.measureText(line).width;
    }));
    const rowHeights = Array.from({ length: Math.ceil(tools.length / 3) }, (_, row) =>
      228 + Math.max(...labels.slice(row * 3, row * 3 + 3).map(lines => lines.length)) * 40,
    );
    const height = rowHeights.reduce((sum, value) => sum + value, 0) + 24;
    commands.push(() => {
      context.fillStyle = '#293619';
      context.fillRect(PADDING, top, CONTENT_WIDTH, height);
      tools.forEach((tool, index) => {
        const image = images[index];
        const row = Math.floor(index / 3);
        const x = PADDING + (index % 3) * columnWidth;
        const rowTop = top + rowHeights.slice(0, row).reduce((sum, value) => sum + value, 0);
        const isPhoto = !!tool.dataset.teawareImageUrl || tool.querySelector('img')?.classList.contains('teaware-photo');
        const size = isPhoto ? 176 : 208;
        context.imageSmoothingEnabled = !!isPhoto;
        if (isPhoto) {
          const side = Math.min(image.naturalWidth, image.naturalHeight);
          context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, x + (columnWidth - size) / 2, rowTop + 32, size, size);
        } else {
          context.drawImage(image, x + (columnWidth - size) / 2, rowTop + 16, size, size);
        }
        context.fillStyle = MUTED;
        context.font = `400 26px ${family}`;
        context.textAlign = 'center';
        context.textBaseline = 'top';
        labels[index].forEach((line, lineIndex) => context.fillText(line, x + columnWidth / 2, rowTop + 228 + lineIndex * 40));
        context.textAlign = 'start';
      });
    });
    y += height;
  }
  const memo = field('memo', '.note-detail-prose');
  if (memo) { y += 34; text(memo); }

  // An eight-column table would become illegible on a social image. Each steep
  // is rendered as a complete labeled record, retaining every cell and newline.
  const table = card.querySelector('.note-detail-session-table');
  if (table) {
    section('다회모드 기록');
    const headers = Array.from(table.querySelectorAll('thead th'), cell => noteImageText(cell));
    table.querySelectorAll('tbody tr').forEach(row => {
      Array.from(row.querySelectorAll('td')).forEach((cell, index) => {
        text(`${headers[index] || ''}  ${noteImageText(cell)}`, 28, index === 0 ? INK : MUTED, index === 0);
      });
      y += 20;
    });
  }

  const axes = Array.from(card.querySelectorAll('.pixel-rating-row'));
  const tags = field('tags', '.note-detail-section-tags > div');
  const weather = field('weather');
  if (axes.length || tags || weather) {
    section('감각 프로필');
    const template = noteImageText(card.querySelector('.note-detail-template-panel'));
    if (template) { text(template, 26, MUTED); y += 16; }
    axes.forEach(row => {
      const label = noteImageText(row.querySelector('.pixel-rating-label'));
      const blocks = row.querySelector('.pixel-rating-blocks');
      const aria = blocks?.getAttribute('aria-label') || '';
      const score = aria.match(/([\d.]+\/[\d.]+)점$/)?.[1] || '';
      text(`${label}  ${score}`, 30);
      const top = y + 6;
      const filled = row.querySelectorAll('.pixel-rating-block[data-filled="true"]').length;
      commands.push(() => {
        for (let index = 0; index < 10; index++) {
          context.fillStyle = index < filled ? INK : '#536532';
          context.fillRect(PADDING + index * 93.6, top, 81.6, 18);
        }
      });
      y += 46;
    });
    if (tags) { y += 16; text(tags, 30, MUTED); }
    if (weather) { y += 16; text(weather, 28, MUTED); }
  }
  y += 48;
  text('차멍 · chamung.com', 26, MUTED);
  canvas.width = WIDTH;
  canvas.height = Math.max(1350, Math.ceil(y + PADDING));
  // Fail explicitly instead of silently clipping a very large note on mobile.
  if (canvas.height > 16000) throw new Error('차록이 너무 길어 한 장의 이미지로 저장할 수 없습니다.');
  context.fillStyle = '#263615';
  context.fillRect(0, 0, WIDTH, canvas.height);
  context.fillStyle = '#354f16';
  context.fillRect(24, 24, WIDTH - 48, canvas.height - 48);
  commands.forEach(draw => draw());
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => result ? resolve(result) : reject(new Error('이미지를 만들지 못했습니다. 다시 시도해 주세요.')), 'image/png');
  });
  return new File([blob], filename.replace(/(?:\.png)?$/i, '.png'), { type: 'image/png' });
}
