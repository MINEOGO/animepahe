import { Env, WorkerResponse } from './config';

export const Proxy = async (request: Request, env: Env, ctx: ExecutionContext) => {
    const url = new URL(request.url);

    const proxyUrl = url.searchParams.get('proxyUrl'); 
    const modify = url.searchParams.has('modify');
    const download = url.searchParams.has('download'); 
    const filename = url.searchParams.get('filename') || 'episode.mp4';

    if (!proxyUrl) {
        return WorkerResponse({ status: false }, 'application/json');
    }

    // Fix: Add headers to mimic a real browser on AnimePahe
    let res = await fetch(proxyUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://animepahe.si/', // Essential for images
            'Origin': 'https://animepahe.si'
        }
    });

    // If the fetch fails (e.g. 403/404), return the status
    if (!res.ok) {
        return new Response(res.body, { status: res.status, statusText: res.statusText });
    }

    if (modify) {
        // Recreate response to modify headers
        const newHeaders = new Headers(res.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET,POST,HEAD,OPTIONS');
        newHeaders.set('Access-Control-Max-Age', '86400');

        if (download) {
            newHeaders.set('Content-Disposition', `attachment; filename="${filename}"`);
            newHeaders.set('Content-Type', 'application/octet-stream');
        } else {
            // For images, ensure content-type is passed through or set explicitly if missing
            if (!newHeaders.has('Content-Type')) {
                if (proxyUrl.endsWith('.jpg')) newHeaders.set('Content-Type', 'image/jpeg');
                if (proxyUrl.endsWith('.png')) newHeaders.set('Content-Type', 'image/png');
            }
        }

        res = new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: newHeaders
        });
    }

    return res;
}
