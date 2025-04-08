import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const navLinks = [
    { name: 'Upcoming Events', path: '/upcoming-events' },
    { name: 'Show Content', path: '/show-content' },
    { name: 'Senna Scene Assistant', path: '/senna-scene-assistant' },
    { name: 'Genesis Services', path: '/genesis-services' },
    { name: 'Artist Spotlight', path: '/artist-spotlight' },
  ];

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className={`navbar fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'py-3 shadow-lg' : 'py-5'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold">
              <span className="text-accent">96</span> NATION
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`navbar-link ${isActive(link.path)}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden text-white p-2" 
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-black bg-opacity-95 border-t border-gray-800 shadow-lg">
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`navbar-link ${isActive(link.path)} block py-2`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;