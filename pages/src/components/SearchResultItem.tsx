import { Card, CardHeader, CardBody, Image, Chip } from '@nextui-org/react';
import { useNavigate } from 'react-router-dom';
import { Prox } from '../utils/ImgProxy';
import { SearchItem } from 'fetch/requests';

interface SearchResultItemProps {
  data: SearchItem;
}

const SearchResultItem = ({ data }: SearchResultItemProps) => {
  const navigate = useNavigate();
  const { title, episodes, poster, status, type, year, score, session } = data;

  const handlePress = () => {
    // Pass data cleanly to avoid TypeScript property duplication errors
    navigate(`/anime/${session}`, { state: data });
  };

  return (
    <Card 
        isPressable 
        onPress={handlePress} 
        className="m-2 w-72 h-[500px] glass-panel hover:scale-105 transition-transform duration-200 bg-transparent border-none"
    >
      <CardBody className="p-0 overflow-hidden relative group">
        {/* Background Image with blur for filling space */}
        <div 
            className="absolute inset-0 bg-cover bg-center blur-xl opacity-50" 
            style={{ backgroundImage: `url(${Prox(poster)})` }}
        ></div>
        
        <Image
          removeWrapper
          alt={title}
          className="z-10 w-full h-full object-cover"
          src={Prox(poster)}
        />
        
        {/* Overlay Info on Hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col justify-center items-center gap-2 p-4 text-white">
             <Chip size="sm" color="primary">{type}</Chip>
             <Chip size="sm" color="secondary">{year}</Chip>
             {score && <Chip size="sm" color="success">Score: {score}</Chip>}
        </div>
      </CardBody>
      
      <CardHeader className="pb-4 pt-4 px-4 flex-col text-left items-start h-auto bg-black/40 backdrop-blur-md border-t border-white/10">
        <div className='flex justify-between w-full items-center mb-2'>
          <span className="text-white/70 text-xs font-bold">{episodes} EPS</span>
          <span className={`text-xs font-bold uppercase px-2 py-1 rounded-md ${status === 'Finished' ? 'bg-green-500/30 text-green-300' : 'bg-blue-500/30 text-blue-300'}`}>
            {status}
          </span>
        </div>
        <h4 className="font-bold text-lg text-white line-clamp-2 leading-tight text-shadow">{title}</h4>
      </CardHeader>
    </Card>
  );
}

export default SearchResultItem;
