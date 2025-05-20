import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { backendurl } from '../../App';
import { 
  AlertCircle, 
  Check, 
  DollarSign, 
  Clock, 
  ChevronDown, 
  Search,
  Calendar,
  Filter,
  User,
  FileText
} from 'lucide-react';

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

const AdminJobManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Status options for filtering
  // In AdminJobManagementPage.jsx
// Update the status options to reflect the new workflow
const statusOptions = [
    { value: 'all', label: 'All Jobs' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'approved', label: 'Approved (Awaiting Payment)' },
    { value: 'deposit_paid', label: 'Deposit Paid (Available for Contributors)' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed (Awaiting Final Payment)' },
    { value: 'final_paid', label: 'Final Paid (Completed)' },
  ];

  // Make sure user is admin, otherwise redirect
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch jobs based on filters
  const fetchJobs = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = `${backendurl}/api/jobs/admin/jobs`;
      let params = {
        page,
        limit: 10,
        sortBy,
        sortOrder
      };

      // Add status filter if not 'all'
      if (activeTab !== 'all') {
        params.status = activeTab;
      }

      // Add search query if exists
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await axios.get(endpoint, {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setJobs(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(response.data.currentPage || 1);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when filters change
  useEffect(() => {
    fetchJobs();
  }, [activeTab, sortBy, sortOrder]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs(1); // Reset to first page when searching
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchJobs(newPage);
    }
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

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'deposit_paid':
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-orange-100 text-orange-800';
      case 'final_paid':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved (Awaiting Payment)';
      case 'deposit_paid':
        return 'Deposit Paid (Available)';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed (Awaiting Final Payment)';
      case 'final_paid':
        return 'Final Paid (Completed)';
      case 'rejected':
        return 'Rejected';
      default:
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Get the next action based on job status
  const getNextAction = (job) => {
    switch (job.status) {
      case 'pending':
        return (
          <Link to={`/admin/jobs/review/${job._id}`}>
            <button className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700">
              Review & Price
            </button>
          </Link>
        );
      case 'approved':
        return 'Awaiting client deposit payment';
      case 'deposit_paid':
        return 'Awaiting contributor selection';
      case 'in_progress':
        return 'Work in progress';
      case 'completed':
        return 'Awaiting client final payment';
      case 'final_paid':
        return 'Job completed';
      default:
        return (
          <Link to={`/admin/jobs/${job._id}`}>
            <button className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              View Details
            </button>
          </Link>
        );
    }
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
      className="bg-gray-50 min-h-screen py-6"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div variants={fadeInVariant} className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Job Management</h1>
          <p className="text-gray-600">Manage and track jobs in various stages</p>
        </motion.div>

        {error && (
          <motion.div 
            variants={fadeInVariant}
            className="bg-red-50 p-4 rounded-lg mb-6"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Search and Filter Bar */}
        <motion.div 
          variants={fadeInVariant} 
          className="bg-white rounded-xl shadow-lg overflow-hidden mb-6"
        >
          <div className="p-4">
            <form onSubmit={handleSearch} className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by job title, client name, or job ID..."
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Search
              </button>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                      Sort By
                    </label>
                    <select
                      id="sortBy"
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setSortOrder('desc'); // Reset to desc when changing sort field
                      }}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                      <option value="createdAt">Created Date</option>
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
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status Filter
                    </label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setActiveTab(option.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            activeTab === option.value 
                              ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Jobs Table */}
        <motion.div 
          variants={fadeInVariant} 
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('title')}
                  >
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      Job Title
                      {sortBy === 'title' && (
                        <ChevronDown 
                          className={`ml-1 h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`}
                        />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('client')}
                  >
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Client
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('price')}
                  >
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Price
                      {sortBy === 'price' && (
                        <ChevronDown 
                          className={`ml-1 h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`}
                        />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('deadline')}
                  >
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Deadline
                      {sortBy === 'deadline' && (
                        <ChevronDown 
                          className={`ml-1 h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`}
                        />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      Status
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex items-center">
                      Action
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Search className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-lg font-medium text-gray-900 mb-1">No jobs found</p>
                        <p className="text-gray-500">
                          {activeTab !== 'all' 
                            ? `No jobs with ${formatStatus(activeTab)} status` 
                            : searchQuery ? 'Try a different search term' : 'No jobs available to manage'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {job.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {job._id.substring(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {job.client?.name || 'Unknown Client'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {job.client?.email || 'No email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          ${job.price?.toFixed(2) || '0.00'}
                        </div>
                        {job.depositPaidAt && (
                          <div className="text-xs text-green-600 flex items-center">
                            <Check className="h-3 w-3 mr-1" />
                            Deposit paid
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(job.deadline).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(job.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(job.status)}`}>
                          {formatStatus(job.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getNextAction(job)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md 
                    ${currentPage === 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md 
                    ${currentPage === totalPages 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{jobs.length > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> to <span className="font-medium">{Math.min(currentPage * 10, jobs.length)}</span> of{' '}
                    <span className="font-medium">{jobs.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium
                        ${currentPage === 1 
                          ? 'border-gray-300 bg-white text-gray-300 cursor-not-allowed' 
                          : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronDown className="h-5 w-5 transform rotate-90" />
                    </button>
                    
                    {/* Page Numbers */}
                    {[...Array(totalPages).keys()].map((page) => (
                      <button
                        key={page + 1}
                        onClick={() => handlePageChange(page + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                          ${currentPage === page + 1
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' 
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                      >
                        {page + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium
                        ${currentPage === totalPages 
                          ? 'border-gray-300 bg-white text-gray-300 cursor-not-allowed' 
                          : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronDown className="h-5 w-5 transform -rotate-90" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminJobManagementPage;