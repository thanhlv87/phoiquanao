export interface CompressOptions {
  /** Chiều rộng tối đa. Ảnh nhỏ hơn mức này không bị phóng to. */
  maxWidth: number;
  /** Chất lượng khởi điểm (0-1). Sẽ tự hạ dần nếu ảnh vẫn vượt maxBytes. */
  quality: number;
  /** Ngân sách dung lượng cho mỗi ảnh. Mặc định 250 KB. */
  maxBytes?: number;
  /** Ép định dạng đầu ra. Mặc định WebP nếu trình duyệt hỗ trợ, không thì JPEG. */
  mimeType?: string;
}

const DEFAULT_MAX_BYTES = 250 * 1024;
const MIN_QUALITY = 0.4;
const MIN_WIDTH = 640;

// WebP nhỏ hơn JPEG khoảng 25-35% ở cùng mức nhìn, nên ưu tiên dùng.
let webpSupported: boolean | null = null;
const supportsWebP = (): boolean => {
  if (webpSupported === null) {
    const probe = document.createElement('canvas');
    probe.width = probe.height = 1;
    webpSupported = probe.toDataURL('image/webp').startsWith('data:image/webp');
  }
  return webpSupported;
};

type Source = ImageBitmap | HTMLImageElement;

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = src;
  });

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

const loadSource = async (input: File | string): Promise<Source> => {
  if (typeof input === 'string') return loadImageElement(input);
  // createImageBitmap áp dụng sẵn EXIF orientation, tránh ảnh chụp dọc bị xoay ngang.
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(input, { imageOrientation: 'from-image' });
    } catch {
      // Một số trình duyệt không nhận imageOrientation, rơi xuống nhánh dưới.
    }
  }
  return loadImageElement(await readAsDataUrl(input));
};

const render = (source: Source, width: number, height: number, type: string, quality: number): Promise<Blob | null> => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context failed');

  // Nền trắng: ảnh nguồn có vùng trong suốt sẽ thành đen khi mã hoá JPEG.
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);

  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to encode compressed image'));
    reader.readAsDataURL(blob);
  });

const closeSource = (source: Source) => {
  // ImageBitmap giữ bộ nhớ cho tới khi được đóng.
  if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
    source.close();
  }
};

/**
 * Nén một ảnh đã nạp sẵn về trong ngân sách dung lượng.
 *
 * Thứ tự nhượng bộ: hạ chất lượng trước (ít lộ hơn), hết cỡ rồi mới thu nhỏ kích
 * thước. Kích thước file được đo trên blob đã mã hoá thật, không phải ước lượng.
 */
const compressSource = async (source: Source, options: CompressOptions): Promise<string> => {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const minWidth = Math.min(MIN_WIDTH, options.maxWidth);

  // WebP thường nhỏ hơn JPEG 30-40% với ảnh chụp, nhưng với ảnh nhiễu hạt nặng nó
  // lại to hơn. Đo cả hai rồi giữ bản nhẹ hơn thay vì đặt cược vào một định dạng.
  const types = options.mimeType
    ? [options.mimeType]
    : supportsWebP()
      ? ['image/webp', 'image/jpeg']
      : ['image/jpeg'];

  const renderSmallest = async (w: number, h: number, q: number): Promise<Blob | null> => {
    let best: Blob | null = null;
    for (const type of types) {
      const blob = await render(source, w, h, type, q);
      if (blob && (!best || blob.size < best.size)) best = blob;
    }
    return best;
  };

  let width = source.width;
  let height = source.height;
  if (width > options.maxWidth) {
    height = Math.round((height * options.maxWidth) / width);
    width = options.maxWidth;
  }

  let quality = options.quality;
  let blob = await renderSmallest(width, height, quality);

  while (blob && blob.size > maxBytes && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, Number((quality - 0.1).toFixed(2)));
    blob = await renderSmallest(width, height, quality);
  }

  while (blob && blob.size > maxBytes && width > minWidth) {
    width = Math.max(minWidth, Math.round(width * 0.85));
    height = Math.round((source.height * width) / source.width);
    blob = await renderSmallest(width, height, quality);
  }

  if (!blob) throw new Error('Không thể nén ảnh');
  return blobToDataUrl(blob);
};

export const compressImage = async (
  input: File | string,
  options: CompressOptions
): Promise<string> => {
  const source = await loadSource(input);
  try {
    return await compressSource(source, options);
  } finally {
    closeSource(source);
  }
};

export interface ImageVariants {
  /** Bản đầy đủ, dùng cho carousel và modal xem chi tiết. */
  full: string;
  /** Bản nhỏ, dùng cho lưới lịch và lưới chọn ảnh. */
  thumb: string;
}

// Ứng dụng chỉ chạy trên điện thoại. Ở DPR 3, chỗ hiển thị to nhất (modal ảnh trên
// máy 430px) cần ~1290px, còn ô lịch chỉ cần ~141px và thẻ preview ~549px. Nên một
// bản 1080px cho chỗ to và một bản 480px cho mọi chỗ nhỏ là phủ hết.
const FULL_OPTIONS: CompressOptions = { maxWidth: 1080, quality: 0.7, maxBytes: 250 * 1024 };
const THUMB_OPTIONS: CompressOptions = { maxWidth: 480, quality: 0.7, maxBytes: 60 * 1024 };

/**
 * Tạo cả hai biến thể từ một lần giải mã ảnh gốc.
 *
 * Ảnh 12MP giải mã rất tốn CPU trên điện thoại, nên nạp nguồn đúng một lần rồi
 * dựng cả hai bản, thay vì gọi compressImage hai lượt.
 */
export const createImageVariants = async (input: File | string): Promise<ImageVariants> => {
  const source = await loadSource(input);
  try {
    return {
      full: await compressSource(source, FULL_OPTIONS),
      thumb: await compressSource(source, THUMB_OPTIONS),
    };
  } finally {
    closeSource(source);
  }
};
