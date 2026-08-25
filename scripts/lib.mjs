/**
 * Hàm thuần dùng chung cho các script bảo trì.
 *
 * Tách riêng để test được: find-orphan-files chạy với --apply sẽ xoá file thật,
 * nên việc bóc đường dẫn từ URL sai một chút là mất ảnh đang dùng.
 */

export const isDataUrl = (value) =>
  typeof value === 'string' && value.startsWith('data:');

/** Bóc content type và dữ liệu nhị phân từ một data URL base64. */
export const parseDataUrl = (dataUrl) => {
  const comma = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || comma === -1) {
    throw new Error('Không phải data URL hợp lệ');
  }
  const header = dataUrl.slice(5, comma);
  const contentType = header.split(';')[0] || 'image/jpeg';
  return { contentType, base64: dataUrl.slice(comma + 1) };
};

export const extensionFor = (contentType) =>
  contentType === 'image/webp' ? 'webp'
    : contentType === 'image/png' ? 'png'
      : 'jpg';

/**
 * Lấy đường dẫn object từ URL tải về của Firebase.
 *
 * Dạng URL: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path%2Fđã%2Fmã%2Fhoá>?alt=media&token=...
 * Trả về null với thứ không phải URL tải về, để phía gọi coi như "không xác định
 * được" và tuyệt đối không đem đi so khớp xoá.
 */
export const pathFromDownloadUrl = (url) => {
  if (typeof url !== 'string') return null;
  const match = /\/o\/([^?]+)/.exec(url);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
};
