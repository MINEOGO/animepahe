import { Card, CardBody, Image, Chip } from '@nextui-org/react';
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
    navigate(`/anime/${session}`, { state: data });
  };

  return (
    <Card 
        isPressable 
        onPress={handlePress} 
        // w-full fills the grid cell. Aspect ratio keeps image proportional.
        // Mobile height ~260px, Desktop ~400px
        className="w-full h-[260px] sm:h-[350px] md:h-[400px] glass-panel hover:scale-[1.02] transition-transform duration-200 bg-transparent border-none group shadow-lg"
    >
      <CardBody className="p-0 overflow-hidden relative h-full w-full">
        {/* Blurred Background for filling */}
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
        
        {/* Episode Number Badge */}
        <div className="absolute top-2 left-2 z-20">
            <Chip 
                size="sm" 
                className="bg-secondary/90 text-white font-bold backdrop-blur-md shadow-lg"
                variant="solid"
            >
                EP {episodes}
            </Chip>
        </div>
        
        {/* Overlay Info on Hover (Hidden on Mobile usually, shown on touch/hover) */}
        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col justify-center items-center gap-2 p-2 text-white">
             <Chip size="sm" color="primary" variant="flat">{type}</Chip>
             <Chip size="sm" color="warning" variant="flat">{year}</Chip>
             {score && <Chip size="sm" color="success" variant="flat">★ {score}</Chip>}
        </div>

        {/* Bottom Gradient & Title */}
        <div className="absolute bottom-0 z-20 w-full bg-gradient-to-t from-black via-black/80 to-transparent pt-10 pb-3 px-3">
            <div className='flex justify-between w-full items-center mb-1 opacity-90'>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${status === 'Finished' ? 'bg-green-500/40 text-green-200' : 'bg-blue-500/40 text-blue-200'}`}>
                    {status}
                </span>
            </div>
            <h4 className="font-bold text-sm sm:text-medium text-white line-clamp-2 leading-tight text-shadow">{title}</h4>
        </div>
      </CardBody>
    </Card>
  );
}

export default SearchResultItem;
