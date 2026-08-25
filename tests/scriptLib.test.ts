import { describe, it, expect } from 'vitest';
// @ts-expect-error - script helper thuần JS, không có type
import { isDataUrl, parseDataUrl, extensionFor, pathFromDownloadUrl } from '../scripts/lib.mjs';

describe('pathFromDownloadUrl', () => {
  const bucket = 'https://firebasestorage.googleapis.com/v0/b/phoiquanao.firebasestorage.app/o/';

  it('giải mã đường dẫn có %2F', () => {
    const url = `${bucket}users%2Fabc123%2Fimages%2Fout1%2F1700000000-ab12.webp?alt=media&token=xyz`;
    expect(pathFromDownloadUrl(url)).toBe('users/abc123/images/out1/1700000000-ab12.webp');
  });

  it('bỏ phần query', () => {
    const url = `${bucket}users%2Fu%2Fimages%2Fo%2Fa.jpg?alt=media&token=t-1234`;
    expect(pathFromDownloadUrl(url)).not.toContain('?');
    expect(pathFromDownloadUrl(url)).not.toContain('token');
  });

  it('xử lý được tên file có dấu và khoảng trắng', () => {
    const path = 'users/u/images/o/ảnh đẹp.jpg';
    const url = `${bucket}${encodeURIComponent(path)}?alt=media`;
    expect(pathFromDownloadUrl(url)).toBe(path);
  });

  // Đây là phần nguy hiểm: trả null nghĩa là "không xác định được", phía gọi sẽ
  // không đưa vào tập tham chiếu -- nhưng cũng không được crash.
  it('trả null với thứ không phải URL tải về', () => {
    expect(pathFromDownloadUrl('data:image/jpeg;base64,AAAA')).toBeNull();
    expect(pathFromDownloadUrl('https://example.com/anh.jpg')).toBeNull();
    expect(pathFromDownloadUrl('')).toBeNull();
    expect(pathFromDownloadUrl(undefined)).toBeNull();
    expect(pathFromDownloadUrl(null)).toBeNull();
    expect(pathFromDownloadUrl(123)).toBeNull();
  });

  it('trả null khi phần mã hoá hỏng thay vì ném lỗi', () => {
    expect(pathFromDownloadUrl(`${bucket}%E0%A4%A?alt=media`)).toBeNull();
  });

  it('khứ hồi được với mọi đường dẫn app sinh ra', () => {
    for (const path of [
      'users/uid1/images/outfit1/1700000000-abc123.webp',
      'users/uid1/images/outfit1/1700000000-abc123_thumb.webp',
      'users/uid1/images/outfit1/migrated-1700000000-0.jpg',
      'users/uid1/mix_results/old.png',
    ]) {
      expect(pathFromDownloadUrl(`${bucket}${encodeURIComponent(path)}?alt=media&token=t`)).toBe(path);
    }
  });
});

describe('parseDataUrl', () => {
  it('bóc đúng content type và phần base64', () => {
    const { contentType, base64 } = parseDataUrl('data:image/webp;base64,SGVsbG8=');
    expect(contentType).toBe('image/webp');
    expect(base64).toBe('SGVsbG8=');
  });

  it('mặc định image/jpeg khi thiếu content type', () => {
    expect(parseDataUrl('data:;base64,AAAA').contentType).toBe('image/jpeg');
  });

  it('ném lỗi với chuỗi không phải data URL', () => {
    expect(() => parseDataUrl('https://example.com/a.jpg')).toThrow();
  });
});

describe('isDataUrl / extensionFor', () => {
  it('phân biệt data URL và URL Storage', () => {
    expect(isDataUrl('data:image/jpeg;base64,AA')).toBe(true);
    expect(isDataUrl('https://firebasestorage.googleapis.com/x')).toBe(false);
    expect(isDataUrl(undefined)).toBe(false);
  });

  it('chọn đuôi file theo content type', () => {
    expect(extensionFor('image/webp')).toBe('webp');
    expect(extensionFor('image/png')).toBe('png');
    expect(extensionFor('image/jpeg')).toBe('jpg');
    expect(extensionFor('image/gì-đó-lạ')).toBe('jpg');
  });
});
