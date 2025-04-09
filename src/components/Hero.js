import React, { useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { motion, useScroll, useTransform } from 'framer-motion';

// Import the actual hero video
import heroVideo from '../Assets/hero-page-video/hero-page-video.mp4';

const Hero = () => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // Parallax effect values
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  useEffect(() => {
    // Preload video for better performance
    if (videoRef.current) {
      videoRef.current.preload = 'auto';
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
    >
      {/* Video Background */}
      <motion.div 
        className="absolute inset-0 w-full h-full"
        style={{ scale: videoScale }}
      >
        <ReactPlayer
          ref={videoRef}
          url={heroVideo}
          playing
          loop
          muted
          width="100%"
          height="100%"
          style={{ objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
          config={{
            file: {
              attributes: {
                style: {
                  objectFit: 'cover',
                  width: '100%',
                  height: '100%',
                }
              }
            }
          }}
        />
        <div className="video-overlay absolute inset-0" />
      </motion.div>

      {/* Hero Text */}
      <motion.div 
        className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center"
        style={{ 
          opacity: textOpacity,
          y: textY,
        }}
      >
        <h1 className="hero-text mb-6">
          <span className="block">
            <span className="text-accent">96</span> NATION
          </span>
          <span className="block text-3xl md:text-5xl mt-2">WE ARE</span>
        </h1>
        
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <a 
            href="#upcoming-events" 
            className="btn btn-primary"
          >
            Explore Events
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Hero;