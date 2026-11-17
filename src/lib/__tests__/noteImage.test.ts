import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createNoteImage, noteImageText, wrapImageText } from '../noteImage';

vi.mock('../api/teaware.api', () => ({ teawareApi: { getImageData: vi.fn().mockResolvedValue({ dataUrl: 'data:image/png;base64,cG5n' }) } }));

import { teawareApi } from '../api/teaware.api';

const measure = (text: string) => Array.from(text).length;

describe('note image text layout', () => {
  it('wraps at spaces and preserves explicit and blank lines', () => {
    expect(wrapImageText('오동단총 신 행인향\n\n끝향이 좋아요', 7, measure)).toEqual(['오동단총 신', '행인향', '', '끝향이 좋아요']);
  });
  it('splits long unbroken words without losing Korean or emoji characters', () => {
    expect(wrapImageText('가나다라마🙂🙂', 3, measure)).toEqual(['가나다', '라마🙂', '🙂']);
  });
  it('extracts rendered formatting and line breaks but excludes controls', () => {
    const element = document.createElement('div');
    element.innerHTML = '<p><strong>꽃향</strong><br>긴 여운</p><ul><li>부드러움</li><li>단맛</li></ul><button>사진</button><span aria-hidden="true">장식</span>';
    expect(noteImageText(element)).toBe('꽃향\n긴 여운\n• 부드러움\n• 단맛');
  });
});

describe('note image export', () => {
  beforeEach(() => { vi.mocked(teawareApi.getImageData).mockResolvedValue({ dataUrl: 'data:image/png;base64,cG5n' }); });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
  function setupCanvas() {
    const context = {
      font: '', fillStyle: '', textBaseline: '',
      measureText: vi.fn((text: string) => ({ width: Array.from(text).length * 28 })),
      fillText: vi.fn(), fillRect: vi.fn(), drawImage: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const sizes: number[] = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback) {
      sizes.push(this.width, this.height);
      callback(new Blob(['png'], { type: 'image/png' }));
    });
    return { context, sizes };
  }
  it('exports the entire memo, sensory scores and session cells without action labels', async () => {
    const { context, sizes } = setupCanvas();
    const card = document.createElement('section');
    card.innerHTML = `
      <span data-note-image="author">선립</span><span data-note-image="date">2026.07.26</span>
      <h2 class="note-detail-tea-title">오동단총 신 행인향</h2>
      <div class="note-detail-prose"><p>첫 향<br>마지막 여운</p></div>
      <table class="note-detail-session-table"><thead><tr><th>탕</th><th>메모</th></tr></thead><tbody><tr><td>1</td><td>깊은 향</td></tr></tbody></table>
      <div class="pixel-rating-row"><div class="pixel-rating-label"><span>단맛</span><button>설명</button></div><div class="pixel-rating-blocks" aria-label="단맛 4/5점"><span class="pixel-rating-block" data-filled="true"></span></div></div>
      <div data-note-image="tags">꽃향 허브향</div><button>삭제</button>`;
    const file = await createNoteImage(card, '차록-129.png');
    const rendered = context.fillText.mock.calls.map(call => call[0]).join('\n');
    expect(file.type).toBe('image/png');
    expect(file.name).toBe('차록-129.png');
    expect(sizes[0]).toBe(1080);
    expect(sizes[1]).toBeGreaterThanOrEqual(1350);
    expect(rendered).toContain('첫 향\n마지막 여운');
    expect(rendered).toContain('단맛 4/5');
    expect(rendered).toContain('메모 깊은 향');
    expect(rendered).toContain('꽃향 허브향');
    expect(rendered).not.toContain('삭제');
    expect(rendered).not.toContain('설명');
  });
  it('grows the canvas for long notes instead of truncating the memo', async () => {
    const { context, sizes } = setupCanvas();
    const card = document.createElement('section');
    card.innerHTML = `<div class="note-detail-prose">${Array.from({ length: 50 }, (_, index) => `기록 ${index}`).join('\n')}</div>`;
    await createNoteImage(card);
    expect(sizes[1]).toBeGreaterThan(3000);
    expect(context.fillText.mock.calls.some(call => call[0] === '기록 49')).toBe(true);
  });
  it('draws the selected tool images and complete labels on one exported board', async () => {
    const { context } = setupCanvas();
    vi.stubGlobal('Image', class {
      onload?: () => void;
      naturalWidth = 128;
      naturalHeight = 128;
      set src(_value: string) { queueMicrotask(() => this.onload?.()); }
    });
    const card = document.createElement('section');
    card.innerHTML = '<div data-note-image="teaware"><figure data-teaware-kind="gaiwan"><img src="/teaware/gaiwan.svg"><figcaption>개완</figcaption></figure><figure data-teaware-kind="cup" data-teaware-image-url="https://example.com/cup.jpg"><img class="teaware-pixel" src="/teaware/cup.svg"><figcaption>내 백자잔</figcaption></figure></div>';
    await createNoteImage(card);
    expect(context.drawImage.mock.calls.length).toBeGreaterThan(2);
    const toolDraws = context.drawImage.mock.calls.filter(call => call.length === 5);
    expect(toolDraws).toHaveLength(2);
    expect(toolDraws[0][2]).toBeLessThan(toolDraws[1][2]);
    expect(teawareApi.getImageData).toHaveBeenCalledWith('https://example.com/cup.jpg');
    const text = context.fillText.mock.calls.map(call => call[0]).join(' ');
    expect(text).toContain('사용한 다구');
    expect(text).toContain('내 백자잔');
  });
  it('reports unavailable tool photos instead of exporting a blank space', async () => {
    setupCanvas();
    vi.stubGlobal('Image', class {
      onerror?: () => void;
      set src(_value: string) { queueMicrotask(() => this.onerror?.()); }
    });
    const card = document.createElement('section');
    card.innerHTML = '<figure data-teaware-kind="cup"><img src="https://example.com/missing.jpg"><figcaption>찻잔</figcaption></figure>';
    await expect(createNoteImage(card)).rejects.toThrow('다구 사진을 불러오지 못했습니다');
  });
  it('rejects failed encoding instead of producing an empty file', async () => {
    setupCanvas();
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(null));
    await expect(createNoteImage(document.createElement('section'))).rejects.toThrow('이미지를 만들지 못했습니다');
  });
});
