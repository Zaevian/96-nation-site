import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Music, Play, Filter, Star, Send } from 'lucide-react';
import { artists } from '../Data/artists';
import { tbaArtists } from '../Data/tbaArtists';
import { previousShows } from '../Data/previousShows';
import '../Assets/tba-artist-placeholder.css';

const ArtistSpotlight = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Combine regular artists and TBA artists
  const allArtists = [...artists, ...tbaArtists];
  
  // Create a list of all artists who have performed in previous shows
  const performedArtists = previousShows.reduce((acc, show) => {
    show.artists.forEach(artist => {
      acc.add(artist.toLowerCase());
    });
    return acc;
  }, new Set());
  
  // Function to check if an artist has performed in a previous show
  const hasPerformed = (artistName) => {
    return performedArtists.has(artistName.toLowerCase());
  };
  
  // Filter artists by genre and search term
  const filteredArtists = allArtists
    .filter(artist => {
      // For TBA filter, only show TBA artists
      if (filter === 'tba') {
        return artist.isTBA && (
          searchTerm === '' || 
          artist.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // For regular genre filters, exclude TBA artists
      const matchesGenre = filter === 'all' 
        ? !artist.isTBA 
        : !artist.isTBA && artist.genre.toLowerCase().includes(filter.toLowerCase());
        
      const matchesSearch = searchTerm === '' || 
        artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artist.bio.toLowerCase().includes(searchTerm.toLowerCase());
        
      return matchesGenre && matchesSearch;
    })
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by name

  // Get unique genres for filter
  const genres = ['rock', 'EDM', 'techno', 'hip-hop', 'indie', 'folk'];

  return (
    <div className="page-container pt-32">
      {/* Page Header */}
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-5xl md:text-6xl font-bold mb-4">
          ARTIST <span className="text-accent">SPOTLIGHT</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Discover the talented artists in our community. From emerging local acts to 
          established performers, these are the voices shaping our sound.
          <br />
          <span className="text-sm mt-2 inline-block">
            <Star size={14} className="inline text-yellow-400 fill-yellow-400 mr-1 animate-pulse" />
            Stars indicate artists who have performed at our previous shows.
          </span>
        </p>
      </motion.div>

      {/* Search and Filter */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-1/2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search artists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 
                  focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="w-full md:w-auto flex flex-wrap gap-2 justify-center md:justify-end">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-2 rounded-full text-sm font-medium transition duration-300 flex items-center ${
                filter === 'all' 
                  ? 'bg-accent text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All Artists
            </button>
            {genres.map(genre => (
              <button
                key={genre}
                onClick={() => setFilter(genre)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition duration-300 flex items-center ${
                  filter === genre 
                    ? 'bg-accent text-white' 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {genre.charAt(0).toUpperCase() + genre.slice(1)}
              </button>
            ))}
            <button
              onClick={() => setFilter('tba')}
              className={`px-3 py-2 rounded-full text-sm font-medium transition duration-300 flex items-center ${
                filter === 'tba' 
                  ? 'bg-accent text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              TBA Artists
            </button>
          </div>
        </div>
      </div>

      {/* Artists Grid */}
      {filteredArtists.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {filteredArtists.map((artist, index) => (
            <motion.div
              key={artist.name}
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <div className="aspect-square bg-gray-800 rounded-lg mb-6 overflow-hidden">
                {artist.isTBA ? (
                  <div className="tba-artist-placeholder">
                    <div className="tba-artist-text">Artist info coming soon!</div>
                  </div>
                ) : (
                  <img 
                    src={artist.image || `/api/placeholder/400/400`} 
                    alt={artist.name} 
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  />
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-bold">
                    {artist.name}
                    {!artist.isTBA && hasPerformed(artist.name) && (
                      <span className="inline-block ml-2 animate-pulse">
                        <Star size={16} className="inline text-yellow-400 fill-yellow-400" />
                      </span>
                    )}
                  </h3>
                  <span className="bg-gray-800 text-xs font-bold uppercase py-1 px-2 rounded">
                    {artist.genre}
                  </span>
                </div>
                
                <p className="text-gray-400">{artist.bio}</p>
                
                <div className="pt-4 flex flex-wrap gap-3">
                  {artist.links.spotify && (
                    <a 
                      href={artist.links.spotify} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-green-700/20 hover:bg-green-700/40 text-green-500 transition 
                        px-3 py-1 rounded-full text-xs font-bold flex items-center"
                    >
                      <Music size={14} className="mr-1" />
                      Spotify
                    </a>
                  )}
                  
                  {artist.links.instagram && (
                    <a 
                      href={artist.links.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-purple-700/20 hover:bg-purple-700/40 text-purple-500 transition 
                        px-3 py-1 rounded-full text-xs font-bold flex items-center"
                    >
                      <ExternalLink size={14} className="mr-1" />
                      Instagram
                    </a>
                  )}
                  
                  {artist.links.youtube && (
                    <a 
                      href={artist.links.youtube} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-red-700/20 hover:bg-red-700/40 text-red-500 transition 
                        px-3 py-1 rounded-full text-xs font-bold flex items-center"
                    >
                      <Play size={14} className="mr-1" />
                      YouTube
                    </a>
                  )}
                </div>
                
                {/* Temporarily removed "View Full Profile" button
                <a 
                  href="#" 
                  className="block mt-4 text-center btn btn-outline w-full"
                  onClick={(e) => e.preventDefault()}
                >
                  View Full Profile
                </a>
                */}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-2xl font-bold mb-2">No artists found</h3>
          <p className="text-gray-400">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}
      
      {/* Artist Submission Form Section */}
      <motion.div 
        className="mt-24 mb-12 text-center max-w-3xl mx-auto py-10 px-6 border border-gray-800 rounded-xl bg-gray-900/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <h2 className="text-3xl font-bold mb-4">Are you an artist? <span className="text-accent">Let us know!</span></h2>
        <p className="text-gray-300 mb-8">
          We're always looking to spotlight new talent in the Tallahassee music scene. 
          If you're an artist who would like to be featured on our site, 
          please fill out our artist submission form.
        </p>
        <a 
          href="https://forms.gle/HEZcecGsW9zhunhx9" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-primary inline-flex items-center"
        >
          <Send size={18} className="mr-2" />
          Submit Artist Form
        </a>
      </motion.div>
    </div>
  );
};

export default ArtistSpotlight;