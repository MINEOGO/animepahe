import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Spinner } from '@nextui-org/react';
import { ArrowLeft, Settings, PictureInPicture } from 'lucide-react'; // Added Icon
import useAxios from '../hooks/useAxios';
import { ANIME, KWIK } from '../config/config';
import { DownloadLinks, DirectLink } from 'fetch/requests';
import toast from 'react-hot-toast';

interface VideoSource {
    quality: string;
    url: string;
}

const Player = () => {
    const { session, episode } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const meta = location.state || {};

    const { request } = useAxios();
    const [sources, setSources] = useState<VideoSource[]>([]);
    const [currentSrc, setCurrentSrc] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [statusText, setStatusText] = useState('Initializing...');

    useEffect(() => {
        const initPlayer = async () => {
            if (!session || !episode) return;
            setLoading(true);

            try {
                setStatusText('Fetching sources...');
                const linkData = await request<DownloadLinks>({
                    server: ANIME,
                    endpoint: `/?method=episode&session=${session}&ep=${episode}`,
                    method: 'GET'
                });

                if (!linkData || linkData.length === 0) {
                    toast.error("No links found for this episode.");
                    setLoading(false);
                    return;
                }

                setStatusText('Bypassing protections...');
                const resolvedSources: VideoSource[] = [];

                const bypassPromises = linkData.map(async (item) => {
                    const bypass = await request<DirectLink>({
                        server: KWIK,
                        endpoint: `/?url=${encodeURIComponent(item.link)}`,
                        method: 'GET'
                    });

                    if (bypass && bypass.success) {
                        const proxyUrl = `${ANIME}/proxy?proxyUrl=${encodeURIComponent(bypass.url)}&modify`;
                        return {
                            quality: item.name,
                            url: proxyUrl
                        };
                    }
                    return null;
                });

                const results = await Promise.all(bypassPromises);
                
                results.forEach(res => {
                    if (res) resolvedSources.push(res);
                });

                if (resolvedSources.length > 0) {
                    resolvedSources.sort((a, b) => b.quality.localeCompare(a.quality));
                    setSources(resolvedSources);
                    setCurrentSrc(resolvedSources[0].url);
                } else {
                    toast.error("Failed to resolve video streams.");
                }

            } catch (e) {
                toast.error("Error loading player.");
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        initPlayer();
    }, [session, episode]);

    const handleQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newUrl = e.target.value;
        if (!newUrl || !videoRef.current) return;

        const currentTime = videoRef.current.currentTime;
        const isPaused = videoRef.current.paused;

        setCurrentSrc(newUrl);

        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.currentTime = currentTime;
                if (!isPaused) videoRef.current.play();
            }
        }, 100);
    };

    const togglePiP = async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (videoRef.current) {
                await videoRef.current.requestPictureInPicture();
            }
        } catch (error) {
            console.error(error);
            toast.error("PiP mode not supported or failed.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-5xl glass-panel p-4 rounded-2xl relative">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
                    <Button 
                        isIconOnly 
                        variant="light" 
                        className="text-white" 
                        onPress={() => navigate(-1)}
                    >
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold text-white text-shadow">
                            {meta.seriesTitle || 'Anime'}
                        </h2>
                        <p className="text-white/60 text-sm">Episode {meta.episodeNumber || 'Player'}</p>
                    </div>
                </div>

                {/* Player Container */}
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80 backdrop-blur-sm">
                            <Spinner size="lg" color="white" />
                            <p className="text-white mt-4 animate-pulse">{statusText}</p>
                        </div>
                    )}

                    {!loading && currentSrc && (
                        <video
                            ref={videoRef}
                            src={currentSrc}
                            controls
                            autoPlay
                            className="w-full h-full object-contain"
                            poster={meta.snapshot ? `${ANIME}/proxy?modify&proxyUrl=${meta.snapshot}` : undefined}
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}
                </div>

                {/* Controls Bar */}
                {!loading && sources.length > 0 && (
                    <div className="flex justify-end mt-4 gap-3">
                        {/* PiP Button */}
                        <button
                            onClick={togglePiP}
                            className="flex items-center justify-center bg-black/40 hover:bg-white/10 rounded-lg p-2 border border-white/10 text-white/70 hover:text-white transition-colors"
                            title="Picture in Picture"
                        >
                            <PictureInPicture size={20} />
                        </button>

                        {/* Quality Selector */}
                        <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 px-3 border border-white/10">
                            <Settings size={16} className="text-white/70" />
                            <select 
                                className="bg-transparent text-white text-sm outline-none cursor-pointer py-1"
                                onChange={handleQualityChange}
                                value={currentSrc}
                            >
                                {sources.map((src) => (
                                    <option key={src.url} value={src.url} className="text-black">
                                        {src.quality}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Player;
