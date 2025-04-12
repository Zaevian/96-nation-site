import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, DollarSign, Music, Info } from 'lucide-react';
import { events } from '../Data/events';
import { previousShows } from '../Data/previousShows';

const UpcomingEvents = () => {
  const [filter, setFilter] = useState('all');
  
  // Filter events by type, including previous shows when showcase is selected
  const filteredEvents = filter === 'all' 
    ? events 
    : filter === 'showcase'
      ? previousShows
      : events.filter(event => event.type === filter);

  // Check if we're showing previous shows
  const isShowingPreviousShows = filter === 'showcase';

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
          {isShowingPreviousShows ? 'PREVIOUS ' : 'UPCOMING '}<span className="text-accent">EVENTS</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          {isShowingPreviousShows 
            ? 'Check out our archive of past shows and events.'
            : 'Check out our calendar of upcoming shows, community events, and artist showcases. Get your tickets early to secure your spot.'}
        </p>
      </motion.div>

      {/* Filter Controls */}
      <div className="flex justify-center mb-12 overflow-x-auto py-2">
        <div className="flex space-x-2 md:space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full font-medium transition duration-300 ${
              filter === 'all' 
                ? 'bg-accent text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('show')}
            className={`px-4 py-2 rounded-full font-medium transition duration-300 ${
              filter === 'show' 
                ? 'bg-accent text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Shows
          </button>
          <button
            onClick={() => setFilter('community')}
            className={`px-4 py-2 rounded-full font-medium transition duration-300 ${
              filter === 'community' 
                ? 'bg-accent text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Community Events and Shows
          </button>
          <button
            onClick={() => setFilter('showcase')}
            className={`px-4 py-2 rounded-full font-medium transition duration-300 ${
              filter === 'showcase' 
                ? 'bg-accent text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Previous Shows
          </button>
        </div>
      </div>

      {/* Events List */}
      <motion.div
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event, index) => (
            <motion.div
              key={index}
              className="card flex flex-col lg:flex-row gap-6 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Event Image */}
              <div className="lg:w-1/3">
                <div className="aspect-video lg:aspect-square bg-gray-800 rounded overflow-hidden">
                  <img 
                    src={event.image || `/api/placeholder/600/600`} 
                    alt={event.title} 
                    className="w-full h-full object-cover hover:scale-105 transition duration-500"
                  />
                </div>
              </div>
              
              {/* Event Details */}
              <div className="lg:w-2/3 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-accent/90 text-xs font-bold uppercase py-1 px-3 rounded-full">
                      {event.type}
                    </span>
                    <span className="bg-gray-700/80 text-xs font-bold uppercase py-1 px-3 rounded-full">
                      {event.price === 'Free' ? 'Free Entry' : `$${event.price}`}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">{event.title}</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center text-gray-300">
                      <Calendar size={18} className="mr-2 text-accent" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Clock size={18} className="mr-2 text-accent" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <MapPin size={18} className="mr-2 text-accent" />
                      <span>{event.venue}, {event.location}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <Music size={18} className="mr-2 text-accent" />
                      <span>
                        {event.artists.map((artist, idx) => (
                          <React.Fragment key={artist}>
                            {artist}
                            {idx < event.artists.length - 1 ? ', ' : ''}
                          </React.Fragment>
                        ))}
                      </span>
                    </div>
                  </div>
                  
                  {event.details && event.details.notes && event.details.notes.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-400 mb-2">NOTES:</h3>
                      <ul className="list-disc list-inside text-gray-400 space-y-1">
                        {event.details.notes.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {(!isShowingPreviousShows && (filter === 'show' || event.title === "LAST BAND STANDING III")) && (
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href={event.title === "LAST BAND STANDING III" 
                        ? "https://checkout.square.site/merchant/MLCKH40SQB6SJ/checkout/E5RNHGBVZETDNJVA35HIRCGG"
                        : event.tickets || "#"}
                      className="btn btn-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get Tickets
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <Info size={48} className="mx-auto text-accent mb-4" />
            <h3 className="text-2xl font-bold mb-2">No events found</h3>
            <p className="text-gray-400">
              There are currently no {filter} events scheduled. 
              Check back soon or try a different filter.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UpcomingEvents;