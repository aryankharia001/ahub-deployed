import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { backendurl } from '../App';
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  Tag, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Briefcase,
  Filter,
  ChevronDown,
  Search,
  Download
} from 'lucide-react';
import { ThumbsUp, RotateCcw } from 'lucide-react';
import ApprovalModal from '../components/ApprovalModal';
import { button } from 'framer-motion/client';


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

const ClientDashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(
    location.state?.notification || null
  );
  const [activeTab, setActiveTab] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);


  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedJobForReview, setSelectedJobForReview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRevisionFeedback, setShowRevisionFeedback] = useState(false);

  const [revisionFeedbackMap, setRevisionFeedbackMap] = useState({});
  const [showRevisionFeedbackMap, setShowRevisionFeedbackMap] = useState({});
  const [submittingRevision, setSubmittingRevision] = useState({});

  // Status options for filtering tabs
  const statusOptions = [
    { value: 'all', label: 'All Jobs' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'approved', label: 'Approved (Pay Deposit)' },
    { value: 'deposit_paid', label: 'Awaiting Contributor' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed (Pay Final)' },
    { value: 'final_paid', label: 'Completed & Paid' },
    { value: 'job_end', label: 'Job Ended' }
  ];


  const handleDeleteJob = async (jobId) => {
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      // Include the token in the request headers
      const response = await axios.delete(`${backendurl}/api/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Show success notification
        setNotification('Job deleted successfully');
        
        
        // Remove the deleted job from the state
        setJobs(prevJobs => prevJobs.filter(job => job._id !== jobId));
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      
      // Show error notification with the message from the server
      const errorMessage = error.response?.data?.message || 'Failed to delete job';
      setError(errorMessage);
    }
  };

  // Fixed handleNoClick function with proper authorization header
const handleNoClick = async (jobId) => {
  try {
    const confirmed = window.confirm("Are you sure you don't want a revision?");
    if (!confirmed) return;

    // IMPORTANT: Update UI states BEFORE the API call for immediate feedback
    // 1. Update the job's status in the jobs array
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job._id === jobId 
          ? { ...job, status: 'job_end' } 
          : job
      )
    );
    
    // 2. Then make the API call with proper authorization header
    await axios.put(
      `${backendurl}/api/jobs/${jobId}/no-revision-required`, 
      { status: 'job_end' },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    console.log('Job status updated to completed');
  } catch (error) {
    console.error('Failed to update job status:', error);
    
    // If API call fails, revert the UI changes
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job._id === jobId 
          ? { ...job, status: 'final_paid' } 
          : job
      )
    );
    
    alert('Failed to update job status. Please try again.');
  }
};
  



  const handleYesClick = async (jobId) => {
    const confirmed = window.confirm("Do you want to request revisions for this job?");
    if (!confirmed) return;
    
    await axios.put(`${backendurl}/api/jobs/${jobId}/revision-required`,
      { status: 'in_progress' },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    )
    // Show the feedback form for this specific job
    setShowRevisionFeedbackMap(prev => ({
      ...prev,
      [jobId]: true
    }));
    
    // Initialize the feedback text for this job
    setRevisionFeedbackMap(prev => ({
      ...prev,
      [jobId]: ""
    }));
  };
  
  // Handle feedback text changes
  const handleRevisionFeedbackChange = (jobId, text) => {
    setRevisionFeedbackMap(prev => ({
      ...prev,
      [jobId]: text
    }));
  };
  
 // Fixed handleSubmitRevisionFeedback function with proper authorization
const handleSubmitRevisionFeedback = async (jobId) => {
  try {
    const feedback = revisionFeedbackMap[jobId];
    
    if (!feedback || feedback.trim() === "") {
      alert("Please provide revision feedback details.");
      return;
    }
    
    // Set submitting state for this job
    setSubmittingRevision(prev => ({
      ...prev,
      [jobId]: true
    }));
    
    // Immediately update UI to show "In Progress" status
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job._id === jobId 
          ? { ...job, status: 'revision_in_progress' } 
          : job
      )
    );
    
    // Hide the feedback form
    setShowRevisionFeedbackMap(prev => ({
      ...prev,
      [jobId]: false
    }));
    
    // Make API call to submit revision request with proper auth header
    await axios.put(
      `${backendurl}/api/jobs/${jobId}/request-revision`, 
      { 
        feedback: feedback,
        status: 'revision_in_progress'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    console.log('Revision request submitted successfully');
    
  } catch (error) {
    console.error('Failed to submit revision request:', error);
    
    // Revert UI changes if API call fails
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job._id === jobId 
          ? { ...job, status: 'final_paid' } 
          : job
      )
    );
    
    // Show the feedback form again
    setShowRevisionFeedbackMap(prev => ({
      ...prev,
      [jobId]: true
    }));
    
    alert('Failed to submit revision request. Please try again.');
  } finally {
    // Reset submitting state
    setSubmittingRevision(prev => ({
      ...prev,
      [jobId]: false
    }));
  }
};



  const handleRequestRevision = async (feedback) => {
    if (!feedback.trim() || !selectedJobForReview) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(
        `${backendurl}/api/jobs/${selectedJobForReview._id}/client-review`,
        { 
          action: 'request_revision',
          feedback: feedback 
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setNotification('Revision request sent successfully.');
      setShowRevisionModal(false);
      
      // Update jobs list
      const updatedJobs = jobs.map(job => 
        job._id === selectedJobForReview._id ? response.data.data : job
      );
      setJobs(updatedJobs);
      
      // Clear selection
      setSelectedJobForReview(null);
      
    } catch (err) {
      console.error('Error requesting revision:', err);
      setError(err.response?.data?.message || 'Failed to submit revision request.');
    } finally {
      setIsSubmitting(false);
    }
  };




  const handleApproveWork = async (feedback) => {
    if (!selectedJobForReview) return;
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(
        `${backendurl}/api/jobs/${selectedJobForReview._id}/client-review`,
        { 
          action: 'approve',
          feedback: feedback || 'Work approved' 
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setNotification('Work approved successfully. You can now proceed to make the final payment.');
      setShowApprovalModal(false);
      
      // Update jobs list
      const updatedJobs = jobs.map(job => 
        job._id === selectedJobForReview._id ? response.data.data : job
      );
      setJobs(updatedJobs);
      
      // Clear selection
      setSelectedJobForReview(null);
      
    } catch (err) {
      console.error('Error approving work:', err);
      setError(err.response?.data?.message || 'Failed to approve work.');
    } finally {
      setIsSubmitting(false);
    }
  };





  const handleShowReviewOptions = (job) => {
    setSelectedJobForReview(job);
    handleViewJobDetails(job); // Show job details panel first
  };

  // Fetch client's jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);

      try {
        let params = {
          sortBy,
          sortOrder
        };
        
        if (searchQuery.trim()) {
          params.search = searchQuery;
        }
        
        const response = await axios.get(`${backendurl}/api/jobs/my/jobs`, {
          params,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        setJobs(response.data.data || []);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load your jobs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [sortBy, sortOrder, searchQuery]);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Filter jobs based on active tab
  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'all') return true;
    return job.status === activeTab;
  });

  // Get count for each status
  const getStatusCount = (status) => {
    return jobs.filter(job => job.status === status).length;
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by the useEffect hook via the searchQuery state
  };

  // Handle sort change
  const handleSortChange = (field) => {
    if (sortBy === field) {
      // Toggle order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for new sort field
      setSortBy(field);
      setSortOrder('desc');
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
      case 'revision_requested': return 'bg-orange-100 text-orange-800';
      case 'revision_in_progress': return 'bg-purple-100 text-purple-800';
      case 'revision_completed': return 'bg-indigo-100 text-indigo-800';
      case 'approved_by_client': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending Admin Review';
      case 'approved': return 'Approved - Deposit Required';
      case 'deposit_paid': return 'Awaiting Contributor';
      case 'in_progress': return 'In Progress';
      // case 'completed': return 'Completed - Final Payment Required';
      case 'final_paid': return 'Paid - Work Downloaded';
      case 'rejected': return 'Rejected';
      case 'completed': return 'Completed - Payment Required';
      case 'revision_requested': return 'Revision Requested';
      case 'revision_in_progress': return 'Revision In Progress';
      case 'revision_completed': return 'Revision Completed - Review Required';
      case 'approved_by_client': return 'Approved - Pay Final';
      default: return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // View job details
  const handleViewJobDetails = (job) => {
    setSelectedJob(job);
  };

  // Close job details panel
  const handleCloseJobDetails = () => {
    setSelectedJob(null);
  };


  const RevisionRequestModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const [feedback, setFeedback] = useState('');
    
    return isOpen ? (
      <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">Request Revision</h3>
            <p className="text-sm text-gray-500 mt-1">
              Please provide detailed feedback on what changes you need.
            </p>
          </div>
          
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows="6"
            placeholder="Describe the changes you need from the contributor..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required
          />
          
          <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSubmit(feedback)}
              disabled={!feedback.trim() || isSubmitting}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Request Revision'}
            </button>
          </div>
        </div>
      </div>
    ) : null;
  };

  // Calculate time remaining or overdue days
  const calculateTimeRemaining = (deadline) => {
    const deadlineDate = new Date(deadline);
    const currentDate = new Date();
    const diffTime = deadlineDate - currentDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return {
        text: `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`,
        isUrgent: diffDays <= 3,
        isOverdue: false
      };
    } else if (diffDays === 0) {
      return {
        text: 'Due today!',
        isUrgent: true,
        isOverdue: false
      };
    } else {
      return {
        text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`,
        isUrgent: true,
        isOverdue: true
      };
    }
  };

  // Render selected job details
  const renderJobDetails = () => {
    if (!selectedJob) return null;
    
    const timeRemaining = calculateTimeRemaining(selectedJob.deadline);
    
    const renderReviewActions = () => {
      if (!selectedJob || user.role !== 'client') return null;
      
      if (selectedJob.status === 'completed' || selectedJob.status === 'revision_completed') {
        return (
          <div className="mt-4 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Review Required</h3>
            <p className="text-xs text-blue-700 mb-3">
              Please review the submitted work and choose to either approve it or request revisions.
              {selectedJob.revisionsRemaining > 0 && (
                <span className="block mt-1">
                  You have <strong>{selectedJob.revisionsRemaining}</strong> revision{selectedJob.revisionsRemaining !== 1 ? 's' : ''} remaining.
                </span>
              )}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowApprovalModal(true)}
                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md flex items-center"
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Approve
              </button>
              
              {selectedJob.revisionsRemaining > 0 && (
                <button
                  onClick={() => setShowRevisionModal(true)}
                  className="px-3 py-1.5 text-xs border border-orange-300 text-orange-600 rounded-md flex items-center"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Request Revision
                </button>
              )}
            </div>
          </div>
        );
      }
      
      return null;
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6 mb-6"
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900">{selectedJob.title}</h2>
          <button 
            onClick={handleCloseJobDetails}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Job Progress Timeline */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-between">
              {['pending', 'approved', 'deposit_paid', 'in_progress', 'completed', 'final_paid'].map((status, index) => {
                const isActive = 
                  ['pending', 'approved', 'deposit_paid', 'in_progress', 'completed', 'final_paid'].indexOf(selectedJob.status) >= 
                  ['pending', 'approved', 'deposit_paid', 'in_progress', 'completed', 'final_paid'].indexOf(status);
                
                const isCurrent = selectedJob.status === status;
                
                return (
                  <div key={status} className="flex flex-col items-center">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                      isCurrent ? 'ring-4 ring-indigo-100 bg-indigo-600' : 
                      isActive ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}>
                      {isActive && <CheckCircle className="h-4 w-4 text-white" />}
                    </div>
                    <div className="mt-2 hidden md:block">
                      <span className={`text-xs ${isCurrent ? 'font-semibold text-indigo-600' : 'text-gray-500'}`}>
                        {index === 0 ? 'Submitted' :
                         index === 1 ? 'Approved' :
                         index === 2 ? 'Deposit Paid' :
                         index === 3 ? 'In Progress' :
                         index === 4 ? 'Completed' : 'Final Paid'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">{selectedJob.description}</p>
            
            <h3 className="text-sm font-medium text-gray-500 mt-4 mb-2">Category</h3>
            <div className="bg-indigo-100 text-indigo-800 inline-block px-3 py-1 rounded-full text-sm">
              {selectedJob.category}
            </div>
            
            {selectedJob.skills && selectedJob.skills.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills.map((skill, index) => (
                    <span 
                      key={index}
                      className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedJob.status)}`}>
              {getStatusLabel(selectedJob.status)}
            </div>
            
            <h3 className="text-sm font-medium text-gray-500 mt-4 mb-2">Timeline</h3>
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Posted:</span>
                <span>{new Date(selectedJob.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Deadline:</span>
                <span className={`${timeRemaining.isUrgent ? 'text-red-600 font-medium' : ''}`}>
                  {new Date(selectedJob.deadline).toLocaleDateString()} 
                  {timeRemaining.isUrgent && ` (${timeRemaining.text})`}
                </span>
              </div>
              {selectedJob.depositPaidAt && (
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Deposit Paid:</span>
                  <span>{new Date(selectedJob.depositPaidAt).toLocaleDateString()}</span>
                </div>
              )}
              {selectedJob.completedAt && (
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Completed:</span>
                  <span>{new Date(selectedJob.completedAt).toLocaleDateString()}</span>
                </div>
              )}
              {selectedJob.finalPaidAt && (
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Final Payment:</span>
                  <span>{new Date(selectedJob.finalPaidAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            <h3 className="text-sm font-medium text-gray-500 mt-4 mb-2">Price</h3>
            <div className="text-xl font-bold text-indigo-600">${selectedJob.price?.toFixed(2)}</div>
            {selectedJob.depositAmount && (
              <div className="text-sm text-gray-500 mt-1">
                <div className="flex justify-between">
                  <span>Deposit (50%):</span>
                  <span>${selectedJob.depositAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Final Payment:</span>
                  <span>${(selectedJob.price - selectedJob.depositAmount).toFixed(2)}</span>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <Link to={`/jobs/${selectedJob._id}`}>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700">
                  View Full Details
                </button>
              </Link>
              
              {selectedJob.status === 'approved' && (
                <Link to={`/jobs/${selectedJob._id}/accept`}>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700">
                    Pay Deposit
                  </button>
                </Link>
              )}
              
              {selectedJob.status === 'completed' && (
                <Link to={`/jobs/${selectedJob._id}/accept`}>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700">
                    Pay Remainder
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading && jobs.length === 0) {
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
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
            <p className="text-gray-600">Manage your job requests and track progress</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link to="/post-job">
              <motion.button 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg shadow-md font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Post a New Job
              </motion.button>
            </Link>
          </div>
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
        
        {/* Render selected job details if any */}
        {selectedJob && renderJobDetails()}
        
        {/* Stats Cards */}
        <motion.div variants={fadeInVariant} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Jobs</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{jobs.length}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-yellow-500">Pending</h3>
            <p className="mt-2 text-3xl font-bold text-yellow-700">{getStatusCount('pending')}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-blue-500">In Progress</h3>
            <p className="mt-2 text-3xl font-bold text-blue-700">{getStatusCount('in_progress')}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-green-500">Completed</h3>
            <p className="mt-2 text-3xl font-bold text-green-700">{
              getStatusCount('final_paid')
            }</p>
          </div>
        </motion.div>
        
        {/* Search and Filter */}
        <motion.div variants={fadeInVariant} className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-4">
            <form onSubmit={handleSearch} className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by job title, category, or description..."
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
                      onChange={(e) => setSortBy(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="createdAt">Post Date</option>
                      <option value="deadline">Deadline</option>
                      <option value="title">Job Title</option>
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
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Status Tabs */}
        <motion.div variants={fadeInVariant} className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto whitespace-nowrap py-2 px-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setActiveTab(option.value)}
                  className={`px-4 py-2 mx-1 text-center text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === option.value
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label} 
                  <span className="ml-1 text-xs rounded-full px-2 py-1 bg-gray-100">
                    {option.value === 'all' ? jobs.length : getStatusCount(option.value)}
                  </span>
                </button>
              ))}
            </nav>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredJobs.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No jobs found</h3>
                <p className="mt-1 text-gray-500">
                  {activeTab === 'all' 
                    ? searchQuery ? "No jobs match your search criteria" : "You haven't posted any jobs yet" 
                    : searchQuery ? "No jobs match your search criteria" : `You don't have any ${statusOptions.find(o => o.value === activeTab)?.label || activeTab} jobs`}
                </p>
                {activeTab === 'all' && !searchQuery && (
                  <div className="mt-6">
                    <Link to="/post-job">
                      <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                        Post your first job
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              filteredJobs.map(job => (
                <motion.div 
                  key={job._id}
                  className="p-6 hover:bg-gray-50 border-b border-gray-200 rounded-lg shadow-sm transition-all duration-200 bg-white mb-4"
                  whileHover={{ 
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    y: -2
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    {/* Left Side - Job Info */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 truncate">{job.title}</h3>
                        <span className={`ml-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {getStatusLabel(job.status)}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap items-center text-sm text-gray-600">
                        <div className="flex items-center mr-4 mb-2">
                          <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span>{job.category}</span>
                        </div>
                        <div className="flex items-center mr-4 mb-2">
                          <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Posted on {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        {job.price && (
                          <div className="flex items-center mb-2">
                            <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium text-indigo-600">${job.price.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Truncated description if available */}
                      {job.description && (
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                          {job.description.length > 150 ? job.description.substring(0, 150) + '...' : job.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Right Side - Actions */}
                    <div className="mt-4 md:mt-0 flex flex-col items-end space-y-3 min-w-max">
                      <div className="flex space-x-3">
                        <Link to={`/jobs/${job._id}`}>
                          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all">
                            View Details
                          </button>
                        </Link>

                        {/* Status-specific actions */}
                        {job.status === 'pending' && (
                          <button
                            onClick={() => handleDeleteJob(job._id)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm transition-all"
                          >
                            Delete
                          </button>
                        )}
                        
                        {job.status === 'approved' && (
                          <Link to={`/jobs/${job._id}/accept`}>
                            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm transition-all">
                              Pay Deposit
                            </button>
                          </Link>
                        )}
                        
                        {job.status === 'final_paid' && (
                          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition-all flex items-center">
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Files
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Job Completed Status Card - Only shown for completed jobs */}
                  {job.status === 'job_end' && (
                    <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-lg shadow-sm flex items-center">
                      <div className="mr-4 bg-green-100 rounded-full p-2">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-green-800">Job Successfully Completed</h3>
                        <p className="text-sm text-green-600 mt-1">This job has been finalized and marked as complete.</p>
                      </div>
                      <button className="ml-auto px-4 py-2 bg-white border border-green-300 text-green-700 rounded-md hover:bg-green-50 transition-colors duration-200 font-medium text-sm flex items-center">
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Job Finished
                      </button>
                    </div>
                  )}

                    {/* Revision feedback form - Shown when client clicks "Yes" for revision */}
                    {showRevisionFeedbackMap[job._id] && (
                      <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
                        <div className="flex items-center mb-3">
                          <svg className="h-5 w-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <p className="text-md font-medium text-amber-800">Revision Request</p>
                        </div>
                        
                        <p className="mb-3 text-sm text-amber-700">
                          Please provide detailed feedback about what needs to be revised:
                        </p>
                        
                        <textarea
                          value={revisionFeedbackMap[job._id] || ""}
                          onChange={(e) => handleRevisionFeedbackChange(job._id, e.target.value)}
                          placeholder="Describe what changes you need..."
                          className="w-full px-3 py-2 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                          rows={4}
                        />
                        
                        <div className="mt-4 flex justify-end gap-3">
                          <button
                            onClick={() => setShowRevisionFeedbackMap(prev => ({ ...prev, [job._id]: false }))}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSubmitRevisionFeedback(job._id)}
                            disabled={!revisionFeedbackMap[job._id] || submittingRevision[job._id]}
                            className={`px-4 py-2 rounded-md text-sm font-medium text-white shadow-sm flex items-center ${
                              !revisionFeedbackMap[job._id] || submittingRevision[job._id]
                                ? 'bg-amber-400 cursor-not-allowed'
                                : 'bg-amber-500 hover:bg-amber-600'
                            }`}
                          >
                            {submittingRevision[job._id] ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Submit Revision Request
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  {job.status === 'revision_in_progress' && (
                    <div className="mt-6 p-5 bg-purple-50 border border-purple-200 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <div className="mr-4 bg-purple-100 rounded-full p-2">
                          <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-purple-800">Revision In Progress</h3>
                          <p className="text-sm text-purple-600 mt-1">
                            Your revision request has been submitted and is being processed by the contributor.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Revision buttons - Only shown for jobs that need revision decision */}
                  {!showRevisionFeedbackMap[job._id] && job.status === 'final_paid' && job.status !== 'job_end' && (
                    <div className="mt-6 p-5 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
                      <div className="flex items-center mb-3">
                        <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-md font-medium text-blue-800">Need Revision?</p>
                      </div>
                      <p className="mb-4 text-sm text-blue-600">
                        If you're satisfied with the final deliverable, click "No" to complete the job. 
                        Otherwise, click "Yes" to request revisions.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleNoClick(job._id)}
                          className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md shadow transition flex items-center justify-center gap-2"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>No, Complete Job</span>
                        </button>
                        <button
                          onClick={() => handleYesClick(job._id)}
                          className="flex-1 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md shadow transition flex items-center justify-center gap-2"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Yes, Need Revisions</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <RevisionRequestModal 
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        onSubmit={handleRequestRevision}
        isSubmitting={isSubmitting}
        revisionsRemaining={selectedJobForReview?.revisionsRemaining || 0}
      />

      <ApprovalModal 
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onSubmit={handleApproveWork}
        isSubmitting={isSubmitting}
      />
    </motion.div>
  );
};

export default ClientDashboardPage;