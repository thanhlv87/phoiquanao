
export const compressImage = async (
  input: File | string, 
  options: { maxWidth: number; quality: number }
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      if (width > options.maxWidth) {
        height = Math.round((height * options.maxWidth) / width);
        width = options.maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context failed'));

      // Vẽ nền trắng nếu là ảnh tách nền (giúp Gemini nhận diện tốt hơn và đẹp hơn trên WebP)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // SỬ DỤNG WEBP: Nhẹ hơn JPEG rất nhiều mà chất lượng tương đương
      const compressedBase64 = canvas.toDataURL('image/webp', options.quality);
      resolve(compressedBase64);
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target?.result as string; };
      reader.readAsDataURL(input);
    }
  });
};
