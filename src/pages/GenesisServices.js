import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, X, Quote } from 'lucide-react';
import { services } from '../Data/services';

const GenesisServices = () => {
  const [selectedService, setSelectedService] = useState(null);

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

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  };

  const handleLearnMore = (service) => {
    setSelectedService(service);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedService(null);
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
          ARTIST <span className="text-accent">SPOTLIGHT</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Discover the talented artists in our community. From emerging local acts to 
          established performers, these are the voices shaping our sound.
        </p>
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
              
              <h3 className="text-2xl font-bold mb-2 group-hover:text-accent transition-colors duration-300 flex items-center">
                {service.title}
              </h3>
              
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
                <button 
                  className="flex items-center font-bold text-accent hover:underline"
                  onClick={() => handleLearnMore(service)}
                >
                  Learn More <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Detailed Service Modal */}
      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div 
              className="bg-background border border-accent/20 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-background z-10 flex justify-between items-center p-6 border-b border-accent/20">
                <h2 className="text-2xl font-bold">{selectedService.title}</h2>
                <button 
                  className="p-2 hover:bg-accent/10 rounded-full transition-colors"
                  onClick={closeModal}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2">Overview</h3>
                  <p className="text-gray-300">{selectedService.description}</p>
                </div>

                {selectedService.detailedInfo?.pricing && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Pricing Details</h3>
                    <ul className="space-y-1">
                      {selectedService.detailedInfo.pricing.map((item, i) => (
                        <li key={i} className="flex items-start">
                          <Check size={18} className="text-accent mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedService.detailedInfo?.additionalFeatures && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Additional Features</h3>
                    <ul className="space-y-1">
                      {selectedService.detailedInfo.additionalFeatures.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check size={18} className="text-accent mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedService.detailedInfo?.addOns && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Add-Ons</h3>
                    <ul className="space-y-1">
                      {selectedService.detailedInfo.addOns.map((addon, i) => (
                        <li key={i} className="flex items-start">
                          <Check size={18} className="text-accent mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">{addon}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedService.detailedInfo?.notes && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Notes</h3>
                    <ul className="space-y-1">
                      {selectedService.detailedInfo.notes.map((note, i) => (
                        <li key={i} className="flex items-start">
                          <Check size={18} className="text-accent mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedService.detailedInfo?.professionals && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Available Professionals</h3>
                    <div className="space-y-4">
                      {selectedService.detailedInfo.professionals.map((professional, i) => (
                        <div key={i} className="bg-accent/5 p-4 rounded-lg">
                          <h4 className="text-lg font-semibold text-accent mb-2">{professional.name}</h4>
                          {professional.specialty && (
                            <p className="text-gray-300 mb-2">{professional.specialty}</p>
                          )}
                          {professional.services && (
                            <ul className="space-y-1">
                              {professional.services.map((service, j) => (
                                <li key={j} className="flex items-start">
                                  <Check size={16} className="text-accent mr-2 mt-1 flex-shrink-0" />
                                  <span className="text-gray-300 text-sm">{service}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedService.detailedInfo?.categories && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Service Categories</h3>
                    <div className="space-y-4">
                      {selectedService.detailedInfo.categories.map((category, i) => (
                        <div key={i} className="bg-accent/5 p-4 rounded-lg">
                          <h4 className="text-lg font-semibold text-accent mb-1">{category.name}</h4>
                          <p className="text-gray-300 mb-2">Pricing: {category.pricing}</p>
                          <ul className="space-y-1">
                            {category.includes.map((item, j) => (
                              <li key={j} className="flex items-start">
                                <Check size={16} className="text-accent mr-2 mt-1 flex-shrink-0" />
                                <span className="text-gray-300 text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedService.detailedInfo?.styleNotes && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-2">Style Notes</h3>
                    <ul className="space-y-1">
                      {selectedService.detailedInfo.styleNotes.map((note, i) => (
                        <li key={i} className="flex items-start">
                          <Check size={18} className="text-accent mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedService.detailedInfo?.quote && (
                  <div className="mt-8 bg-accent/10 p-4 rounded-lg border-l-4 border-accent">
                    <div className="flex items-start">
                      <Quote size={24} className="text-accent mr-3 flex-shrink-0" />
                      <p className="text-gray-300 italic">{selectedService.detailedInfo.quote}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GenesisServices;