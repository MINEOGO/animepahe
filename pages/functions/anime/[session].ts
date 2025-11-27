interface Env {
    ASSETS: Fetcher;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, next, params, env } = context;
    
    // "session" here grabs whatever is in the URL
    const session = params.session as string;
    const userAgent = request.headers.get('User-Agent') || 'Mozilla/5.0';

    // 1. Fetch Anime Details dynamically using the session from URL
    const apiUrl = `https://animepahelol.venkatesh10year.workers.dev/?method=series&session=${session}&page=1`;
    
    let data: any = {};
    try {
        const apiRes = await fetch(apiUrl, {
            headers: { 'User-Agent': userAgent }
        });
        data = await apiRes.json();
    } catch (e) {
        // If API fails, we continue to serve the page, just with default tags
    }

    // 2. Get the original HTML
    const originalResponse = await env.ASSETS.fetch(request);
    const originalHtml = await originalResponse.text();

    // 3. Dynamic Meta Data
    const title = data?.title || 'AnimePahe Downloader';
    const image = data?.episodes?.[0]?.snapshot 
        ? `https://animepahelol.venkatesh10year.workers.dev/proxy?modify&proxyUrl=${data.episodes[0].snapshot}`
        : 'https://animepahe.ru/default_poster.jpg'; 
    
    const description = data?.title 
        ? `Watch ${data.title} in high quality. This website is made by mineogo.`
        : `Watch Anime in high quality. This website is made by mineogo.`;

    const url = request.url;

    // 4. Inject
    const metaTags = `
        <meta property="og:title" content="${title}" />
        <meta property="og:site_name" content="Made by mineogo" />
        <meta property="og:description" content="${description}" />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="${url}" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="theme-color" content="#a855f7" />
    `;

    const modifiedHtml = originalHtml.replace('</head>', `${metaTags}</head>`);

    return new Response(modifiedHtml, {
        headers: originalResponse.headers
    });
}
