import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { backendurl } from '../../App';
import { 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  FileText,
  Eye,
  Download,
  Filter,
  ChevronDown,
  User,
  DollarSign,
  File
} from 'lucide-react';
import { RotateCcw } from 'lucide-react';
import RevisionSubmitModal from '../../components/RevisionSubmitModal';
import RevisionList from '../../components/RevisionList';

// Animation variants
const fadeInVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
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

const ContributorDashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(
    location.state?.notification || null
  );
  const [activeTab, setActiveTab] = useState('available');
  const [jobDetails, setJobDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [stats, setStats] = useState({
    activeJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    availableJobs: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('deadline');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [showRevisionSubmitModal, setShowRevisionSubmitModal] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState(null);






  const handleStartRevision = async (revisionId) => {
    try {
      const response = await axios.post(
        `${backendurl}/api/jobs/${jobDetails._id}/revisions/${revisionId}/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setNotification('You have started working on this revision.');
      
      // Refresh job data
      const jobsResponse = await axios.get(`${backendurl}/api/jobs/contributor/my-jobs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMyJobs(jobsResponse.data.data || []);
      
    } catch (err) {
      console.error('Error starting revision:', err);
      setError(err.response?.data?.message || 'Failed to start revision.');
    }
  };



  const handleSubmitRevision = async (revisionId) => {
    setSelectedRevision(revisionId);
    setShowRevisionSubmitModal(true);
  };



  const handleRevisionSubmission = async (formData) => {
    setIsSubmitting(true);
    setUploadProgress(0);
    
    try {
      const response = await axios.post(
        `${backendurl}/api/jobs/${jobDetails._id}/submit-work`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      setNotification('Revision submitted successfully! The client will be notified to review it.');
      setShowRevisionSubmitModal(false);
      
      // Refresh job data
      const jobsResponse = await axios.get(`${backendurl}/api/jobs/contributor/my-jobs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMyJobs(jobsResponse.data.data || []);
      
    } catch (err) {
      console.error('Error submitting revision:', err);
      setError(err.response?.data?.message || 'Failed to submit revision.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${backendurl}/api/jobs/contributor/stats`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        setStats(response.data.data || {});
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    fetchStats();
  }, []);

  // Fetch jobs based on active tab
  useEffect(() => {
    const fetchAvailableJobs = async () => {
      setLoading(true);
      setError(null);
  
      try {
        // The API endpoint already filters for deposit_paid jobs with no freelancer
        let endpoint = `${backendurl}/api/jobs/contributor/available`;
        let params = {
          sortBy,
          sortOrder
        };
        
        if (searchQuery.trim()) {
          params.search = searchQuery;
        }
        
        const response = await axios.get(endpoint, {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
  
        setAvailableJobs(response.data.data || []);
      } catch (err) {
        console.error('Error fetching available jobs:', err);
        setError('Failed to load available jobs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const fetchMyJobs = async () => {
      try {
        let endpoint = `${backendurl}/api/jobs/contributor/my-jobs`;
        let params = {
          sortBy,
          sortOrder
        };
        
        if (searchQuery.trim()) {
          params.search = searchQuery;
        }
        
        const response = await axios.get(endpoint, {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        setMyJobs(response.data.data || []);
      } catch (err) {
        console.error('Error fetching my jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'available') {
      fetchAvailableJobs();
    } else {
      fetchMyJobs();
    }
  }, [activeTab, sortBy, sortOrder, searchQuery]);

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    // The useEffect hook will trigger a fetch with the updated searchQuery
  };

  // Handle job application
  const handleApplyForJob = async (jobId) => {
    setIsSubmitting(true);
    setSubmitError(null);
  
    try {
      // First, check if the job is in the correct status (deposit_paid)
      const jobToApply = availableJobs.find(job => job._id === jobId);
      if (!jobToApply || jobToApply.status !== 'deposit_paid') {
        throw new Error('This job is not available for applications or has already been taken');
      }
  
      // Make API call to apply for the job
      const response = await axios.post(`${backendurl}/api/jobs/${jobId}/apply`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
  
      // Log successful response
      console.log("Application response:", response.data);
  
      // Set success notification
      setNotification('Application submitted successfully! You can now begin work on this job.');
      
      // Update the jobs list by removing the job that was applied for
      setAvailableJobs(prevJobs => prevJobs.filter(job => job._id !== jobId));
      
      // Clear the job details panel
      setJobDetails(null);
      
      // Refresh stats to update the dashboard numbers
      const statsResponse = await axios.get(`${backendurl}/api/jobs/contributor/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setStats(statsResponse.data.data || {});
      
      // Also fetch my jobs to reflect the newly assigned job
      const myJobsResponse = await axios.get(`${backendurl}/api/jobs/contributor/my-jobs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setMyJobs(myJobsResponse.data.data || []);
      
    } catch (err) {
      console.error('Error applying for job:', err);
      // Display more detailed error message
      const errorMessage = 
        err.response?.data?.message || 
        err.message || 
        'Failed to apply for this job. Please try again.';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file selection for upload
  // Updated handleFileChange function for ContributorDashboardPage.jsx

const handleFileChange = (e) => {
  // Make sure there are files selected
  if (e.target.files && e.target.files.length > 0) {
    // Convert FileList to Array
    const filesArray = Array.from(e.target.files);
    
    // Log file information for debugging
    filesArray.forEach(file => {
      console.log(`Selected file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    });
    
    // Update state with selected files
    setSelectedFiles(filesArray);
  }
};

  // Open file upload modal
  const handleOpenUploadModal = (jobId) => {
    setJobDetails(myJobs.find(job => job._id === jobId));
    setSelectedFiles([]);
    setUploadProgress(0);
    setShowUploadModal(true);
  };

  // Handle work submission
  // Updated handleSubmitWork function for ContributorDashboardPage.jsx

const handleSubmitWork = async (e, jobId) => {
  e.preventDefault();
  setIsSubmitting(true);
  setSubmitError(null);
  
  if (selectedFiles.length === 0) {
    setSubmitError("Please select at least one file to upload");
    setIsSubmitting(false);
    return;
  }

  try {
    // Create a FormData object
    const formData = new FormData();
    
    // Append each file to the 'files' field - this must match your multer configuration
    selectedFiles.forEach(file => {
      formData.append("files", file);
    });
    
    // Add message if provided
    const messageInput = e.target.elements.message;
    if (messageInput && messageInput.value) {
      formData.append("message", messageInput.value);
    }
    
    // Log what we're sending
    console.log(`Sending ${selectedFiles.length} files to server for job ID: ${jobId}`);
    
    // Make the API request
    const response = await axios.post(`${backendurl}/api/jobs/${jobId}/submit-work`, formData, {
      headers: {
        // Don't set Content-Type when sending FormData - Axios will set it with the boundary
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    });
    
    console.log('Server response:', response.data);
    
    // Show success notification
    setNotification('Work submitted successfully! The client will be notified when admin reviews it.');
    
    // Update job status in the UI
    setMyJobs(prevJobs => 
      prevJobs.map(job => 
        job._id === jobId ? { ...job, status: 'completed' } : job
      )
    );
    
    // Close modal and clean up
    setShowUploadModal(false);
    setJobDetails(null);
    
    // Refresh stats from server
    const statsResponse = await axios.get(`${backendurl}/api/jobs/contributor/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    setStats(statsResponse.data.data || {});
    
  } catch (err) {
    console.error('Error submitting work:', err);
    
    // Detailed error logging
    if (err.response) {
      console.error('Server responded with error:', {
        status: err.response.status,
        data: err.response.data
      });
    }
    
    setSubmitError(err.response?.data?.message || 'Failed to submit work. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  // View job details
  const handleViewDetails = async (jobId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${backendurl}/api/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setJobDetails(response.data.data);
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError('Failed to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // Toggle order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending for new sort field
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'deposit_paid': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-indigo-100 text-indigo-800';
      case 'final_paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'deposit_paid': return 'Available';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed - Awaiting Client Payment';
      case 'final_paid': return 'Completed & Paid';
      default: return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Render job details panel
  const renderJobDetails = () => {
    if (!jobDetails) return null;

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">{jobDetails.title}</h2>
          <button 
            onClick={() => setJobDetails(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(jobDetails.status)}`}>
            {getStatusLabel(jobDetails.status)}
          </span>
          <span className="ml-2 text-sm text-gray-500">
            Posted on {new Date(jobDetails.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500">Category</h3>
          <p className="text-base text-gray-900">{jobDetails.category}</p>
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500">Description</h3>
          <p className="text-base text-gray-900 whitespace-pre-line">{jobDetails.description}</p>
        </div>
        
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500">Deadline</h3>
          <p className="text-base text-gray-900">{new Date(jobDetails.deadline).toLocaleDateString()}</p>
          
          {/* Calculate days remaining until deadline */}
          {(() => {
            const today = new Date();
            const deadline = new Date(jobDetails.deadline);
            const diffTime = deadline - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 0) {
              return (
                <p className={`text-sm ${diffDays <= 3 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                  {diffDays} day{diffDays !== 1 ? 's' : ''} remaining
                </p>
              );
            } else if (diffDays === 0) {
              return <p className="text-sm text-red-500 font-medium">Due today!</p>;
            } else {
              return <p className="text-sm text-red-500 font-medium">Overdue by {Math.abs(diffDays)} day{Math.abs(diffDays) !== 1 ? 's' : ''}</p>;
            }
          })()}
        </div>
        
        {jobDetails.skills && jobDetails.skills.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500">Required Skills</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {jobDetails.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500">Budget</h3>
          <p className="text-lg font-bold text-indigo-600">${jobDetails.price?.toFixed(2) || 'To be determined'}</p>
        </div>
        
        {activeTab === 'available' && (
          <div className="mt-6">
            <button
              onClick={() => handleApplyForJob(jobDetails._id)}
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Applying...' : 'Apply for This Job'}
            </button>
            {submitError && (
              <p className="mt-2 text-sm text-red-600">{submitError}</p>
            )}
          </div>
        )}
        
        {activeTab === 'my-jobs' && jobDetails.status === 'in_progress' && (
          <div className="mt-6">
            <button
              onClick={() => handleOpenUploadModal(jobDetails._id)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
            >
              Submit Work
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading && !availableJobs.length && !myJobs.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="bg-gray-50 min-h-screen py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          variants={fadeInVariant}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Contributor Dashboard</h1>
          <p className="text-gray-600">Find available jobs and manage your current projects</p>
        </motion.div>
        
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 p-4 rounded-lg mb-6"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{notification}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button 
                    onClick={() => setNotification(null)}
                    className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}


        {activeTab === 'my-jobs' && jobDetails && jobDetails.revisions && jobDetails.revisions.length > 0 && (
          <div className="mb-6">
            <RevisionList 
              revisions={jobDetails.revisions} 
              onStartRevision={handleStartRevision}
              onSubmitRevision={handleSubmitRevision}
            />
          </div>
        )}



        
        
        {error && (
          <motion.div 
            variants={fadeInVariant}
            className="bg-red-50 p-4 rounded-lg mb-6"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div variants={fadeInVariant} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Jobs</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.activeJobs}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Completed Jobs</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">{stats.completedJobs}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Earnings</h3>
            <p className="mt-2 text-3xl font-bold text-purple-600">${stats.totalEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Available Jobs</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.availableJobs}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <motion.div variants={fadeInVariant} className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
              <div className="bg-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Navigation</h2>
              </div>
              <div className="p-4">
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => setActiveTab('available')}
                    className={`px-4 py-2 rounded-lg text-left ${
                      activeTab === 'available'
                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Available Jobs
                  </button>
                  <button
                    onClick={() => setActiveTab('my-jobs')}
                    className={`px-4 py-2 rounded-lg text-left ${
                      activeTab === 'my-jobs'
                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    My Jobs
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInVariant} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Profile Overview</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold">
                    {user?.name?.charAt(0) || 'C'}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{user?.name}</h3>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link
                    to="/profile"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="md:col-span-2">
            {jobDetails && renderJobDetails()}
            
            <motion.div variants={fadeInVariant} className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
              <div className="p-4">
                <form onSubmit={handleSearch} className="flex gap-4 items-center">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search jobs by title, skills, or description..."
                      className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Filter className="h-5 w-5 mr-2 text-gray-400" />
                    Filters
                    <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isFilterOpen ? 'transform rotate-180' : ''}`} />
                  </button>
                </form>

                {isFilterOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                          Sort By
                        </label>
                        <select
                          id="sortBy"
                          value={sortBy}
                          onChange={(e) => {
                            setSortBy(e.target.value);
                          }}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="createdAt">Post Date</option>
                          <option value="deadline">Deadline</option>
                          <option value="title">Title</option>
                          <option value="price">Price</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 mb-1">
                          Sort Order
                        </label>
                        <select
                          id="sortOrder"
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="asc">Ascending</option>
                          <option value="desc">Descending</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
            
            <motion.div variants={fadeInVariant} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">
                  {activeTab === 'available' ? 'Available Jobs' : 'My Jobs'}
                </h2>
                <span className="bg-white bg-opacity-20 text-black text-sm px-3 py-1 rounded-full">
                  {activeTab === 'available' ? availableJobs.length : myJobs.length} job{(activeTab === 'available' ? availableJobs.length : myJobs.length) !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="divide-y divide-gray-200">
                {activeTab === 'available' && availableJobs.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No available jobs found</h3>
                    <p className="mt-1 text-gray-500">
                      {searchQuery ? 'Try a different search term or clear filters' : 'Check back later for new opportunities'}
                    </p>
                  </div>
                ) : activeTab === 'my-jobs' && myJobs.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">You haven't taken any jobs yet</h3>
                    <p className="mt-1 text-gray-500">
                      {searchQuery ? 'Try a different search term or clear filters' : 'Browse available jobs to find work that matches your skills'}
                    </p>
                  </div>
                ) : (
                  (activeTab === 'available' ? availableJobs : myJobs).map(job => (
                    <motion.div 
                      key={job._id}
                      className="p-6 hover:bg-gray-50"
                      whileHover={{ backgroundColor: 'rgba(249, 250, 251, 0.5)' }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{job.title}</h3>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="truncate">Category: {job.category}</span>
                            <span className="mx-2">•</span>
                            <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                              {getStatusLabel(job.status)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 flex flex-col items-end">
                          {job.price && (
                            <div className="text-lg font-bold text-gray-900">
                              ${job.price.toFixed(2)}
                            </div>
                          )}
                          <div className="mt-2">
                            <button
                              onClick={() => handleViewDetails(job._id)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              View Details
                            </button>
                            {activeTab === 'my-jobs' && job.status === 'in_progress' && (
                              <button
                                onClick={() => handleOpenUploadModal(job._id)}
                                className="ml-2 inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                              >
                                Submit Work
                              </button>
                            )}




                  {activeTab === 'my-jobs' && job.status === 'revision_in_progress' && (
                      <button
                        onClick={() => {
                          const activeRevision = job.revisions?.find(r => r.status === 'in_progress');
                          if (activeRevision) {
                            handleSubmitRevision(activeRevision._id);
                          }
                        }}
                        className="ml-2 inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Submit Revision
                      </button>
                    )}
                    
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Work Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">Submit Work for "{jobDetails?.title}"</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* <form onSubmit={(e) => handleSubmitWork(e, jobDetails?._id)}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Work Files
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        <span>Upload files</span>
                        <input 
                          id="file-upload" 
                          name="files" 
                          type="file" 
                          multiple 
                          className="sr-only" 
                          onChange={handleFileChange}
                          ref={fileInputRef}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF, DOC, ZIP up to 10MB each
                    </p>
                  </div>
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                    <ul className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center">
                            <File className="h-4 w-4 text-indigo-500 mr-2" />
                            <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                            }}
                            className="text-gray-400 hover:text-gray-500"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {uploadProgress > 0 && isSubmitting && (
                  <div className="mt-4">
                    <div className="relative pt-1">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold inline-block text-indigo-600">
                            Uploading...
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-indigo-600">
                            {uploadProgress}%
                          </span>
                        </div>
                      </div>
                      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                        <div style={{ width: `${uploadProgress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Client (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="3"
                  className="block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Any notes or instructions for the client..."
                ></textarea>
              </div>
              
              {submitError && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{submitError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedFiles.length === 0}
                  className={`inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    isSubmitting || selectedFiles.length === 0
                      ? 'bg-indigo-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Work'}
                </button>
              </div>
            </form> */}


<form onSubmit={(e) => {
  e.preventDefault();
  setIsSubmitting(true);
  setSubmitError(null);
  
  if (selectedFiles.length === 0) {
    setSubmitError("Please select at least one file to upload");
    setIsSubmitting(false);
    return;
  }

  const formData = new FormData();
  
  // Append each file individually with the 'files' field name
  selectedFiles.forEach(file => {
    console.log(`Uploading file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    formData.append("files", file);
  });
  
  // Add message if provided
  const messageInput = e.target.elements.message;
  if (messageInput && messageInput.value) {
    formData.append("message", messageInput.value);
  }
  
  console.log(`Submitting ${selectedFiles.length} files for job: ${jobDetails?._id}`);
  
  // Submit the form data
  axios.post(`${backendurl}/api/jobs/${jobDetails?._id}/submit-work`, formData, {
    headers: {
      // Do NOT set Content-Type here - let Axios set it automatically with boundary
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      setUploadProgress(percentCompleted);
      console.log(`Upload progress: ${percentCompleted}%`);
    }
  })
  .then(response => {
    console.log('Upload successful:', response.data);
    setNotification('Work submitted successfully! The client will be notified when admin reviews it.');
    
    // Update the job in myJobs list
    setMyJobs(prevJobs => 
      prevJobs.map(job => 
        job._id === jobDetails?._id ? { ...job, status: 'completed' } : job
      )
    );
    
    // Close modal
    setShowUploadModal(false);
    
    // Clear the job details
    setJobDetails(null);
    
    // Refresh stats
    axios.get(`${backendurl}/api/jobs/contributor/stats`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(statsResponse => {
      setStats(statsResponse.data.data || {});
    })
    .catch(err => {
      console.error('Error fetching stats:', err);
    });
  })
  .catch(err => {
    console.error('Error submitting work:', err);
    if (err.response) {
      console.error('Server error details:', err.response.data);
    }
    setSubmitError(err.response?.data?.message || 'Failed to submit work. Please try again.');
  })
  .finally(() => {
    setIsSubmitting(false);
  });
}}>
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Upload Work Files
    </label>
    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
      <div className="space-y-1 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex text-sm text-gray-600">
          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
            <span>Upload files</span>
            <input 
              id="file-upload" 
              name="files" 
              type="file" 
              multiple 
              className="sr-only" 
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const files = Array.from(e.target.files);
                  console.log(`Selected ${files.length} files`);
                  setSelectedFiles(files);
                }
              }}
              ref={fileInputRef}
            />
          </label>
          <p className="pl-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500">
          PNG, JPG, PDF, DOC, ZIP up to 10MB each
        </p>
      </div>
    </div>
    
    {selectedFiles.length > 0 && (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files ({selectedFiles.length}):</h4>
        <ul className="space-y-2 max-h-32 overflow-y-auto">
          {selectedFiles.map((file, index) => (
            <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
              <div className="flex items-center">
                <File className="h-4 w-4 text-indigo-500 mr-2" />
                <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )}
    
    {uploadProgress > 0 && isSubmitting && (
      <div className="mt-4">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-indigo-600">
                Uploading...
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-indigo-600">
                {uploadProgress}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
            <div style={{ width: `${uploadProgress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"></div>
          </div>
        </div>
      </div>
    )}
  </div>
  
  <div className="mb-4">
    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
      Message to Client (Optional)
    </label>
    <textarea
      id="message"
      name="message"
      rows="3"
      className="block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md"
      placeholder="Any notes or instructions for the client..."
    ></textarea>
  </div>
  
  {submitError && (
    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      </div>
    </div>
  )}
  
  <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
    <button
      type="button"
      onClick={() => setShowUploadModal(false)}
      className="inline-flex justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={isSubmitting || selectedFiles.length === 0}
      className={`inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
        isSubmitting || selectedFiles.length === 0
          ? 'bg-indigo-400 cursor-not-allowed'
          : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
      }`}
    >
      {isSubmitting ? 'Submitting...' : 'Submit Work'}
    </button>
  </div>
</form>
          </div>
        </div>
      )}




<RevisionSubmitModal 
  isOpen={showRevisionSubmitModal}
  onClose={() => setShowRevisionSubmitModal(false)}
  onSubmit={handleRevisionSubmission}
  isSubmitting={isSubmitting}
  jobId={jobDetails?._id}
  revisionId={selectedRevision}
  uploadProgress={uploadProgress}
/>



    </motion.div>
  );
};

export default ContributorDashboardPage;