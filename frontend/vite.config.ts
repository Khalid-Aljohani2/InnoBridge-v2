import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

function normalizeLaravelOrigin(raw: string): string {
    let v = raw.trim();
    if (!v) return '';
    v = v.replace(/\/+$/, '').replace(/\/api$/i, '');
    return v;
}

/**
 * Netlify SPA deep links (/login, /dashboard) belong to Laravel on Render — not React routes here.
 * Inline script runs before module JS loads (avoids seeing the probe shell on slow/mobile networks).
 */
function injectEarlyLaravelPathRedirect(apiOrigin: string): Plugin {
    const origin = normalizeLaravelOrigin(apiOrigin);
    return {
        name: 'inject-early-laravel-path-redirect',
        enforce: 'pre',
        transformIndexHtml(html) {
            if (!origin) return html;
            const body = `(function(){var o=${JSON.stringify(origin)};var p=location.pathname||"";if(!o||p==="/"||p==="")return;if(/^\\/(assets\\/|vite\\.svg|favicon\\.svg|favicon\\.ico|robots\\.txt)/.test(p))return;if(p.indexOf("/src/")===0||p.indexOf("/@")===0)return;location.replace(o+p+location.search+location.hash)})()`;
            /** Right after `<head>` so redirect runs before Vite’s injected module script tag. */
            const snippet = `<script>${body}</script>`;
            return /<head\b/i.test(html)
                ? html.replace(/<head[^>]*>/i, (m) => `${m}${snippet}`)
                : snippet + html;
        },
    };
}

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

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiOriginForRedirect = normalizeLaravelOrigin(env.VITE_API_BASE_URL ?? '');

    return {
        plugins: [react(), netlifyRequirePublicApiUrl(), injectEarlyLaravelPathRedirect(apiOriginForRedirect)],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
            },
        },
    };
});
