import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScroll } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { scrollY } = useScroll();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsDropdownOpen(false);
  };

  // Get dashboard menu items based on user role
  const getDashboardMenuItems = () => {
    if (!user) return [];

    const menuItems = [];

    // Role-specific dashboards
    if (user.role === 'client') {
      menuItems.push({
        to: "/client-dashboard",
        label: "Client Dashboard"
      });
    } else if (user.role === 'contributor') {
      // Contributors have access to both dashboards
      menuItems.push({
        to: "/client-dashboard",
        label: "Client Dashboard"
      });
      menuItems.push({
        to: "/contributor-dashboard",
        label: "Contributor Dashboard"
      });
    } else if (user.role === 'admin') {
      // Admin only has access to admin dashboard
      menuItems.push({
        to: "/admin/jobs/manage",
        label: "Admin Dashboard"
      });
      // Add direct links to job review and management for admins
      menuItems.push({
        to: "/admin/jobs/review",
        label: "Job Review"
      });
    }

    return menuItems;
  };

  // Show Post Job link based on role - now contributors can also post jobs
  const showPostJobLink = () => {
    return !user || user.role === 'client' || user.role === 'contributor';
  };
  
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`bg-white sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" className="flex items-center">
                <motion.span 
                  className="text-2xl font-bold text-indigo-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  ahub
                </motion.span>
              </Link>
            </motion.div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {['How It Works', 'About'].map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                whileHover={{ y: -2 }}
              >
                <Link
                  to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-gray-700 hover:text-indigo-600 transition-colors duration-200"
                >
                  {item}
                </Link>
              </motion.div>
            ))}
            
            {showPostJobLink() && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link 
                  to="/post-job"
                  className="cursor-pointer bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200"
                >
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-block"
                  >
                    Post a Job
                  </motion.span>
                </Link>
              </motion.div>
            )}

            {isAuthenticated ? (
              // Authenticated user menu
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <button className="cursor-pointer flex items-center text-gray-700 hover:text-indigo-600 transition-colors duration-200">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center mr-2">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium">{user?.name || 'User'}</span>
                  </div>
                  <svg 
                    className={`ml-1 h-4 w-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="py-1">
                        {getDashboardMenuItems().map((item, index) => (
                          <Link
                            key={index}
                            to={item.to}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                              {item.label}
                            </motion.div>
                          </Link>
                        ))}
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                            Profile
                          </motion.div>
                        </Link>
                        <hr className="my-1" />
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                            Logout
                          </motion.div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              // Non-authenticated user menu
              <>
                {['Login'].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (index + 5) }}
                  >
                    <Link
                      to={`/${item.toLowerCase().replace(/\s+/g, '')}`}
                      className={`px-6 py-2 rounded-lg transition-all duration-200 ${
                        item === 'Sign Up' 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                          : 'text-gray-700 hover:text-indigo-600'
                      }`}
                    >
                      <motion.span
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block"
                      >
                        {item}
                      </motion.span>
                    </Link>
                  </motion.div>
                ))}
              </>
            )}
          </div>
          
          <div className="md:hidden flex items-center">
            <motion.button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className="text-gray-700"
              whileTap={{ scale: 0.9 }}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="md:hidden bg-white border-t"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {['How It Works', 'About'].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="block px-3 py-2 text-gray-700 hover:text-indigo-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <motion.div whileHover={{ x: 5 }}>
                      {item}
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
              
              {/* Show Post Job link based on role */}
              {showPostJobLink() && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link
                    to="/post-job"
                    className="block px-3 py-2 text-gray-700 hover:text-indigo-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <motion.div whileHover={{ x: 5 }}>
                      Post a Job
                    </motion.div>
                  </Link>
                </motion.div>
              )}
              
              {isAuthenticated ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <div className="px-3 py-2 text-gray-900 font-medium border-b">
                      {user?.name || 'User'}
                    </div>
                  </motion.div>
                  
                  {/* Dynamic dashboard menu items based on role */}
                  {getDashboardMenuItems().map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (index * 0.05) }}
                    >
                      <Link
                        to={item.to}
                        className="block px-3 py-2 text-gray-700 hover:text-indigo-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <motion.div whileHover={{ x: 5 }}>
                          {item.label}
                        </motion.div>
                      </Link>
                    </motion.div>
                  ))}
                  
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Link
                      to="/profile"
                      className="block px-3 py-2 text-gray-700 hover:text-indigo-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <motion.div whileHover={{ x: 5 }}>
                        Profile
                      </motion.div>
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-gray-700 hover:text-indigo-600"
                    >
                      <motion.div whileHover={{ x: 5 }}>
                        Logout
                      </motion.div>
                    </button>
                  </motion.div>
                </>
              ) : (
                <>
                  {['Login'].map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (index + 3) * 0.05 }}
                    >
                      <Link
                        to={`/${item.toLowerCase().replace(/\s+/g, '')}`}
                        className="block px-3 py-2 text-gray-700 hover:text-indigo-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <motion.div whileHover={{ x: 5 }}>
                          {item}
                        </motion.div>
                      </Link>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;