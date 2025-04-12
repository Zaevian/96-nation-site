import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Youtube, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black py-10 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Logo and Description */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <h2 className="text-2xl font-bold">
                <span className="text-accent">96</span> NATION
              </h2>
            </Link>
            <p className="text-gray-400 max-w-md">
              Live events and artist showcase company based in Tallahassee, Florida. 
              Bringing the best underground music and art to the scene since 2022.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-l-2 border-accent pl-3">
              Navigation
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-accent transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/upcoming-events" className="text-gray-400 hover:text-accent transition">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link to="/show-content" className="text-gray-400 hover:text-accent transition">
                  Show Content
                </Link>
              </li>
              <li>
                <Link to="/genesis-services" className="text-gray-400 hover:text-accent transition">
                  Genesis Services
                </Link>
              </li>
              <li>
                <Link to="/artist-spotlight" className="text-gray-400 hover:text-accent transition">
                  Artist Spotlight
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-l-2 border-accent pl-3">
              Connect With Us
            </h3>
            <div className="flex space-x-4 mb-6">
              <a href="https://instagram.com/babyydreofficial" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-accent transition" aria-label="Instagram">
                <Instagram size={24} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-accent transition" aria-label="Facebook">
                <Facebook size={24} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-accent transition" aria-label="Twitter">
                <Twitter size={24} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-accent transition" aria-label="Youtube">
                <Youtube size={24} />
              </a>
              <a href="mailto:info@96nation.com" className="text-gray-400 hover:text-accent transition" aria-label="Email">
                <Mail size={24} />
              </a>
            </div>
            <p className="text-sm text-gray-500">
              info@96nation.com<br />
              Tallahassee, Florida
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
          <p>&copy; 2025 96 Nation FL. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;