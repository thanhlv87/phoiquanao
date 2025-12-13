// This service will handle Cloudflare image uploads.
// The API endpoint for your backend function that generates the Cloudflare upload URL.
// This should be stored in an environment variable.
// Use an absolute URL in production and a relative one in development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const UPLOAD_URL_GENERATOR_ENDPOINT = `${API_BASE_URL}/api/generate-upload-url`;


/**
 * Uploads a file to Cloudflare Images by first getting a one-time upload URL from our backend.
 * @param file The image file to upload.
 * @returns The URL of the uploaded image on Cloudflare.
 */
export const uploadToCloudflare = async (file: File): Promise<string> => {
  try {
    // 1. Get a one-time upload URL from your backend.
    console.log(`Requesting upload URL from: ${UPLOAD_URL_GENERATOR_ENDPOINT}`);
    const response = await fetch(UPLOAD_URL_GENERATOR_ENDPOINT);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend response (not ok):', errorText);
      console.error('Response status:', response.status);

      if (response.status === 500) {
        throw new Error('Lỗi server: Không thể tạo URL upload. Vui lòng kiểm tra cấu hình Cloudflare trong file .env');
      }
      throw new Error(`Không thể lấy URL upload từ backend. Mã lỗi: ${response.status}`);
    }
    const { uploadURL } = await response.json();
    console.log(`Received upload URL from backend: ${uploadURL.substring(0, 20)}...`); // Log first 20 chars for security

    // 2. Create a FormData object and append the file.
    const formData = new FormData();
    formData.append('file', file);

    // 3. Upload the file directly to the Cloudflare URL.
    // Ensure no manual Content-Type header is set, so the browser handles multipart/form-data correctly.
    const uploadResponse = await fetch(uploadURL, {
      method: 'POST',
      body: formData,
      // Do not set 'Content-Type' header, browser will set it with the correct boundary
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Cloudflare upload error:', errorText);
      console.error('Upload response status:', uploadResponse.status);

      if (uploadResponse.status === 403) {
        throw new Error('Lỗi 403: Cloudflare từ chối upload. Vui lòng kiểm tra API Token có quyền "Cloudflare Images Write".');
      }
      throw new Error(`Upload lên Cloudflare thất bại. Mã lỗi: ${uploadResponse.status}`);
    }

    const result = await uploadResponse.json();

    // 4. Extract the public URL of the uploaded image.
    // The structure of the result object might vary. Check Cloudflare's documentation.
    const publicUrl = result.result.variants[0]; // Example: getting the public variant

    if (!publicUrl) {
      throw new Error('Could not get public URL from Cloudflare response.');
    }

    console.log(`Successfully uploaded to Cloudflare: ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    console.error('Error in Cloudflare upload process:', error);
    // Re-throw the error so the calling component can handle it (e.g., show a UI message).
    throw error;
  }
};