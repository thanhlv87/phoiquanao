// /api/generate-upload-url.js

export default async function handler(req, res) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return res.status(500).json({ error: 'Cloudflare credentials are not configured.' });
  }

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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare API error: ${errorText}`);
    }

    const { result } = await response.json();
    res.status(20).json({ uploadURL: result.uploadURL });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate upload URL.' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for file uploads
  },
};