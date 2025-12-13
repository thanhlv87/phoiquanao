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
        throw new Error(`Failed to get an upload URL from the backend. Status: ${response.status}`);
    }
    const { uploadURL } = await response.json();

    // 2. Create a FormData object and append the file.
    const formData = new FormData();
    formData.append('file', file);

    // 3. Upload the file directly to the Cloudflare URL.
    const uploadResponse = await fetch(uploadURL, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Cloudflare upload failed.');
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