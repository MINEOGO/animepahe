import { useState } from 'react';
import { SearchItem } from 'fetch/requests';
import SearchBar from '../components/SearchBar';
import SearchResultItem from '../components/SearchResultItem';

const Home = () => {
  const [searchResult, setSearchResult] = useState<SearchItem[]>([]);
  // We don't need isHomeActive anymore because routing handles it

  return (
    <div className="flex flex-col items-center gap-6">
        <div className="w-full max-w-xl glass-panel p-6 rounded-2xl">
             <h1 className="text-3xl font-bold text-white text-center mb-4 text-shadow">AnimePahe Downloader</h1>
             <SearchBar setSearchResult={setSearchResult} setHomeActive={() => {}} />
        </div>

        <div className='flex flex-wrap justify-center gap-6'>
        {
            searchResult?.map((item) => (
            <SearchResultItem
                key={item.id}
                data={item} // Pass the whole item to make it cleaner
            />
            ))
        }
        </div>
    </div>
  );
};

export default Home;
