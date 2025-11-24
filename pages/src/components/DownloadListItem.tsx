import { Button, Link, Spinner } from "@nextui-org/react";
import { Download, Zap } from 'lucide-react';
import useAxios from '../hooks/useAxios';
import { KWIK } from '../config/config';
import { DirectLink } from 'fetch/requests';
import toast from 'react-hot-toast';

interface DownloadListItemProps {
  name: string,
  link: string
}

const DownloadListItem = ({ name, link }: DownloadListItemProps) => {
  const { isLoading, request } = useAxios()

  const onDirectDlRequest = async (kwik: string) => {
    // New API expects: /?url=https://kwik.cx/e/...
    const response = await request<DirectLink>({
      server: KWIK,
      endpoint: `/?url=${encodeURIComponent(kwik)}`,
      method: 'GET'
    })
    
    if (response && response.success) {
      window.open(response.url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error("Failed to bypass Kwik link");
    }
  }

  return (
    <div className='flex items-center rounded-lg w-full justify-between bg-gray-100 pl-2 shadow-sm'>
      <span className='text-base text-gray-800'>{name}</span>
      <div className='flex justify-center'>
        <Button href={link} target='_blank' as={Link} color="success" className='text-white text-base rounded-r-none'>
          KwiK <Download />
        </Button>
        <Button isIconOnly onPress={() => onDirectDlRequest(link)} color="warning" className='text-white text-base rounded-l-none'>
          {isLoading ? <Spinner color='default' size='sm' /> : <Zap />}
        </Button>
      </div>
    </div>
  )
}

export default DownloadListItem
