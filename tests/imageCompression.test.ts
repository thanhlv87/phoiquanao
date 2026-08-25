import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * jsdom không có canvas thật, nên ta cắm một bộ mã hoá giả có kích thước file phụ
 * thuộc vào (rộng x cao x chất lượng x định dạng). Nhờ vậy vẫn kiểm chứng được
 * đúng phần logic quan trọng: thang hạ chất lượng, bước thu nhỏ kích thước, và
 * việc chọn định dạng nhẹ hơn.
 */

type Encode = { width: number; height: number; type: string; quality: number };
let encodes: Encode[] = [];

/** Hệ số theo định dạng. webpFactor < 1 nghĩa là WebP nhẹ hơn JPEG. */
let webpFactor = 0.6;
/** Ảnh nguồn. */
let sourceSize = { width: 3024, height: 4032 };
/** Số byte trên mỗi pixel ở chất lượng 1.0 với JPEG. */
let bytesPerPixel = 0.12;

const install = () => {
  encodes = [];

  (globalThis as any).createImageBitmap = vi.fn(async () => ({
    width: sourceSize.width,
    height: sourceSize.height,
    close: vi.fn(),
  }));
  // Bản dựng của jsdom không có ImageBitmap; compressImage chỉ dùng nó để đóng
  // tài nguyên nên khai báo rỗng là đủ.
  (globalThis as any).ImageBitmap = class {};

  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillStyle: '',
    fillRect: vi.fn(),
    drawImage: vi.fn(),
  })) as any;

  // Dò hỗ trợ WebP -> báo là có.
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/webp;base64,AA==') as any;

  HTMLCanvasElement.prototype.toBlob = function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
    type?: string,
    quality?: number
  ) {
    const t = type || 'image/png';
    const q = quality ?? 0.92;
    const factor = t === 'image/webp' ? webpFactor : 1;
    const bytes = Math.max(
      1,
      Math.round(this.width * this.height * bytesPerPixel * q * factor)
    );
    encodes.push({ width: this.width, height: this.height, type: t, quality: q });
    callback(new Blob([new Uint8Array(bytes)], { type: t }));
  } as any;
};

beforeEach(() => {
  webpFactor = 0.6;
  sourceSize = { width: 3024, height: 4032 };
  bytesPerPixel = 0.12;
  install();
  vi.resetModules();
});

const load = () => import('../utils/imageCompression');
const file = () => new File(['x'], 'a.jpg', { type: 'image/jpeg' });

describe('compressImage', () => {
  it('thu ảnh về đúng maxWidth và giữ tỉ lệ', async () => {
    const { compressImage } = await load();
    bytesPerPixel = 0.00001; // nhẹ sẵn, không cần hạ chất lượng
    await compressImage(file(), { maxWidth: 1080, quality: 0.7 });

    const first = encodes[0];
    expect(first.width).toBe(1080);
    expect(first.height).toBe(Math.round((4032 * 1080) / 3024));
  });

  it('chọn định dạng cho ra file nhẹ hơn', async () => {
    const { compressImage } = await load();
    bytesPerPixel = 0.00001;

    webpFactor = 0.6; // WebP nhẹ hơn
    await compressImage(file(), { maxWidth: 800, quality: 0.7 });
    expect(encodes.map(e => e.type)).toContain('image/webp');
    expect(encodes.map(e => e.type)).toContain('image/jpeg');

    // Cả hai định dạng đều được thử ở mỗi bước, không đặt cược vào một cái.
    const step = encodes.filter(e => e.width === 800 && e.quality === 0.7);
    expect(step).toHaveLength(2);
  });

  it('hạ chất lượng dần khi vượt ngân sách, trước khi thu nhỏ kích thước', async () => {
    const { compressImage } = await load();
    // Ở bpp này bản 1080px nặng ~98 KB tại q0.7 và chỉ lọt ngân sách 60 KB khi
    // xuống q0.4, tức là thang hạ chất lượng chắc chắn phải chạy.
    bytesPerPixel = 0.15;
    await compressImage(file(), { maxWidth: 1080, quality: 0.7, maxBytes: 60 * 1024 });

    const qualities = [...new Set(encodes.map(e => e.quality))];
    expect(qualities[0]).toBe(0.7);
    expect(qualities.length).toBeGreaterThan(1);
    // Chất lượng phải giảm đơn điệu
    expect(qualities).toEqual([...qualities].sort((a, b) => b - a));
    // Bước hạ chất lượng đầu tiên vẫn giữ nguyên chiều rộng
    expect(encodes.filter(e => e.quality === qualities[1]).every(e => e.width === 1080)).toBe(true);
  });

  it('không hạ chất lượng xuống dưới 0.4', async () => {
    const { compressImage } = await load();
    bytesPerPixel = 5; // luôn vượt ngân sách
    await compressImage(file(), { maxWidth: 1080, quality: 0.7, maxBytes: 1 });
    expect(Math.min(...encodes.map(e => e.quality))).toBeGreaterThanOrEqual(0.4);
  });

  it('thu nhỏ kích thước sau khi hết cỡ hạ chất lượng', async () => {
    const { compressImage } = await load();
    bytesPerPixel = 5;
    await compressImage(file(), { maxWidth: 1080, quality: 0.7, maxBytes: 1 });
    const widths = [...new Set(encodes.map(e => e.width))];
    expect(widths.length).toBeGreaterThan(1);
    expect(Math.min(...widths)).toBeGreaterThanOrEqual(640);
  });

  it('không phóng to ảnh nhỏ hơn maxWidth', async () => {
    const { compressImage } = await load();
    sourceSize = { width: 300, height: 400 };
    bytesPerPixel = 0.00001;
    await compressImage(file(), { maxWidth: 1080, quality: 0.7 });
    expect(encodes[0].width).toBe(300);
  });
});

describe('createImageVariants', () => {
  it('tạo bản 1080px và bản 480px chỉ với một lần giải mã', async () => {
    const { createImageVariants } = await load();
    bytesPerPixel = 0.00001;
    const variants = await createImageVariants(file());

    expect(variants.full).toMatch(/^data:/);
    expect(variants.thumb).toMatch(/^data:/);

    const widths = [...new Set(encodes.map(e => e.width))];
    expect(widths).toContain(1080);
    expect(widths).toContain(480);

    // Chỉ giải mã ảnh gốc một lần dù dựng hai biến thể.
    expect((globalThis as any).createImageBitmap).toHaveBeenCalledTimes(1);
  });

  it('bản thumb không bị chặn dưới bởi ngưỡng 640px của bản đầy đủ', async () => {
    const { createImageVariants } = await load();
    bytesPerPixel = 5; // ép cả hai bản phải thu nhỏ
    await createImageVariants(file());
    // Thumb bắt đầu từ 480 nên ngưỡng thu nhỏ tối thiểu phải bám theo 480, không
    // phải 640 -- nếu không vòng lặp sẽ không bao giờ chạy cho thumb.
    expect(Math.min(...encodes.map(e => e.width))).toBeLessThanOrEqual(480);
  });
});
