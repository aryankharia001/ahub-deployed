import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Animation Variants
const fadeInUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const HeroSection = () => {
  return (
    <motion.section 
      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div 
          className="text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6"
            variants={fadeInUpVariant}
            custom={1}
          >
            Get Things Done with ahub
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl mb-8 text-indigo-100"
            variants={fadeInUpVariant}
            custom={2}
          >
            Your one-stop platform for tasks, freelancers, and gig work
          </motion.p>
          
          <motion.div 
            className="space-x-4"
            variants={fadeInUpVariant}
            custom={3}
          >
            <Link to="/post-job">
            <motion.button 
              className="cursor-pointer bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              >
              Post a Job  
            </motion.button>
              </Link>
            <motion.button 
              className="cursor-pointer border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Find Work
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HeroSection;