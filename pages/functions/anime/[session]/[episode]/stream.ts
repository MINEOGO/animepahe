interface Env {
    ASSETS: Fetcher;
}

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, params, env } = context;
    
    // These variables automatically capture the URL parts
    const session = params.session as string;
    const episode = params.episode as string;
    const userAgent = request.headers.get('User-Agent') || 'Mozilla/5.0';

    // 1. Fetch Episode Links
    const apiLinkUrl = `https://animepahelol.venkatesh10year.workers.dev/?method=episode&session=${session}&ep=${episode}`;
    let linkData: any[] = [];
    let seriesTitle = 'Anime Episode';
    let image = '';

    try {
        const [linkRes, seriesRes] = await Promise.all([
            fetch(apiLinkUrl, { headers: { 'User-Agent': userAgent } }),
            fetch(`https://animepahelol.venkatesh10year.workers.dev/?method=series&session=${session}&page=1`, { headers: { 'User-Agent': userAgent } })
        ]);

        linkData = await linkRes.json();
        const seriesData = await seriesRes.json() as any;

        if (seriesData?.title) {
            seriesTitle = seriesData.title;
            const epObj = seriesData.episodes?.find((e: any) => e.session === episode);
            if (epObj) {
                seriesTitle += ` - Episode ${epObj.episode}`;
                image = `https://animepahelol.venkatesh10year.workers.dev/proxy?modify&proxyUrl=${epObj.snapshot}`;
            }
        }
    } catch (e) {
        console.error("API Error", e);
    }

    // 2. Resolve Video URL (Server-Side for Discord Player)
    let videoUrl = '';
    
    // Only attempt bypass if it's a bot/crawler to save resources, or if you want instant embeds
    if (linkData && linkData.length > 0) {
        const target = linkData.find((l: any) => l.name.includes('1080')) || linkData[linkData.length - 1];
        if (target) {
            try {
                const bypassRes = await fetch(`https://kwik-bypass-mine.venkatesh10year.workers.dev/?url=${encodeURIComponent(target.link)}`);
                const bypassJson = await bypassRes.json() as any;

                if (bypassJson.success) {
                    // Discord needs the direct proxy link to play
                    videoUrl = `https://animepahelol.venkatesh10year.workers.dev/proxy?proxyUrl=${encodeURIComponent(bypassJson.url)}&modify`;
                }
            } catch (e) {
                console.error("Bypass Error", e);
            }
        }
    }

    // 3. Serve HTML with Tags
    const originalResponse = await env.ASSETS.fetch(request);
    const originalHtml = await originalResponse.text();

    let metaTags = `
        <meta property="og:title" content="${seriesTitle}" />
        <meta property="og:site_name" content="Made by mineogo" />
        <meta property="og:description" content="Click to watch now." />
        <meta property="og:image" content="${image}" />
        <meta property="og:url" content="${request.url}" />
        <meta property="og:type" content="video.other" />
        <meta name="theme-color" content="#a855f7" />
    `;

    if (videoUrl) {
        metaTags += `
            <meta property="og:video" content="${videoUrl}" />
            <meta property="og:video:url" content="${videoUrl}" />
            <meta property="og:video:secure_url" content="${videoUrl}" />
            <meta property="og:video:type" content="video/mp4" />
            <meta property="og:video:width" content="1280" />
            <meta property="og:video:height" content="720" />
        `;
    }

    const modifiedHtml = originalHtml.replace('</head>', `${metaTags}</head>`);

    return new Response(modifiedHtml, {
        headers: originalResponse.headers
    });
}
