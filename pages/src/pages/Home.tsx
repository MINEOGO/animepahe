import { useState, useEffect } from 'react';
import { SearchItem, AiringResult } from 'fetch/requests';
import SearchBar from '../components/SearchBar';
import SearchResultItem from '../components/SearchResultItem';
import useAxios from '../hooks/useAxios';
import { ANIME } from '../config/config';
import { Spinner, Pagination } from '@nextui-org/react';

const Home = () => {
  const [searchResult, setSearchResult] = useState<SearchItem[]>([]);
  const [airingList, setAiringList] = useState<SearchItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const { request, isLoading } = useAxios();

  // Fetch Top Airing
  const fetchAiring = async (targetPage: number) => {
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const response = await request<AiringResult>({
      server: ANIME,
      endpoint: `/?method=airing&page=${targetPage}`,
      method: 'GET'
    });

    if (response && response.data) {
      setTotalPages(response.last_page);
      
      const mappedData: SearchItem[] = response.data.map((item) => ({
          id: item.id,
          title: item.anime_title,
          session: item.anime_session,
          poster: item.snapshot,
          episodes: item.episode,
          type: 'TV',
          status: 'Airing',
          year: new Date(item.created_at).getFullYear(),
          score: null,
          season: ''
      }));
      setAiringList(mappedData);
    }
  };

  // Initial Fetch & Page Change
  useEffect(() => {
    // Only fetch airing if we aren't searching
    if (searchResult.length === 0) {
        fetchAiring(page);
    }
  }, [page, searchResult]);

  const isSearchActive = searchResult.length > 0;
  const dataToShow = isSearchActive ? searchResult : airingList;

  return (
    <div className="flex flex-col items-center gap-6 pb-10">
        {/* Search Section */}
        <div className="w-full max-w-xl glass-panel p-6 rounded-2xl mt-4">
             <h1 className="text-3xl font-bold text-white text-center mb-4 text-shadow">AnimePahe Downloader</h1>
             <SearchBar setSearchResult={setSearchResult} setHomeActive={() => {}} />
        </div>

        {/* Title */}
        <div className="w-full px-4 max-w-7xl">
            <h2 className="text-xl text-white font-bold mb-2 ml-2 text-shadow border-l-4 border-secondary pl-3">
                {isSearchActive ? 'Search Results' : 'Latest Releases'}
            </h2>
        </div>

        {/* Grid Layout: 2 columns mobile, 3 sm, 4 md, 5 lg */}
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 w-full max-w-7xl px-2'>
        {
            isLoading && dataToShow.length === 0 ? (
                 <div className="col-span-full flex justify-center py-20">
                    <Spinner size='lg' color="white" />
                 </div>
            ) : (
                dataToShow.map((item) => (
                    <SearchResultItem
                        key={item.id}
                        data={item}
                    />
                ))
            )
        }
        </div>

        {/* Pagination (Only show if not searching) */}
        {!isSearchActive && !isLoading && (
            <div className="mt-8 glass-panel p-3 rounded-xl">
                <Pagination 
                    showControls 
                    total={totalPages} 
                    page={page} 
                    onChange={setPage}
                    color="secondary"
                    classNames={{
                        cursor: "bg-white text-black font-bold shadow-lg",
                        item: "text-white bg-transparent hover:bg-white/20 data-[hover=true]:bg-white/20"
                    }}
                />
            </div>
        )}
    </div>
  );
};

export default Home;
