import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SendHorizontal, Bot, User, Loader2, X, Maximize, Minimize, ArrowDown } from 'lucide-react';

const SennaSceneAssistant = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey there! I'm Senna, your scene assistant. I can help with information about 96 Nation events, artists, venues, and more. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, minimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mock response generator (would connect to a real API in production)
  const generateResponse = async (userMessage) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple response logic based on keywords
    let responseMessage = "";
    const lowercaseMessage = userMessage.toLowerCase();
    
    if (lowercaseMessage.includes('event') || lowercaseMessage.includes('show')) {
      responseMessage = "Our next event is on April 15th at The Warehouse. It's featuring local artists including The Midnight Crawlers and Echo Valley. Tickets are available on our website!";
    } else if (lowercaseMessage.includes('artist') || lowercaseMessage.includes('band')) {
      responseMessage = "We work with many local and touring artists across genres. Check out our Artist Spotlight page to discover more about the talented musicians in our community.";
    } else if (lowercaseMessage.includes('ticket') || lowercaseMessage.includes('price')) {
      responseMessage = "Ticket prices vary by event. Most shows range from $10-25, with special events and festivals priced differently. We also offer free community showcases periodically!";
    } else if (lowercaseMessage.includes('location') || lowercaseMessage.includes('venue')) {
      responseMessage = "We host events at several venues around Tallahassee, including The Warehouse, Capitol City Amphitheater, and Club Downunder. Each venue page has directions and parking information.";
    } else if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi')) {
      responseMessage = "Hi there! How can I help you today with 96 Nation events or information?";
    } else {
      responseMessage = "Thanks for reaching out! I'm still learning, but I'd be happy to connect you with a team member who can better answer your question. You can also email us at info@96nation.com for more information.";
    }
    
    setIsLoading(false);
    return responseMessage;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = {
      role: 'user',
      content: input.trim(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Get and add assistant response
    const response = await generateResponse(userMessage.content);
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: response,
    }]);
  };

  const toggleMinimize = () => {
    setMinimized(prev => !prev);
    setExpanded(false);
  };

  const toggleExpand = () => {
    setExpanded(prev => !prev);
    setMinimized(false);
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
          SENNA <span className="text-accent">SCENE ASSISTANT</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Have questions about 96 Nation, our events, or the local music scene? 
          Senna is here to help you get the information you need.
        </p>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="card mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-4">How Can Senna Help You?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/50 p-4 rounded">
              <h3 className="font-bold text-accent mb-2">Event Information</h3>
              <p className="text-gray-300 text-sm">
                Get details about upcoming shows, venues, ticket prices, and lineups.
              </p>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <h3 className="font-bold text-accent mb-2">Artist Directory</h3>
              <p className="text-gray-300 text-sm">
                Learn about local and touring artists that work with 96 Nation.
              </p>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <h3 className="font-bold text-accent mb-2">Venue Details</h3>
              <p className="text-gray-300 text-sm">
                Find locations, directions, parking information, and venue amenities.
              </p>
            </div>
            <div className="bg-black/50 p-4 rounded">
              <h3 className="font-bold text-accent mb-2">Local Scene Tips</h3>
              <p className="text-gray-300 text-sm">
                Get recommendations for local spots, music, and things to do in Tallahassee.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chat Interface */}
      <motion.div
        className={`fixed ${
          minimized ? 'bottom-0 right-4 w-72' : 
          expanded ? 'inset-6' : 
          'bottom-4 right-4 w-80 sm:w-96 h-96'
        } bg-black bg-opacity-90 backdrop-blur-sm rounded-t-lg rounded-b-lg 
        shadow-lg border border-gray-800 z-40 flex flex-col transition-all duration-300`}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {/* Chat Header */}
        <div className="p-3 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mr-2">
              <Bot size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Senna Scene Assistant</h3>
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                <span className="text-xs text-gray-400">Online</span>
              </div>
            </div>
          </div>
          <div className="flex space-x-1">
            {!minimized && (
              <button
                onClick={toggleExpand}
                className="p-1 text-gray-500 hover:text-white transition"
                aria-label={expanded ? "Minimize window" : "Maximize window"}
              >
                {expanded ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            )}
            <button
              onClick={toggleMinimize}
              className="p-1 text-gray-500 hover:text-white transition"
              aria-label={minimized ? "Expand chat" : "Minimize chat"}
            >
              {minimized ? <ArrowDown size={16} /> : <X size={16} />}
            </button>
          </div>
        </div>
        
        {/* Chat Messages */}
        {!minimized && (
          <>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`flex max-w-[80%] ${message.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'assistant' ? 'bg-accent/20 mr-2' : 'bg-gray-700 ml-2'
                    }`}>
                      {message.role === 'assistant' ? (
                        <Bot size={16} className="text-accent" />
                      ) : (
                        <User size={16} className="text-white" />
                      )}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      message.role === 'assistant' 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-accent text-white'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center mr-2">
                      <Bot size={16} className="text-accent" />
                    </div>
                    <div className="rounded-lg p-3 bg-gray-800 text-white">
                      <Loader2 size={16} className="animate-spin" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Chat Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-gray-800">
              <div className="flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Senna a question..."
                  className="flex-grow bg-gray-800 rounded-l-lg px-4 py-2 focus:outline-none text-white"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="bg-accent text-white p-2 rounded-r-lg hover:bg-accent/80 transition"
                  disabled={isLoading || !input.trim()}
                >
                  <SendHorizontal size={20} />
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default SennaSceneAssistant;