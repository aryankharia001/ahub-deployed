import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Briefcase, 
  Calendar, 
  Tag, 
  User, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Paperclip,
  Eye,
  Download,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { backendurl } from '../App';
import { useAuth } from '../contexts/AuthContext';

import { ThumbsUp, RotateCcw } from 'lucide-react';
import RevisionHistoryPanel from '../components/RevisionHistoryPanel';
import RevisionRequestModal from '../components/RevisonRequestModal';
import ApprovalModal from '../components/ApprovalModal';
import JobStatusWithRevisions from '../components/JobStatusWithRevisions';

const JobDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  

  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);








  const handleRequestRevision = async (feedback) => {
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(
        `${backendurl}/api/jobs/${id}/client-review`,
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
      setJob(response.data.data);
    } catch (err) {
      console.error('Error requesting revision:', err);
      setError(err.response?.data?.message || 'Failed to submit revision request.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleApproveWork = async (feedback) => {
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(
        `${backendurl}/api/jobs/${id}/client-review`,
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
      setJob(response.data.data);
    } catch (err) {
      console.error('Error approving work:', err);
      setError(err.response?.data?.message || 'Failed to approve work.');
    } finally {
      setIsSubmitting(false);
    }
  };




  const renderClientReviewOptions = () => {
    if (!job || user.role !== 'client' || job.client._id !== user._id) return null;
    
    if (job.status === 'completed' || job.status === 'revision_completed') {
      return (
        <div className="mt-4 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Review Submission</h3>
          <p className="text-sm text-blue-700 mb-3">
            Please review the submitted work and choose to either approve it or request revisions.
            {job.revisionsRemaining > 0 && (
              <span className="block mt-1">
                You have <strong>{job.revisionsRemaining}</strong> revision{job.revisionsRemaining !== 1 ? 's' : ''} remaining for this job.
              </span>
            )}
            {job.revisionsRemaining <= 0 && (
              <span className="block mt-1 text-orange-700">
                You have no revisions remaining for this job.
              </span>
            )}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowApprovalModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <ThumbsUp className="mr-1 h-4 w-4" />
              Approve Work
            </button>
            
            {job.revisionsRemaining > 0 && (
              <button
                onClick={() => setShowRevisionModal(true)}
                className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <RotateCcw className="mr-1 h-4 w-4" />
                Request Revision
              </button>
            )}
          </div>
        </div>
      );
    }
    
    return null;
  };


  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${backendurl}/api/jobs/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setJob(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load job details. Please try again later.');
        setLoading(false);
        console.error('Error fetching job details:', err);
      }
    };
    
    fetchJobDetails();
  }, [id]);

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      deposit_paid: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-orange-100 text-orange-800',
      final_paid: 'bg-green-100 text-green-800',
      revision_requested: 'bg-orange-100 text-orange-800',
      revision_in_progress: 'bg-purple-100 text-purple-800',
      revision_completed: 'bg-indigo-100 text-indigo-800',
      approved_by_client: 'bg-green-100 text-green-800',
    };
    
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDeadline = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const isDeadlineNear = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 3 && diffDays > 0;
  };

  // Helper function to format status text safely
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved (Awaiting Payment)';
      case 'rejected':
        return 'Rejected';
      case 'deposit_paid':
        return 'Deposit Paid';
      case 'in_progress':
        return 'In Progress';
      // case 'completed':
      //   return 'Completed';
      case 'delivered':
        return 'Delivered (Awaiting Final Payment)';
      case 'final_paid':
        return 'Completed (Final Payment Made)';
      case 'completed':
        return 'Completed (Review Required)';
      case 'revision_requested':
        return 'Revision Requested';
      case 'revision_in_progress':
        return 'Revision In Progress';
      case 'revision_completed':
        return 'Revision Completed (Review Required)';
      case 'approved_by_client':
        return 'Approved (Awaiting Final Payment)';
      default:
        return status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1);
    }
  };

  // Determine if user can see deliverables based on role and job status
  const canAccessDeliverables = () => {
    if (!job || !user) return false;
    
    // Admin can always access deliverables
    if (user.role === 'admin') return true;
    
    // Contributor can always access if they are the freelancer
    if (user.role === 'contributor' && job.freelancer && job.freelancer._id === user._id) return true;
    
    // Client can access watermarked previews if job is completed or in revision, or full files if final_paid
    if (user.role === 'client' && job.client && job.client._id === user._id) {
      return ['completed', 'revision_requested', 'revision_in_progress', 'revision_completed', 'approved_by_client', 'final_paid'].includes(job.status);
    }
    
    return false;
  };

  // Helper function to get file icon based on type
  const getFileIcon = (type) => {
    if (!type) return <FileText className="h-5 w-5 text-gray-400" />;
    
    if (type.startsWith('image/')) {
      return <Eye className="h-5 w-5 text-blue-500" />;
    } else if (type.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (type.includes('word')) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    } else if (type.includes('excel') || type.includes('spreadsheet')) {
      return <FileText className="h-5 w-5 text-green-500" />;
    } else if (type.includes('zip') || type.includes('compressed')) {
      return <FileText className="h-5 w-5 text-yellow-500" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  // Render payment button based on job status
  const renderPaymentButton = () => {
    if (!job || user.role !== 'client' || job.client._id !== user._id) return null;
    
    if (job.status === 'approved') {
      return (
        <Link 
          to={`/jobs/${job._id}/accept`} 
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <DollarSign className="mr-1 h-4 w-4" />
          Pay Deposit & Start
        </Link>
      );
    } else if (job.status === 'completed') {
      return (
        <Link 
          to={`/jobs/${job._id}/accept`} 
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <DollarSign className="mr-1 h-4 w-4" />
          Complete Final Payment
        </Link>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p className="font-bold">Job Not Found</p>
          <p>The requested job doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link to="/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header Section */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <span 
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(job.status)}`}
              >
                {formatStatus(job.status)}
              </span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Calendar className="mr-1 h-4 w-4" />
              {job.deadline ? (
                <span className={isDeadlineNear(job.deadline) ? 'text-red-500 font-medium' : ''}>
                  Deadline: {formatDeadline(job.deadline)}
                  {isDeadlineNear(job.deadline) && ' (Approaching soon)'}
                </span>
              ) : (
                <span>No deadline specified</span>
              )}
            </div>
          </div>

          {/* Job Details */}
          <div className="px-6 py-4">
            {/* Job Progress Timeline */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-3">Job Progress</h2>
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-between">
                  {['pending', 'approved', 'deposit_paid', 'in_progress', 'completed', 'final_paid'].map((status, index) => {
                    const isActive = 
                      ['pending', 'approved', 'deposit_paid', 'in_progress', 'completed', 'final_paid', 'job_end'].indexOf(job.status) >= 
                      ['pending', 'approved', 'deposit_paid', 'in_progress', 'completed', 'final_paid', 'job_end'].indexOf(status);
                    
                    const isCurrent = job.status === status;
                    
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
            
            {/* Category and Skills */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Briefcase className="mr-2 h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Category</h2>
              </div>
              <div className="ml-7">
                <span className="inline-flex items-center bg-blue-50 text-blue-700 rounded-md px-2 py-1 text-sm">
                  {job.category || 'Uncategorized'}
                </span>
              </div>
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Tag className="mr-2 h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Skills Required</h2>
                </div>
                <div className="ml-7 flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center bg-gray-100 text-gray-800 rounded-md px-2 py-1 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            {job.price !== undefined && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <DollarSign className="mr-2 h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Budget</h2>
                </div>
                <div className="ml-7">
                  <span className="text-lg font-medium text-green-600">${job.price.toFixed(2)}</span>
                  {job.depositAmount && (
                    <div className="text-sm text-gray-600 mt-1">
                      <div>Deposit (50%): ${job.depositAmount.toFixed(2)}</div>
                      <div>Final Payment: ${(job.price - job.depositAmount).toFixed(2)}</div>
                    </div>
                  )}
                  {job.depositPaidAt && (
                    <div className="flex items-center mt-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Deposit paid on {new Date(job.depositPaidAt).toLocaleDateString()}
                    </div>
                  )}
                  {job.finalPaidAt && (
                    <div className="flex items-center mt-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Final payment made on {new Date(job.finalPaidAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Client or Freelancer */}
            {job.client && user.role !== 'client' && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <User className="mr-2 h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Client</h2>
                </div>
                <div className="ml-7">
                  <span className="text-blue-600">
                    {job.client.name || `Client #${job.client._id.substring(0, 8)}`}
                  </span>
                </div>
              </div>
            )}
            
            {job.freelancer && (user.role === 'admin' || (user.role === 'client' && job.client._id === user._id)) && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <User className="mr-2 h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Contributor</h2>
                </div>
                <div className="ml-7">
                  <span className="text-blue-600">
                    {job.freelancer.name || `Contributor #${job.freelancer._id.substring(0, 8)}`}
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <FileText className="mr-2 h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900">Description</h2>
              </div>
              <div className="ml-7 prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{job.description || 'No description provided'}</p>
              </div>
            </div>

            {/* Attachments (if any) */}
            {job.attachments && job.attachments.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Paperclip className="mr-2 h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Attachments</h2>
                </div>
                <div className="ml-7">
                  <ul className="divide-y divide-gray-200">
                    {job.attachments.map((attachment, index) => (
                      <li key={index} className="py-2">
                        <a 
                          href={attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <span className="mr-2">{attachment.name}</span>
                          <span className="text-xs text-gray-500">({attachment.type})</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}


            {job.revisions && job.revisions.length > 0 && (
              <div className="mb-6">
                <RevisionHistoryPanel revisions={job.revisions} jobId={job._id} />
              </div>
            )}


            {renderClientReviewOptions()}

            {/* Deliverables Section */}
            {job.deliverables && job.deliverables.length > 0 && canAccessDeliverables() && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Download className="mr-2 h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Deliverables</h2>
                </div>
                <div className="ml-7">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-blue-800">
                        {user.role === 'client' && job.status === 'completed' 
                          ? 'Files Available Upon Final Payment'
                          : job.status === 'final_paid'
                            ? 'Final Deliverables' 
                            : 'Files'}
                      </h3>
                      {user.role === 'client' && job.status === 'completed' && (
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-orange-500 mr-1" />
                          <span className="text-xs text-orange-700">
                            Preview only - Final payment required to download
                          </span>
                        </div>
                      )}
                      {job.status === 'final_paid' && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-xs text-green-700">
                            Full access - Payment complete
                          </span>
                        </div>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {job.deliverables.map((file, index) => (
                        <li key={index} className="bg-white p-3 rounded-lg shadow-sm border border-blue-100 flex items-center justify-between">
                          <div className="flex items-center mr-2 overflow-hidden">
                            {getFileIcon(file.type)}
                            <div className="ml-2 overflow-hidden">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {file.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {file.type}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {user.role === 'client' && job.status === 'completed' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                <Lock className="h-3 w-3 mr-1" />
                                Payment Required
                              </span>
                            ) : (
                              <a 
                                href={file.url} 
                                download
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    
                    {user.role === 'client' && job.status === 'completed' && (
                      <div className="mt-4">
                        <div className="bg-white p-3 rounded-lg border border-orange-200">
                          <p className="text-sm text-gray-700 mb-3">
                            The contributor has completed this job and uploaded files for you. Please complete the final payment to unlock the files.
                          </p>
                          <div className="text-right">
                            <Link
                              to={`/jobs/${job._id}/accept`}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Make Final Payment
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {job.freelancerNote && (
                      <div className="mt-4 bg-indigo-50 p-3 rounded-lg">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-indigo-800">Note from the contributor:</h4>
                            <p className="text-sm text-indigo-700 mt-1">{job.freelancerNote}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Admin Feedback */}
            {job.adminFeedback && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <AlertCircle className="mr-2 h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Admin Feedback</h2>
                </div>
                <div className="ml-7 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-gray-700">{job.adminFeedback}</p>
                </div>
              </div>
            )}

            {/* Created At */}
            {job.createdAt && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Clock className="mr-2 h-5 w-5 text-gray-400" />
                  <h2 className="text-lg font-medium text-gray-900">Posted</h2>
                </div>
                <div className="ml-7">
                  <time dateTime={job.createdAt}>{new Date(job.createdAt).toLocaleDateString()}</time>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex justify-end space-x-3">
              <Link 
                to="/dashboard" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Dashboard
              </Link>
              
              {/* Render payment button if needed */}
              {renderPaymentButton()}
              
              {/* If admin, show link to admin management page */}
              {user.role === 'admin' && (
                <Link 
                  to={`/admin/jobs/${job._id}/manage`} 
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Manage Job
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <RevisionRequestModal 
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        onSubmit={handleRequestRevision}
        isSubmitting={isSubmitting}
        revisionsRemaining={job?.revisionsRemaining || 0}
      />

      <ApprovalModal 
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onSubmit={handleApproveWork}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default JobDetailPage;