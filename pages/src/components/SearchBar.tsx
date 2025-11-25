import { Input } from '@nextui-org/react'
import { Command, LoaderCircle } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import useAxios from '../hooks/useAxios'
import { ANIME } from '../config/config'
import { SearchItem, SearchResult } from 'fetch/requests'

interface SearchBarProps {
  setSearchResult: Dispatch<SetStateAction<SearchItem[]>>,
  setHomeActive: Dispatch<SetStateAction<boolean>>
}

const SearchBar = ({ setSearchResult, setHomeActive }: SearchBarProps) => {
  const { isLoading, request } = useAxios()
  const [QueryString, setQueryString] = useState('')

  const FetchSearchResult = async (key: string) => {
    if (key !== 'Enter' || QueryString.length === 0) { return; }

    const response = await request<SearchResult>({
      server: ANIME,
      endpoint: `/?method=search&query=${QueryString}`,
      method: 'GET'
    })
    
    if (response && response.data) {
      setSearchResult(response.data)
      setHomeActive(true)
    } else {
      setSearchResult([]); 
    }
  }

  return (
    <div className='flex w-full justify-center'>
      <Input
        onKeyDown={({ key }) => FetchSearchResult(key)}
        size='lg'
        fullWidth
        onChange={({ target: { value } }) => setQueryString(value)}
        value={QueryString}
        classNames={{
          input: [
            "text-center font-medium text-white placeholder:text-white/50",
          ],
          inputWrapper: [
            "bg-white/10",
            "backdrop-blur-md",
            "hover:bg-white/20",
            "group-data-[focus=true]:bg-white/20",
            "!cursor-text",
            "border-white/20 border",
            "shadow-inner"
          ],
        }}
        spellCheck={false}
        type="text"
        placeholder="Search Anime..."
        endContent={
          isLoading ? <LoaderCircle className='animate-spin text-white' /> : <Command className='text-white/70' />
        }
      />
    </div>
  )
}

export default SearchBar
