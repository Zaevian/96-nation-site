import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import { events } from '../Data/events';
import { artists } from '../Data/artists';
import { Trophy } from 'lucide-react';

const Home = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* About Section */}
      <section className="py-20 bg-primary" id="about">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              WE ARE <span className="text-accent">96 NATION</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Based in Tallahassee, Florida, we're dedicated to showcasing the best underground artists 
              and creating unforgettable live experiences. From intimate venues to major festivals, 
              we bring people together through the power of music and art.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link to="/genesis-services" className="btn btn-primary">Our Services</Link>
              <Link to="/upcoming-events" className="btn btn-outline">Upcoming Events</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-20 bg-black" id="upcoming-events">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-2">
              UPCOMING <span className="text-accent">EVENTS</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Don't miss our next shows and experiences. Get your tickets now.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {events.slice(0, 3).map((event, index) => (
              <motion.div 
                key={index} 
                className="card group"
                variants={itemVariants}
              >
                <div className="aspect-video bg-gray-800 rounded mb-4 overflow-hidden">
                  <img 
                    src={event.image || `/api/placeholder/600/340`} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-accent font-bold">{event.date}</span>
                    <span className="bg-accent/90 text-xs font-bold uppercase py-1 px-2 rounded">
                      {event.price === 'Free' ? 'Free Entry' : `$${event.price}`}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">{event.title}</h3>
                  <p className="text-gray-400">{event.venue} • {event.location}</p>
                  <p className="text-sm text-gray-300 line-clamp-2">{event.description}</p>
                  <Link 
                    to="/upcoming-events" 
                    className="btn btn-outline text-sm mt-2 py-2"
                  >
                    Details & Tickets
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-12">
            <Link to="/upcoming-events" className="btn btn-primary">
              View All Events
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Artists Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-2">
              FEATURED <span className="text-accent">ARTISTS</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Discover the talent competing in Last Band Standing III and previous winners.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Filter artists from Last Band Standing III event */}
            {artists
              .filter(artist => 
                ["Mutual Friends", "Durty Suns", "JaggN", "Palace Rats"].includes(artist.name)
              )
              .map((artist, index) => (
                <motion.div 
                  key={index} 
                  className="card text-center group"
                  variants={itemVariants}
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-accent">
                    <img 
                      src={artist.image || `/api/placeholder/200/200`} 
                      alt={artist.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold">
                    {artist.name}
                    {["Mutual Friends", "Durty Suns"].includes(artist.name) && (
                      <Trophy size={16} className="inline-block ml-2 text-accent winner-trophy" />
                    )}
                  </h3>
                  <p className="text-accent text-sm mb-2">{artist.genre}</p>
                  <p className="text-sm text-gray-400 line-clamp-3 mb-4">{artist.bio}</p>
                  <Link 
                    to="/artist-spotlight" 
                    className="text-accent hover:underline text-sm font-bold"
                  >
                    View Profile
                  </Link>
                </motion.div>
              ))}
          </motion.div>

          <div className="text-center mt-12">
            <Link to="/artist-spotlight" className="btn btn-primary">
              Explore All Artists
            </Link>
          </div>
        </div>
      </section>

      {/* Services Teaser */}
      <section className="py-20 bg-gradient-to-b from-black to-primary relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              GENESIS <span className="text-accent">SERVICES</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Need help with your event or artistic journey? Our professional services 
              can elevate your brand, create unforgettable experiences, and connect you 
              with the right audience.
            </p>
            <Link to="/genesis-services" className="btn btn-primary">
              Explore Our Services
            </Link>
          </motion.div>
        </div>
      </section>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes trophyFlicker {
          0% { opacity: 1; }
          25% { opacity: 0.7; }
          50% { opacity: 1; }
          75% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        .winner-trophy {
          animation: trophyFlicker 2s infinite;
        }
      `}} />
    </div>
  );
};

export default Home;