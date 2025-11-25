import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Pagination, Spinner, Button, useDisclosure, Breadcrumbs, BreadcrumbItem } from '@nextui-org/react';
import { Layers, Home as HomeIcon } from 'lucide-react';
import { ANIME } from '../config/config';
import useAxios from '../hooks/useAxios';
import Episode from '../components/Episode';
import BatchModal from '../components/BatchModal';
import { EpisodeResult, FetchedEpisodes, FetchedEpisodesDlinks } from 'fetch/requests';

// Local cache to avoid refetching pages when switching back and forth in pagination
const fetched_eps: FetchedEpisodes = {};
const fetched_eps_dlinks: FetchedEpisodesDlinks = {};

const Details = () => {
    const { session } = useParams(); // Get ID from URL
    const { state } = useLocation(); // Get passed data (title, etc) from Home
    const navigate = useNavigate();
    
    // Use state from router if available, otherwise defaults (will fetch)
    const [episodes, setEpisodes] = useState<EpisodeResult['episodes']>([]);
    const [meta, setMeta] = useState({
        title: state?.title || 'Loading...',
        totalPages: 0,
        currentPage: 1
    });

    const { isLoading, request } = useAxios();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    // Initial Fetch (Page 1)
    useEffect(() => {
        if (session) {
            fetched_eps_dlinks[session] ??= {};
            // If we don't have episodes yet, fetch page 1
            if (!fetched_eps[session] || !fetched_eps[session][1]) {
                fetchPage(1);
            } else {
                // Load from cache
                setEpisodes(fetched_eps[session][1]);
                setMeta(prev => ({ ...prev, totalPages: fetched_eps[session].total_page }));
            }
        }
    }, [session]);

    const fetchPage = async (page: number) => {
        if (!session) return;

        // Check Cache
        if (fetched_eps[session] && fetched_eps[session][page]) {
            setEpisodes(fetched_eps[session][page]);
            setMeta(prev => ({ ...prev, currentPage: page }));
            return;
        }

        const response = await request<EpisodeResult>({
            server: ANIME,
            endpoint: `/?method=series&session=${session}&page=${page}`,
            method: 'GET'
        });

        if (response && response.episodes) {
            setEpisodes(response.episodes);
            setMeta({
                title: response.title, // Update title in case we came from direct link
                totalPages: response.total_pages,
                currentPage: page
            });

            // Update Cache
            fetched_eps[session] = {
                ...fetched_eps[session],
                total_page: response.total_pages,
                [page]: response.episodes
            };
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Navigation */}
            <div className='flex justify-center mb-6'>
                <Breadcrumbs 
                    variant='bordered' 
                    itemClasses={{
                        item: "text-white/80 data-[current=true]:text-white data-[current=true]:font-bold",
                        separator: "text-white/50"
                    }}
                >
                    <BreadcrumbItem onPress={() => navigate('/')} startContent={<HomeIcon size={16}/>}>Home</BreadcrumbItem>
                    <BreadcrumbItem>{meta.title}</BreadcrumbItem>
                </Breadcrumbs>
            </div>

            {/* Controls */}
            <div className='flex flex-col md:flex-row justify-center items-center gap-4 mb-6 glass-panel p-4 rounded-xl max-w-fit mx-auto'>
                <Pagination 
                    total={meta.totalPages} 
                    page={meta.currentPage} 
                    onChange={fetchPage} 
                    color="secondary" 
                    classNames={{
                        wrapper: "gap-2",
                        item: "bg-white/10 text-white border-white/20",
                        cursor: "bg-white text-black font-bold"
                    }}
                />
                
                <Button 
                    className="bg-white/20 text-white border border-white/30 hover:bg-white/30 font-semibold"
                    onPress={onOpen}
                    endContent={<Layers size={18}/>}
                >
                    Bulk Download
                </Button>
            </div>

            {/* Content */}
            <div className='flex flex-wrap justify-center gap-4'>
                {isLoading && episodes.length === 0 ? (
                    <div className='flex h-96 justify-center items-center w-full'>
                        <Spinner size='lg' color="white" labelColor="foreground"/>
                    </div>
                ) : (
                    episodes.map(({ episode, session: epSession, snapshot }) => (
                        <Episode 
                            key={epSession}
                            series={session!} 
                            seriesname={meta.title} 
                            episode={episode} 
                            session={epSession} 
                            snapshot={snapshot}
                            linkCache={fetched_eps_dlinks}
                        />
                    ))
                )}
            </div>

            {/* Modals */}
            <BatchModal 
                isOpen={isOpen} 
                onOpenChange={onOpenChange} 
                session={session!} 
                title={meta.title} 
                totalPages={meta.totalPages} 
            />
        </div>
    );
};

export default Details;
