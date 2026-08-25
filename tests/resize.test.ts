import { describe, it, expect, vi } from 'vitest';
// @ts-expect-error - script helper thuần JS, không có type
import { resizeToBudget, extensionForContentType, FULL, THUMB } from '../scripts/resize.mjs';

/**
 * sharp là native binary, không nạp trong jsdom. Ta cắm một sharp giả có kích
 * thước đầu ra phụ thuộc chất lượng để kiểm chứng phần quyết định: thang hạ chất
 * lượng, chọn định dạng nhẹ hơn, và hành vi khi không tài nào lọt ngân sách.
 */
const fakeSharp = (opts: { webpBytes: (q: number) => number; jpegBytes: (q: number) => number }) => {
  const calls: { format: string; quality: number; width: number }[] = [];
  const factory: any = () => {
    let width = 0;
    const chain: any = {
      rotate: () => chain,
      resize: (o: any) => { width = o.width; return chain; },
      webp: ({ quality }: any) => ({
        toBuffer: async () => {
          calls.push({ format: 'webp', quality, width });
          return Buffer.alloc(opts.webpBytes(quality));
        },
      }),
      jpeg: ({ quality }: any) => ({
        toBuffer: async () => {
          calls.push({ format: 'jpeg', quality, width });
          return Buffer.alloc(opts.jpegBytes(quality));
        },
      }),
    };
    return chain;
  };
  factory.calls = calls;
  return factory;
};

const input = Buffer.alloc(10);

describe('resizeToBudget', () => {
  it('dừng ngay ở chất lượng đầu tiên nếu đã lọt ngân sách', async () => {
    const sharp = fakeSharp({ webpBytes: () => 1000, jpegBytes: () => 2000 });
    const r = await resizeToBudget(input, FULL, sharp);
    expect(r.quality).toBe(70);
    expect(r.contentType).toBe('image/webp');
    expect(sharp.calls.every((c: any) => c.quality === 70)).toBe(true);
  });

  it('chọn JPEG khi JPEG nhẹ hơn (ảnh nhiễu hạt)', async () => {
    const sharp = fakeSharp({ webpBytes: () => 5000, jpegBytes: () => 3000 });
    const r = await resizeToBudget(input, FULL, sharp);
    expect(r.contentType).toBe('image/jpeg');
  });

  it('hạ chất lượng dần cho tới khi lọt ngân sách', async () => {
    // Chỉ q50 trở xuống mới dưới 60 KB
    const bytes = (q: number) => (q >= 60 ? 90_000 : 50_000);
    const sharp = fakeSharp({ webpBytes: bytes, jpegBytes: bytes });
    const r = await resizeToBudget(input, THUMB, sharp);
    expect(r.quality).toBe(50);
    expect(r.buffer.length).toBeLessThanOrEqual(THUMB.maxBytes);
  });

  it('không tụt xuống dưới q40 và vẫn trả về bản nhỏ nhất khi không đạt ngân sách', async () => {
    const bytes = (q: number) => q * 10_000; // luôn vượt
    const sharp = fakeSharp({ webpBytes: bytes, jpegBytes: bytes });
    const r = await resizeToBudget(input, THUMB, sharp);
    expect(r).not.toBeNull();
    expect(r.quality).toBe(40);
    expect(Math.min(...sharp.calls.map((c: any) => c.quality))).toBe(40);
  });

  it('yêu cầu đúng chiều rộng mục tiêu cho từng biến thể', async () => {
    const sharp = fakeSharp({ webpBytes: () => 100, jpegBytes: () => 200 });
    await resizeToBudget(input, FULL, sharp);
    expect(sharp.calls[0].width).toBe(1080);

    const sharp2 = fakeSharp({ webpBytes: () => 100, jpegBytes: () => 200 });
    await resizeToBudget(input, THUMB, sharp2);
    expect(sharp2.calls[0].width).toBe(480);
  });
});

describe('extensionForContentType', () => {
  it('khớp đuôi với định dạng', () => {
    expect(extensionForContentType('image/webp')).toBe('webp');
    expect(extensionForContentType('image/jpeg')).toBe('jpg');
  });
});

describe('ngân sách', () => {
  it('khớp với giá trị bên trình duyệt', () => {
    expect(FULL).toEqual({ maxWidth: 1080, maxBytes: 250 * 1024 });
    expect(THUMB).toEqual({ maxWidth: 480, maxBytes: 60 * 1024 });
  });
});
