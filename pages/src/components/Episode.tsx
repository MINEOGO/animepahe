import { Card, CardFooter, Image, Button, Spinner, useDisclosure } from "@nextui-org/react";
import { Prox } from '../utils/ImgProxy';
import useAxios from '../hooks/useAxios';
import { ANIME } from '../config/config';
import DownloadModel from './DownloadModel';
import { DownloadLinks, FetchedEpisodesDlinks } from 'fetch/requests';
import { useState } from 'react';
import { PlayCircle } from "lucide-react";

interface EpisodeProps {
  session: string,
  episode: string,
  snapshot: string,
  series: string,
  seriesname: string,
  linkCache: FetchedEpisodesDlinks
}

const Episode = ({ episode, session, snapshot, series, seriesname, linkCache }: EpisodeProps) => {
  const { isLoading, request } = useAxios()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [dlinks, setDlinks] = useState<DownloadLinks>([])

  const RequestLinks = async () => {
    if (linkCache[series][session] === undefined) {
      const response = await request<DownloadLinks>({
        server: ANIME,
        endpoint: `/?method=episode&session=${ series }&ep=${ session }`,
        method: 'GET'
      })
      if (response) {
        setDlinks(response)
        linkCache[series] = {...linkCache[series], [session]: response}
        onOpen()
      }
      return
    }
    setDlinks(linkCache[series][session]);
    onOpen();
  }

  return (
    <Card
      isFooterBlurred
      radius="lg"
      className="m-2 border-none bg-transparent glass-panel w-[300px] group"
    >
      <div className="relative overflow-hidden">
        <Image
            alt="episode"
            className="object-cover w-[300px] h-[170px] transition-transform duration-500 group-hover:scale-110"
            src={Prox(snapshot)}
        />
        {/* Play Overlay */}
        <div className="absolute inset-0 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 z-10 pointer-events-none">
            <PlayCircle size={48} className="text-white drop-shadow-lg" />
        </div>
      </div>

      <CardFooter className="justify-between bg-black/40 border-t border-white/10 absolute bottom-0 z-10 w-full">
        <div className="flex flex-col items-start">
            <p className="text-tiny text-white/60 uppercase font-bold">{seriesname}</p>
            <p className="text-sm text-white font-bold">Episode {episode}</p>
        </div>
        <Button 
            onPress={RequestLinks} 
            className="text-xs font-bold text-white bg-white/20 hover:bg-white/30 border border-white/20" 
            radius="full" 
            size="sm"
        >
          { isLoading ? <Spinner color='white' size='sm'/> : 'Get Links' }
        </Button>
      </CardFooter>

      <DownloadModel 
        epName={`${seriesname} - EP ${episode}`} 
        isOpen={isOpen} 
        links={dlinks} 
        onOpenChange={onOpenChange}
        seriesTitle={seriesname}
        episodeNumber={episode}
      />
    </Card>
  );
}

export default Episode
