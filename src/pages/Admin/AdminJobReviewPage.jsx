import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Backendurl } from '../../App';
import { AlertCircle, CheckCircle } from 'lucide-react';

const AdminJobReviewPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingJobs, setPendingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [reviewData, setReviewData] = useState({
    status: 'approved',
    price: '',
    adminFeedback: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Make sure user is admin, otherwise redirect
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch pending jobs
  const fetchPendingJobs = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${Backendurl}/api/jobs/admin/pending?page=${page}&limit=10`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setPendingJobs(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(response.data.currentPage || 1);
    } catch (err) {
      console.error('Error fetching pending jobs:', err);
      setError('Failed to load pending jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    setReviewData({
      status: 'approved',
      price: '',
      adminFeedback: ''
    });
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: name === 'price' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!selectedJob) return;
    
    // Validate price if approving
    if (reviewData.status === 'approved' && (!reviewData.price || reviewData.price <= 0)) {
      setSubmitError('Please enter a valid price for the job');
      return;
    }
    
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      const response = await axios.put(
        `${Backendurl}/api/jobs/${selectedJob._id}/review`, 
        reviewData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setSubmitSuccess(true);
      
      // Update job list
      setPendingJobs(prev => prev.filter(job => job._id !== selectedJob._id));
      
      // Clear selected job after a delay
      setTimeout(() => {
        setSelectedJob(null);
        setSubmitSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitError(
        err.response?.data?.message || 
        'An error occurred while submitting the review. Please try again.'
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchPendingJobs(newPage);
    }
  };

  if (loading && pendingJobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Job Review</h1>
          <p className="text-gray-600">Review pending job requests and set prices</p>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-lg overflow-hidden h-fit">
            <div className="bg-indigo-600 px-4 py-4">
              <h2 className="text-lg font-semibold text-white">Pending Jobs ({pendingJobs.length})</h2>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-[calc(100vh-220px)] overflow-y-auto">
              {pendingJobs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No pending jobs to review
                </div>
              ) : (
                pendingJobs.map(job => (
                  <div 
                    key={job._id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedJob?._id === job._id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                    onClick={() => handleJobSelect(job)}
                  >
                    <h3 className="font-medium text-gray-900 truncate">{job.title}</h3>
                    <p className="text-sm text-gray-500">
                      By: {job.client?.name || 'Unknown Client'}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span className="mr-2">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        {job.category}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Job Details & Review Form */}
          <div className="lg:col-span-2">
            {selectedJob ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-indigo-600 px-6 py-4">
                  <h2 className="text-lg font-semibold text-white">Job Details</h2>
                </div>
                
                <div className="p-6">
                  {submitSuccess && (
                    <div className="bg-green-50 p-4 rounded-lg mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            Job has been {reviewData.status === 'approved' ? 'approved' : 'rejected'} successfully!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {submitError && (
                    <div className="bg-red-50 p-4 rounded-lg mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">{submitError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedJob.title}</h3>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {selectedJob.category}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Deadline: {new Date(selectedJob.deadline).toLocaleDateString()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Posted: {new Date(selectedJob.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-700 whitespace-pre-line">{selectedJob.description}</p>
                    </div>
                    
                    {selectedJob.skills && selectedJob.skills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.skills.map((skill, index) => (
                            <span 
                              key={index} 
                              className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Client Information</h4>
                      <p className="text-gray-700">
                        <span className="font-semibold">Name:</span> {selectedJob.client?.name || 'Unknown'}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">Email:</span> {selectedJob.client?.email || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmitReview}>
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Job Review & Pricing</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Decision
                          </label>
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center">
                              <input
                                id="approved"
                                name="status"
                                type="radio"
                                value="approved"
                                checked={reviewData.status === 'approved'}
                                onChange={handleReviewChange}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              />
                              <label htmlFor="approved" className="ml-2 block text-sm text-gray-700">
                                Approve
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                id="rejected"
                                name="status"
                                type="radio"
                                value="rejected"
                                checked={reviewData.status === 'rejected'}
                                onChange={handleReviewChange}
                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                              />
                              <label htmlFor="rejected" className="ml-2 block text-sm text-gray-700">
                                Reject
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        {reviewData.status === 'approved' && (
                          <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                              Set Job Price ($)*
                            </label>
                            <input
                              type="number"
                              id="price"
                              name="price"
                              value={reviewData.price}
                              onChange={handleReviewChange}
                              min="0"
                              step="0.01"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter price in USD"
                              required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Client will pay 50% as deposit and 50% on completion.
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <label htmlFor="adminFeedback" className="block text-sm font-medium text-gray-700 mb-1">
                            Feedback {reviewData.status === 'rejected' && '(Required)'}
                          </label>
                          <textarea
                            id="adminFeedback"
                            name="adminFeedback"
                            value={reviewData.adminFeedback}
                            onChange={handleReviewChange}
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder={reviewData.status === 'approved' 
                              ? "Optional message to the client about pricing" 
                              : "Explain why the job was rejected"}
                            required={reviewData.status === 'rejected'}
                          ></textarea>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className={`px-6 py-3 rounded-lg font-medium shadow-md ${
                              reviewData.status === 'approved'
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            } ${submitLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={submitLoading}
                          >
                            {submitLoading ? (
                              <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Submitting...
                              </div>
                            ) : (
                              reviewData.status === 'approved' ? 'Approve & Set Price' : 'Reject Job'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex items-center justify-center p-12">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Select a job to review</h3>
                  <p className="mt-1 text-gray-500">
                    Choose a job from the list to review details and set pricing
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminJobReviewPage;