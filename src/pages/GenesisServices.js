import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { services } from '../Data/services';

const GenesisServices = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
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
          GENESIS <span className="text-accent">SERVICES</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Professional services for artists, venues, and event organizers.
          Let us help you create unforgettable experiences.
        </p>
      </motion.div>

      {/* Services Introduction */}
      <motion.div
        className="max-w-4xl mx-auto mb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="card">
          <h2 className="text-2xl font-bold mb-4">How We Can Help You</h2>
          <p className="text-gray-300 mb-6">
            96 Nation offers comprehensive solutions for the music and entertainment industry. 
            Our team of professionals can assist with every aspect of event planning, artist development, 
            and brand building. Whether you're an emerging artist looking to grow your audience or 
            a venue seeking to enhance your event production, we have the expertise to help you succeed.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#services" className="btn btn-primary">View Services</a>
            <button className="btn btn-outline">Contact Us</button>
          </div>
        </div>
      </motion.div>

      {/* Services Grid */}
      <div id="services">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              className="card group hover:border-accent transition-all duration-300"
              variants={itemVariants}
            >
              <div className="bg-accent/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                {service.icon}
              </div>
              
              <h3 className="text-2xl font-bold mb-2 group-hover:text-accent transition-colors duration-300">{service.title}</h3>
              
              <div className="flex items-center mb-4">
                <span className="text-accent font-bold mr-2">${service.price}</span>
                <span className="text-sm text-gray-400">{service.pricingType}</span>
              </div>
              
              <p className="text-gray-300 mb-6">{service.description}</p>
              
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check size={18} className="text-accent mr-2 mt-1 flex-shrink-0" />
                    <span className="text-sm text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto">
                <a 
                  href="#" 
                  className="flex items-center font-bold text-accent hover:underline"
                  onClick={(e) => e.preventDefault()}
                >
                  Learn More <ChevronRight size={16} className="ml-1" />
                </a>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default GenesisServices;