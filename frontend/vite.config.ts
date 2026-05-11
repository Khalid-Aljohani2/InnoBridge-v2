import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Vite inlines `VITE_*` at build time. Netlify builds without `VITE_API_BASE_URL`
 * silently ship localhost as the API — set the var in Site settings and redeploy.
 */
function netlifyRequirePublicApiUrl(): Plugin {
    return {
        name: 'netlify-require-public-api-url',
        configResolved(config) {
            if (config.command !== 'build' || process.env.NETLIFY !== 'true') return;
            const base = (process.env.VITE_API_BASE_URL ?? '').trim();
            if (!base || /127\.0\.0\.1|localhost/i.test(base)) {
                throw new Error(
                    'Netlify: set VITE_API_BASE_URL to your Render API root (e.g. https://your-app.onrender.com) in Site configuration → Environment variables, then trigger a new deploy.',
                );
            }
        },
    };
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), netlifyRequirePublicApiUrl()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});
