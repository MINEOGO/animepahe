import { Env, WorkerResponse } from './config';

export const Proxy = async (request: Request, env: Env, ctx: ExecutionContext) => {
    const url = new URL(request.url);

    const proxyUrl = url.searchParams.get('proxyUrl'); 
    const modify = url.searchParams.has('modify');
    const download = url.searchParams.has('download'); // Check for download flag
    const filename = url.searchParams.get('filename') || 'episode.mp4'; // Optional filename

    if (!proxyUrl) {
        return WorkerResponse({ status: false }, 'application/json');
    }

    // Fetch the original file (stream)
    let res = await fetch(proxyUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Referer': 'https://kwik.cx/'
        }
    });

    if (modify) {
        // Recreate response to modify headers
        res = new Response(res.body, res)
        res.headers.set('Access-Control-Allow-Origin', '*')
        res.headers.set('Access-Control-Allow-Methods', 'GET,POST,HEAD,OPTIONS')
        res.headers.set('Access-Control-Max-Age', '86400')

        // If download flag is active, force browser to download
        if (download) {
            res.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
            res.headers.set('Content-Type', 'application/octet-stream');
        }
    }

    return res;
}
