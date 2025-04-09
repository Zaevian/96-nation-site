import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import UpcomingEvents from './pages/UpcomingEvents';
import ShowContent from './pages/ShowContent';
import SennaScene from './pages/SennaScene';
import GenesisServices from './pages/GenesisServices';
import ArtistSpotlight from './pages/ArtistSpotlight';

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  
  return (
    <div className="flex flex-col min-h-screen bg-primary text-white font-primary">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upcoming-events" element={<UpcomingEvents />} />
          <Route path="/show-content" element={<ShowContent />} />
          <Route path="/senna-scene" element={<SennaScene />} />
          <Route path="/genesis-services" element={<GenesisServices />} />
          <Route path="/artist-spotlight" element={<ArtistSpotlight />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;