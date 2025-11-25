import { Routes, Route } from 'react-router-dom';
import { Chip, Link } from '@nextui-org/react';
import Home from './pages/Home';
import Details from './pages/Details';
import RainBackground from './components/RainBackground';

const App = () => {
  return (
    <div className="min-h-screen p-4 relative">
      <RainBackground />
      
      {/* Header / Notification */}
      <div className='flex justify-center mb-8 relative z-10'>
        <Chip
          className="glass-panel text-white font-bold border-white/20"
          variant="bordered"
          size='lg'
        >
          Join our Discord Server! 
          <Link 
            className="ml-2 text-cyan-300 font-bold" 
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
        <Route path="/anime/:session" element={<Details />} />
      </Routes>
    </div>
  )
}

export default App
