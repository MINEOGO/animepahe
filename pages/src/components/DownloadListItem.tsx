import { Button } from "@nextui-org/react";
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

  const onDownload = async (kwikUrl: string) => {
    // 1. Bypass Kwik
    const response = await request<DirectLink>({
      server: KWIK,
      endpoint: `/?url=${encodeURIComponent(kwikUrl)}`,
      method: 'GET'
    })
    
    if (response && response.success) {
      // 2. Construct Custom Filename
      // Format: Title_Ep_animepahe-26e.pages.dev_.mp4
      const safeTitle = seriesTitle.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
      const fileName = `${safeTitle}_${episodeNumber}_animepahe-26e.pages.dev_.mp4`;

      // 3. Proxy Download
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
    <div className='flex items-center rounded-lg w-full justify-between bg-gray-100 pl-2 shadow-sm'>
      <span className='text-base text-gray-800'>{name}</span>
      <div className='flex justify-center'>
        <Button 
            onPress={() => onDownload(link)} 
            color="success" 
            className='text-white text-base rounded-none w-full'
            isLoading={isLoading}
        >
          Download <Download size={18} />
        </Button>
      </div>
    </div>
  )
}

export default DownloadListItem
