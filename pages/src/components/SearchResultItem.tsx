import { Card, CardHeader, CardBody, Image, Divider, Chip, Spinner, Button, useDisclosure } from '@nextui-org/react'
import { Prox } from '../utils/ImgProxy'
import useAxios from '../hooks/useAxios'
import { ANIME } from '../config/config'
import { EpisodeResult, FetchedEpisodes } from 'fetch/requests'
import { Layers } from 'lucide-react' // Import Icon
import BatchModal from './BatchModal' // Import the new modal

interface SearchResultItemProps {
  title: string,
  episodes: number,
  poster: string,
  status: string,
  type: string,
  year: number,
  session: string,
  score: number | null,
  fetched_eps: FetchedEpisodes,
  onSeriesUpdate: (
    episodes: EpisodeResult['episodes'],
    breadcrumbs: string,
    session: string,
    pagination: number
  ) => void
}

const SearchResultItem = ({ 
  session, title, episodes, poster, status, type, year, score, fetched_eps, onSeriesUpdate
}: SearchResultItemProps) => {
  const { isLoading, request } = useAxios()
  
  // Modal State
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [totalPages, setTotalPages] = useState(0); // Store total pages for batch

  const FetchEpisodes = async (page: number) => {
    // ... existing fetch logic ...
    if (fetched_eps[session] === undefined) {
      const response = await request<EpisodeResult>({
        server: ANIME,
        endpoint: `/?method=series&session=${session}&page=${page}`,
        method: 'GET'
      })
      if (response) {
        // Update local state for the modal
        setTotalPages(response.total_pages); 
        
        onSeriesUpdate(response.episodes, title, session, response.total_pages)
        fetched_eps[session] = {
          total_page: response.total_pages,
          [page] : response.episodes
        }
      }
      return
    }
    // If cached, we still need to know total pages for the modal
    setTotalPages(fetched_eps[session]['total_page']);
    onSeriesUpdate(fetched_eps[session][page], title, session, fetched_eps[session]['total_page'])
  }

  // Separate handler for opening the batch modal to ensure we have page count
  const handleBatchClick = async (e: any) => {
    e.stopPropagation(); // Prevent clicking the card itself
    
    // We need to fetch page 1 just to get the 'total_pages' count if we don't have it yet
    if (totalPages === 0) {
        const response = await request<EpisodeResult>({
            server: ANIME,
            endpoint: `/?method=series&session=${session}&page=1`,
            method: 'GET'
        });
        if (response) {
            setTotalPages(response.total_pages);
            onOpen();
        }
    } else {
        onOpen();
    }
  }

  return (
    <>
        <Card isPressable disableRipple onPress={() => FetchEpisodes(1)} className="m-4 w-72 cursor-pointer hover:border-primary border-1 group">
        <CardHeader className="pb-0 pt-2 px-4 flex-col text-left items-start h-32 overflow-hidden">
            <div className='flex flex-col gap-y-2 my-2 w-full'>
            <div className="flex justify-between items-center">
                <span className="text-default-500">{episodes} Episodes</span>
                {/* Bulk Button */}
                <Button 
                    isIconOnly 
                    size="sm" 
                    color="secondary" 
                    variant="flat" 
                    onPress={handleBatchClick}
                    isDisabled={isLoading}
                >
                    <Layers size={16} />
                </Button>
            </div>
            <p className="text-tiny uppercase font-bold">{status}</p>
            </div>
            <Divider />
            <h4 className="font-bold text-large line-clamp-2">{title}</h4>
        </CardHeader>
        <CardBody className="relative overflow-hidden items-center py-4 gap-y-2 flex flex-col justify-center">
            <Image
            isBlurred
            alt="background"
            className="object-cover rounded-xl h-[350px]"
            src={Prox(poster)}
            width={240}
            />
            <div className='flex gap-x-2 mt-4'>
            <Chip variant='shadow' radius='sm' color='primary'>{type}</Chip>
            <Chip variant='shadow' radius='sm' color='secondary'>{year}</Chip>
            {score && <Chip className='text-white' variant='shadow' radius='sm' color='success'>Score {score}</Chip>}
            </div>
            {
            isLoading && <Spinner className='absolute z-10 top-36' size='lg' />
            }
        </CardBody>
        </Card>
        
        {/* Render Modal */}
        <BatchModal 
            isOpen={isOpen} 
            onOpenChange={onOpenChange} 
            session={session} 
            title={title} 
            totalPages={totalPages} 
        />
    </>
  )
}

export default SearchResultItem
