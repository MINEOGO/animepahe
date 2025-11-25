import { Button } from "@nextui-org/react";
import { Download } from 'lucide-react';
import useAxios from '../hooks/useAxios';
import { KWIK, ANIME } from '../config/config';
import { DirectLink } from 'fetch/requests';
import toast from 'react-hot-toast';

interface DownloadListItemProps {
  name: string,
  link: string
}

const DownloadListItem = ({ name, link }: DownloadListItemProps) => {
  const { isLoading, request } = useAxios()

  const onDownload = async (kwikUrl: string) => {
    // 1. Bypass Kwik to get the Direct MP4 URL
    const response = await request<DirectLink>({
      server: KWIK,
      endpoint: `/?url=${encodeURIComponent(kwikUrl)}`,
      method: 'GET'
    })
    
    if (response && response.success) {
      // 2. Route through OUR proxy with &download flag
      const proxyDownloadUrl = `${ANIME}/proxy?proxyUrl=${encodeURIComponent(response.url)}&modify&download&filename=${encodeURIComponent(name)}.mp4`;
      
      // Trigger download using a temporary hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = proxyDownloadUrl;
      document.body.appendChild(iframe);
      
      // Cleanup iframe after a delay
      setTimeout(() => document.body.removeChild(iframe), 60000);
      
      toast.success("Download started!");
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
