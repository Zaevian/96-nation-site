import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Image as ImageIcon } from 'lucide-react';
import { media } from '../Data/media';

const ShowContent = () => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [filter, setFilter] = useState('all');

  // Filter media by type
  const filteredMedia = filter === 'all' 
    ? media 
    : media.filter(item => item.type === filter);

  // Open lightbox with selected media item
  const openLightbox = (item) => {
    setSelectedItem(item);
    document.body.style.overflow = 'hidden';
  };

  // Close lightbox
  const closeLightbox = () => {
    setSelectedItem(null);
    document.body.style.overflow = 'auto';
  };

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
          SHOW <span className="text-accent">HIGHLIGHTS</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Relive the energy and excitement of our past events through our gallery of photos and videos.
        </p>
      </motion.div>

      {/* Filter Controls */}
      <div className="flex justify-center mb-12">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full font-medium transition duration-300 ${
              filter === 'all' 
                ? 'bg-accent text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All Media
          </button>
          <button
            onClick={() => setFilter('photo')}
            className={`px-4 py-2 rounded-full font-medium transition duration-300 flex items-center ${
              filter === 'photo' 
                ? 'bg-accent text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <ImageIcon size={16} className="mr-2" />
            Photos
          </button>
          <button
            onClick={() => setFilter('video')}
            className={`px-4 py-2 rounded-full font-medium transition duration-300 flex items-center ${
              filter === 'video' 
                ? 'bg-accent text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Play size={16} className="mr-2" />
            Videos
          </button>
        </div>
      </div>

      {/* Media Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {filteredMedia.map((item, index) => (
          <motion.div
            key={index}
            className="card p-0 overflow-hidden cursor-pointer group"
            onClick={() => openLightbox(item)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <div className="relative aspect-video bg-gray-800 overflow-hidden">
              {item.type === 'photo' ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-xl font-bold p-4 text-center">
                  {item.title}
                </div>
              ) : (
                <img 
                  src={item.thumbnail} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              )}
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-accent/80 rounded-full flex items-center justify-center">
                    <Play size={30} className="text-white ml-1" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-accent text-sm font-bold">{item.event}</span>
                <span className={`text-xs font-bold uppercase py-1 px-2 rounded ${
                  item.type === 'photo' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {item.type}
                </span>
              </div>
              <h3 className="text-xl font-bold">{item.title}</h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <button 
              className="absolute top-6 right-6 text-white hover:text-accent z-10"
              onClick={closeLightbox}
            >
              <X size={32} />
            </button>
            
            <motion.div
              className="max-w-5xl w-full max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {selectedItem.type === 'photo' ? (
                <div className="w-full h-[70vh] flex items-center justify-center bg-gray-800 text-accent text-3xl font-bold p-8 text-center rounded">
                  Photos Coming Soon!
                </div>
              ) : (
                <div className="aspect-video bg-black rounded overflow-hidden">
                  <video 
                    src={selectedItem.videoUrl} 
                    controls
                    poster={selectedItem.thumbnail}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              
              <div className="bg-gray-900/80 backdrop-blur-sm p-4 rounded-b text-white mt-2">
                <h3 className="text-2xl font-bold mb-1">{selectedItem.title}</h3>
                <p className="text-gray-300">{selectedItem.event}</p>
                <p className="text-gray-400 mt-2">{selectedItem.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShowContent;