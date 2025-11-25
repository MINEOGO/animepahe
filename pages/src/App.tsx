import { useState, useEffect } from 'react'
import { EpisodeResult, FetchedEpisodes, FetchedEpisodesDlinks, SearchItem } from 'fetch/requests'
import { BreadcrumbItem, Breadcrumbs, Chip, Link, Pagination, Spinner, Button, useDisclosure } from '@nextui-org/react'
import SearchBar from './components/SearchBar'
import SearchResultItem from './components/SearchResultItem'
import Episode from './components/Episode'
import useAxios from './hooks/useAxios'
import { ANIME } from './config/config'
import BatchModal from './components/BatchModal'
import { Layers } from 'lucide-react'

const fetched_eps: FetchedEpisodes = {}
const fetched_eps_dlinks: FetchedEpisodesDlinks = {}

const App = () => {
  const [SearchResult, setSearchResult] = useState<SearchItem[]>([])
  const [Episodes, setEpisodes] = useState<EpisodeResult['episodes']>([])
  const [SelectedSeriesID, setSelectedSeriesID] = useState<string>('')
  const [isHomeActive, setHomeActive] = useState(true)

  const [curPagination, setPagination] = useState(0)
  const [SelctedAnime, setSelectedAnime] = useState('')

  // Modal State for Bulk Download
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const { isLoading, request } = useAxios()

  // --- History / Back Button Logic ---
  useEffect(() => {
    // Set initial state
    window.history.replaceState({ view: 'home' }, '');

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view === 'details') {
        setHomeActive(false);
      } else {
        setHomeActive(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const onSeriesUpdate = (
    episodes: EpisodeResult['episodes'],
    breadcrumbs: string,
    session: string,
    pagination: number
  ) => {
    setEpisodes(episodes || []); // Safety check
    setSelectedAnime(breadcrumbs);
    setSelectedSeriesID(session);
    setPagination(pagination);
    
    // Push new state so back button works
    window.history.pushState({ view: 'details' }, '', `#${session}`);
    setHomeActive(false);
  }

  const goHome = () => {
    window.history.back();
  }
  // -----------------------------------

  const onPaginationChange = async (page: number) => {
    if (fetched_eps[SelectedSeriesID][page] === undefined) {
      const response = await request<EpisodeResult>({
        server: ANIME,
        endpoint: `/?method=series&session=${SelectedSeriesID}&page=${page}`,
        method: 'GET'
      })
      if (response && response.episodes) {
        setEpisodes(response.episodes)
        fetched_eps[SelectedSeriesID] = { ...fetched_eps[SelectedSeriesID], [page]: response.episodes }
      }
      return;
    }
    setEpisodes(fetched_eps[SelectedSeriesID][page])
  }

  return (
    <div>
      <div className='flex justify-center mt-2'>
        <Chip
          color='secondary'
          variant="flat"
          size='lg'
        >Join our Discord Server! <Link color='secondary' underline="always" isExternal showAnchorIcon href='https://discord.gg/pXj8afWG8A'>Click Here</Link></Chip>
      </div>
      <div className='mt-4 mb-4'>
      <SearchBar setSearchResult={setSearchResult} setHomeActive={setHomeActive} />
      <div className='flex justify-center mt-4'>
        <Breadcrumbs variant='bordered'>
          <BreadcrumbItem onPress={goHome}>Home</BreadcrumbItem>
          {!isHomeActive && <BreadcrumbItem>{SelctedAnime}</BreadcrumbItem>}
        </Breadcrumbs>
      </div>
      {
        isHomeActive ?
          <div className='flex flex-wrap justify-center'>
            {
              // Fix: Added optional chaining (?.) to prevent crash if SearchResult is undefined
              SearchResult?.map(({ title, poster, episodes, status, id, type, year, score, session }) => {
                return <SearchResultItem
                  key={id}
                  title={title}
                  poster={poster}
                  episodes={episodes}
                  status={status}
                  type={type}
                  year={year}
                  score={score}
                  session={session}
                  onSeriesUpdate={onSeriesUpdate}
                  fetched_eps={fetched_eps}
                />
              })
            }
          </div> :
          <div>
            {/* Pagination and Bulk Download Button Area */}
            <div className='flex justify-center items-center mt-4 gap-4'>
              <Pagination showControls onChange={onPaginationChange} total={curPagination} initialPage={1} />
              
              <Button 
                color="secondary" 
                variant="shadow"
                onPress={onOpen}
                endContent={<Layers size={18}/>}
              >
                Bulk Download
              </Button>
            </div>

            <div className='flex flex-wrap justify-center'>
              {
                isLoading ? 
                <div className='flex h-96 justify-center items-center'><Spinner size='lg'/></div> : 
                // Fix: Added optional chaining and fallback
                (Episodes || []).map(({ episode, session, snapshot }) => {
                  fetched_eps_dlinks[SelectedSeriesID] ??= {};
                  return <Episode linkCache={fetched_eps_dlinks} seriesname={SelctedAnime} key={session} series={SelectedSeriesID} episode={episode} session={session} snapshot={snapshot} />
                })
              }
            </div>

            {/* Batch Download Modal */}
            <BatchModal 
                isOpen={isOpen} 
                onOpenChange={onOpenChange} 
                session={SelectedSeriesID} 
                title={SelctedAnime} 
                totalPages={curPagination} 
            />
          </div>
      }
    </div>
    </div>
  )
}

export default App
