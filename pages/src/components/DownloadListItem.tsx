import { Button, Chip } from "@nextui-org/react";
import { Download } from 'lucide-react';
import useAxios from '../hooks/useAxios';
import { KWIK, ANIME } from '../config/config';
import { DirectLink } from 'fetch/requests';
import toast from 'react-hot-toast';

interface DownloadListItemProps {
  name: string,
  link: string,
  seriesTitle: string,
  episodeNumber: string
}

const DownloadListItem = ({ name, link, seriesTitle, episodeNumber }: DownloadListItemProps) => {
  const { isLoading, request } = useAxios()

  // Parse Language Tag from Name (added by Worker)
  // Example Name: "Crunchyroll 1080p (eng)"
  let displayName = name;
  let langTag = null;

  const langMatch = name.match(/\((eng|jpn|dub|sub)\)/i);
  if (langMatch) {
    langTag = langMatch[1].toUpperCase();
    displayName = name.replace(langMatch[0], '').trim();
  }

  const onDownload = async (kwikUrl: string) => {
    const response = await request<DirectLink>({
      server: KWIK,
      endpoint: `/?url=${encodeURIComponent(kwikUrl)}`,
      method: 'GET'
    })
    
    if (response && response.success) {
      const safeTitle = seriesTitle.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
      const fileName = `${safeTitle}_${episodeNumber}_animepahe-26e.pages.dev_.mp4`;
      const proxyDownloadUrl = `${ANIME}/proxy?proxyUrl=${encodeURIComponent(response.url)}&modify&download&filename=${encodeURIComponent(fileName)}`;
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = proxyDownloadUrl;
      document.body.appendChild(iframe);
      
      setTimeout(() => document.body.removeChild(iframe), 60000);
      
      toast.success(`Downloading: ${fileName}`);
    } else {
      toast.error("Failed to bypass Kwik link");
    }
  }

  return (
    <div className='glass-panel p-3 rounded-xl mb-3 flex items-center justify-between group transition-all duration-200 hover:bg-white/10 border border-white/10'>
      
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <span className='text-sm sm:text-base text-white font-medium text-shadow'>
            {displayName}
        </span>
        {langTag && (
            <Chip 
                size="sm" 
                variant="flat" 
                className={`text-xs font-bold border ${langTag === 'ENG' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : 'bg-blue-500/20 border-blue-500/50 text-blue-300'}`}
            >
                {langTag}
            </Chip>
        )}
      </div>

      <div>
        <Button 
            onPress={() => onDownload(link)} 
            className='bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 shadow-lg backdrop-blur-md min-w-[120px]'
            radius="full"
            size="sm"
            isLoading={isLoading}
            endContent={!isLoading && <Download size={16} />}
        >
          Download
        </Button>
      </div>
    </div>
  )
}

export default DownloadListItem
