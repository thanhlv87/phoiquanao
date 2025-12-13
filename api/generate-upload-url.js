// /api/generate-upload-url.js

export default async function handler(req, res) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  console.log('[API] Generate Upload URL called');
  if (!accountId || !apiToken) {
    console.error('[API] Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN');
    return res.status(500).json({ error: 'Cloudflare credentials are not configured.' });
 }

  console.log(`[API] Attempting to get upload URL for account: ${accountId.substring(0, 6)}...`); // Log first 6 chars only

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    console.log(`[API] Cloudflare API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Cloudflare API error: ${errorText}`);
      throw new Error(`Cloudflare API error: ${errorText}`);
    }

    const result = await response.json();
    console.log(`[API] Upload URL generated successfully`);

    res.status(200).json({ uploadURL: result.result.uploadURL }); // Ensure 200 status

  } catch (error) {
    console.error('[API] Error in generate-upload-url handler:', error);
    res.status(500).json({ error: 'Failed to generate upload URL.' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
  },
};