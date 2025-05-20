import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Backendurl } from '../../App';
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Upload,
  File,
  X,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Download
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


// Remove file upload state and handlers
const AdminJobDeliveryPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    // Make sure user is admin, otherwise redirect
    useEffect(() => {
      if (user && user.role !== 'admin') {
        navigate('/dashboard');
      }
    }, [user, navigate]);
  
    // Fetch job details
    useEffect(() => {
      const fetchJobDetails = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`${Backendurl}/api/jobs/${id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          setJob(response.data.data);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching job details:', err);
          setError('Failed to load job details. Please try again later.');
          setLoading(false);
        }
      };
      
      fetchJobDetails();
    }, [id]);
  
    // Update the render function to show job monitoring information
    return (
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="bg-gray-50 min-h-screen py-6"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            variants={fadeInVariant} 
            className="flex items-center justify-between mb-6"
          >
            <div>
              <Link to="/admin/jobs/manage" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Job Management
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">Job Progress Monitoring</h1>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(job?.status || 'pending')}`}>
              {formatStatus(job?.status || 'pending')}
            </span>
          </motion.div>
  
          {/* Job Details Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <motion.div 
              variants={fadeInVariant} 
              className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="bg-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Job Details</h2>
              </div>
              <div className="p-6">
                {/* Job details content */}
                {job && (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{job.title}</h3>
                    
                    <div className="mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Client</h4>
                          <p className="text-base font-medium text-gray-900">{job.client?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-600">{job.client?.email || 'No email'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Price</h4>
                          <p className="text-lg font-bold text-indigo-600">${job.price?.toFixed(2) || '0.00'}</p>
                          {job.depositPaidAt && (
                            <p className="text-sm text-green-600">
                              Deposit paid on {new Date(job.depositPaidAt).toLocaleDateString()}
                            </p>
                          )}
                          {job.finalPaidAt && (
                            <p className="text-sm text-green-600">
                              Final payment on {new Date(job.finalPaidAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Deadline</h4>
                        <p className="text-base font-medium text-gray-900">
                          {new Date(job.deadline).toLocaleDateString()}
                        </p>
                        <div className="text-sm text-gray-600 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Posted: {new Date(job.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Category</h4>
                        <p className="text-base font-medium text-gray-900">{job.category}</p>
                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {job.skills.map((skill, index) => (
                              <span 
                                key={index}
                                className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {job.adminFeedback && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Admin Notes</h4>
                        <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                          <p className="text-sm text-gray-700">{job.adminFeedback}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
            
            {/* Job Progress Card */}
            <motion.div 
              variants={fadeInVariant} 
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              <div className="bg-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">Job Progress</h2>
              </div>
              <div className="p-6">
                {job && (
                  <>
                    {/* Job Status Timeline */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-4">Status Timeline</h4>
                      <ol className="relative border-l border-gray-200">
                        <li className="mb-6 ml-6">
                          <span className={`absolute flex items-center justify-center w-6 h-6 ${job.createdAt ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'} rounded-full -left-3 ring-8 ring-white`}>
                            1
                          </span>
                          <h3 className="font-medium">Job Submitted</h3>
                          {job.createdAt && (
                            <p className="text-sm text-gray-500">{new Date(job.createdAt).toLocaleDateString()}</p>
                          )}
                        </li>
                        <li className="mb-6 ml-6">
                          <span className={`absolute flex items-center justify-center w-6 h-6 ${job.status !== 'pending' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'} rounded-full -left-3 ring-8 ring-white`}>
                            2
                          </span>
                          <h3 className="font-medium">Admin Approval & Pricing</h3>
                          <p className="text-sm text-gray-500">
                            {job.status === 'pending' 
                              ? 'Pending' 
                              : 'Complete' + (job.price ? ` - $${job.price.toFixed(2)}` : '')}
                          </p>
                        </li>
                        <li className="mb-6 ml-6">
                          <span className={`absolute flex items-center justify-center w-6 h-6 ${job.depositPaidAt ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'} rounded-full -left-3 ring-8 ring-white`}>
                            3
                          </span>
                          <h3 className="font-medium">Client Deposit Payment</h3>
                          <p className="text-sm text-gray-500">
                            {job.depositPaidAt 
                              ? `Paid on ${new Date(job.depositPaidAt).toLocaleDateString()}` 
                              : (job.status === 'approved' ? 'Pending payment' : 'Not yet')}
                          </p>
                        </li>
                        <li className="mb-6 ml-6">
                          <span className={`absolute flex items-center justify-center w-6 h-6 ${job.freelancer ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'} rounded-full -left-3 ring-8 ring-white`}>
                            4
                          </span>
                          <h3 className="font-medium">Contributor Assigned</h3>
                          <p className="text-sm text-gray-500">
                            {job.freelancer ? 'Assigned' : 'Waiting for contributor'}
                          </p>
                        </li>
                        <li className="mb-6 ml-6">
                          <span className={`absolute flex items-center justify-center w-6 h-6 ${job.status === 'completed' || job.status === 'final_paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'} rounded-full -left-3 ring-8 ring-white`}>
                            5
                          </span>
                          <h3 className="font-medium">Work Completed</h3>
                          <p className="text-sm text-gray-500">
                            {job.status === 'completed' || job.status === 'final_paid'
                              ? `Completed ${job.completedAt ? `on ${new Date(job.completedAt).toLocaleDateString()}` : ''}`
                              : (job.status === 'in_progress' ? 'In progress' : 'Not started')}
                          </p>
                        </li>
                        <li className="ml-6">
                          <span className={`absolute flex items-center justify-center w-6 h-6 ${job.finalPaidAt ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'} rounded-full -left-3 ring-8 ring-white`}>
                            6
                          </span>
                          <h3 className="font-medium">Final Payment</h3>
                        <p className="text-sm text-gray-500">
                          {job.finalPaidAt 
                            ? `Paid on ${new Date(job.finalPaidAt).toLocaleDateString()}` 
                            : (job.status === 'completed' ? 'Awaiting payment' : 'Not yet')}
                        </p>
                      </li>
                    </ol>
                  </div>
                  
                  {/* Payment Status */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Payment Status</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Deposit (50%)</span>
                        {job.depositPaidAt ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Final Payment</span>
                        {job.finalPaidAt ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            {job.status === 'completed' ? 'Awaiting Payment' : 'Not Ready'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Current Deliverables (View Only - No Upload) */}
                  {job.deliverables && job.deliverables.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Contributor Deliverables</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <ul className="space-y-2">
                          {job.deliverables.map((file, index) => (
                            <li key={index} className="flex items-center justify-between">
                              <div className="flex items-center overflow-hidden">
                                <File className="h-4 w-4 mr-2 flex-shrink-0 text-indigo-500" />
                                <span className="text-sm text-gray-900 truncate">{file.name}</span>
                              </div>
                              <div className="flex items-center ml-2">
                                {file.isWatermarked && (
                                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full mr-2">
                                    Watermarked
                                  </span>
                                )}
                                <a 
                                  href={file.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-indigo-600 hover:text-indigo-800"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {/* Admin Action Notes Section */}
                  {job.status === 'pending' && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-700">
                        <AlertCircle className="h-4 w-4 inline-block mr-1" />
                        This job is awaiting your review. Please go to the job review page to set a price.
                      </p>
                      <div className="mt-3">
                        <Link to={`/admin/jobs/review`} className="text-sm text-indigo-600 hover:text-indigo-800">
                          Go to Job Review Page
                        </Link>
                      </div>
                    </div>
                  )}
                  
                  {job.status === 'approved' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <AlertCircle className="h-4 w-4 inline-block mr-1" />
                        Job is approved. Waiting for client to make deposit payment.
                      </p>
                    </div>
                  )}
                  
                  {job.status === 'deposit_paid' && !job.freelancer && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-700">
                        <CheckCircle className="h-4 w-4 inline-block mr-1" />
                        Deposit paid. Job is now available for contributors to select.
                      </p>
                    </div>
                  )}
                  
                  {job.status === 'in_progress' && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-700">
                        <Clock className="h-4 w-4 inline-block mr-1" />
                        Work is in progress. The contributor is working on this job.
                      </p>
                    </div>
                  )}
                  
                  {job.status === 'completed' && (
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-sm text-indigo-700">
                        <CheckCircle className="h-4 w-4 inline-block mr-1" />
                        Work completed. Waiting for client to make final payment.
                      </p>
                    </div>
                  )}
                  
                  {job.status === 'final_paid' && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-700">
                        <CheckCircle className="h-4 w-4 inline-block mr-1" />
                        Job completed and fully paid. All files are available to the client.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminJobDeliveryPage;