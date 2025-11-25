import { Routes, Route, Link as RouterLink } from 'react-router-dom';
import { Chip, Link } from '@nextui-org/react';
import Home from './pages/Home';
import Details from './pages/Details';

const App = () => {
  return (
    <div className="min-h-screen p-4">
      {/* Header / Notification */}
      <div className='flex justify-center mb-8'>
        <Chip
          className="glass-panel text-white font-bold"
          variant="flat"
          size='lg'
        >
          Join our Discord Server! 
          <Link 
            className="ml-2 text-yellow-300" 
            underline="hover" 
            isExternal 
            showAnchorIcon 
            href='https://discord.gg/pXj8afWG8A'
          >
            Click Here
          </Link>
        </Chip>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Dynamic Route for Anime Sessions */}
        <Route path="/anime/:session" element={<Details />} />
      </Routes>
    </div>
  )
}

export default App
