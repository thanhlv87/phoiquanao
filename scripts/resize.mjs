/**
 * Thu nhỏ ảnh phía máy chủ cho script bảo trì.
 *
 * Trình duyệt dùng canvas (utils/imageCompression.ts), còn ở đây là Node nên dùng
 * sharp. Giữ đúng cùng bộ tham số: 1080px cho bản đầy đủ, 480px cho thumb, và
 * chọn định dạng nào cho ra file nhẹ hơn giữa WebP và JPEG.
 */

export const FULL = { maxWidth: 1080, maxBytes: 250 * 1024 };
export const THUMB = { maxWidth: 480, maxBytes: 60 * 1024 };

const QUALITY_LADDER = [70, 60, 50, 40];

/**
 * @param {Buffer} input ảnh gốc
 * @param {{maxWidth:number,maxBytes:number}} target
 * @param {(buf: Buffer) => any} sharpFactory
 * @returns {Promise<{buffer: Buffer, contentType: string, quality: number}>}
 */
export const resizeToBudget = async (input, target, sharpFactory) => {
  let best = null;

  for (const quality of QUALITY_LADDER) {
    const base = () =>
      sharpFactory(input).rotate().resize({
        width: target.maxWidth,
        // Không phóng to ảnh vốn đã nhỏ hơn.
        withoutEnlargement: true,
        fit: 'inside',
      });

    const [webp, jpeg] = await Promise.all([
      base().webp({ quality }).toBuffer(),
      base().jpeg({ quality, mozjpeg: true }).toBuffer(),
    ]);

    const candidate = webp.length <= jpeg.length
      ? { buffer: webp, contentType: 'image/webp', quality }
      : { buffer: jpeg, contentType: 'image/jpeg', quality };

    // Luôn giữ ứng viên nhỏ nhất gặp được, kể cả khi không bao giờ lọt ngân sách.
    if (!best || candidate.buffer.length < best.buffer.length) best = candidate;

    if (candidate.buffer.length <= target.maxBytes) return candidate;
  }

  return best;
};

export const extensionForContentType = (contentType) =>
  contentType === 'image/webp' ? 'webp' : 'jpg';
