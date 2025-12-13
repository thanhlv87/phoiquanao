// Vite plugin to handle API routes for local development
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
config({ path: resolve(__dirname, '.env') });

export default function apiPlugin() {
    return {
        name: 'vite-plugin-api',
        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (req.url === '/api/generate-upload-url') {
                    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
                    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

                    console.log('[API] Generate Upload URL called');
                    console.log('[API] Account ID exists:', !!accountId);
                    console.log('[API] API Token exists:', !!apiToken);

                    if (!accountId || !apiToken) {
                        console.error('[API] Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN');
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Cloudflare credentials are not configured.' }));
                        return;
                    }

                    console.log(`[API] Attempting to get upload URL for account: ${accountId.substring(0, 6)}...`);

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
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ error: `Cloudflare API error: ${errorText}` }));
                            return;
                        }

                        const result = await response.json();
                        console.log(`[API] Upload URL generated successfully`);

                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ uploadURL: result.result.uploadURL }));
                    } catch (error) {
                        console.error('[API] Error in generate-upload-url handler:', error);
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: 'Failed to generate upload URL.' }));
                    }
                } else {
                    next();
                }
            });
        },
    };
}
