import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Backendurl } from '../App';
import { 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Lock,
  Download,
  CreditCard,
  ArrowLeft
} from 'lucide-react';

const JobPaymentPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentType, setPaymentType] = useState(null);
  const [amount, setAmount] = useState(0);
  const [paymentError, setPaymentError] = useState(null);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    // Load Razorpay script
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          resolve(true);
        };
        script.onerror = () => {
          resolve(false);
          console.error('Razorpay SDK failed to load');
        };
        document.body.appendChild(script);
      });
    };
    
    loadRazorpayScript();
    
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${Backendurl}/api/jobs/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setJob(response.data.data);
        
        // Automatically determine payment type based on job status
        let type;
        if (response.data.data.status === 'approved') {
          type = 'deposit';
        } else if (response.data.data.status === 'completed' || 
                   response.data.data.status === 'revision_completed' || 
                   response.data.data.status === 'approved_by_client') {
          type = 'final';
        } else {
          setError('This job is not currently eligible for payment.');
        }
        
        // Calculate appropriate payment amount
        if (type === 'deposit') {
          setAmount(response.data.data.price / 2); // 50% deposit
        } else if (type === 'final') {
          setAmount(response.data.data.price / 2); // Remaining 50%
        }
        
        setPaymentType(type);
        
        // Verify job belongs to the logged-in client
        if (response.data.data.client._id !== user._id) {
          setError('You are not authorized to make payments for this job.');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Failed to load job details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchJobDetails();
  }, [id, user._id]);

  const createRazorpayOrder = async () => {
    try {
      setIsProcessing(true);
      setPaymentError(null);
      
      const endpoint = paymentType === 'deposit' 
        ? `${Backendurl}/api/jobs/payment/deposit/create-order`
        : `${Backendurl}/api/jobs/payment/final/create-order`;
      
      const response = await axios.post(endpoint, {
        jobId: id
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      return response.data.data.orderId;
    } catch (err) {
      console.error('Error creating order:', err);
      setPaymentError(
        err.response?.data?.message || 
        'An error occurred while creating the payment order. Please try again.'
      );
      setIsProcessing(false);
      return null;
    }
  };

  const handleSubmitPayment = async () => {
    try {
      const orderId = await createRazorpayOrder();
      
      if (!orderId) {
        return; // Error already handled in createRazorpayOrder
      }
      
      setOrderId(orderId);
      
      // Use the amount returned from the server response 
      // This ensures we're using the exact amount (in paise) that Razorpay expects
      const paymentAmount = Math.round(getPaymentAmount() * 100); // Convert to paise
      
      const options = {
        key: "rzp_test_jEjmIhF6m9wEKw" || "rzp_test_jEjmIhF6m9wEKw", // Replace with your key
        amount: paymentAmount, // Amount in paise
        currency: "INR",
        name: "AHub Services",
        description: paymentType === 'deposit' 
          ? `Deposit Payment for Job: ${job.title}` 
          : `Final Payment for Job: ${job.title}`,
        order_id: orderId,
        handler: function (response) {
          handlePaymentSuccess(response);
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
          contact: user.phone || ""
        },
        notes: {
          jobId: id,
          paymentType: paymentType
        },
        theme: {
          color: "#4F46E5"
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        },
        // Add image if you have a logo
        // image: "https://your-logo-url.png",
      };
      
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (response) {
        setPaymentError(response.error.description || 'Payment failed. Please try again.');
        setIsProcessing(false);
      });
      
      razorpayInstance.open();
    } catch (err) {
      console.error('Payment processing error:', err);
      setPaymentError(
        err.response?.data?.message || 
        'An error occurred while processing your payment. Please try again.'
      );
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      const verifyPaymentData = {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        paymentType: paymentType
      };
      
      const verifyResponse = await axios.post(
        `${Backendurl}/api/jobs/payment/verify`,
        verifyPaymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (verifyResponse.data.success) {
        setPaymentSuccess(true);
        
        // Redirect to dashboard after success
        setTimeout(() => {
          navigate('/client-dashboard', { 
            state: { 
              notification: verifyResponse.data.message || 'Payment completed successfully!'
            }
          });
        }, 3000);
      } else {
        setPaymentError('Payment verification failed. Please contact support.');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setPaymentError(
        err.response?.data?.message || 
        'An error occurred while verifying your payment. Please contact support.'
      );
      setIsProcessing(false);
    }
  };

  const getPaymentAmount = () => {
    if (!job) return 0;
    
    if (paymentType === 'deposit') {
      return job.depositAmount || (job.price / 2);
    } else {
      return job.price - (job.depositAmount || (job.price / 2));
    }
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link to="/client-dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            {paymentType === 'deposit' ? 'Deposit Payment' : 'Final Payment'}
          </h1>
          <p className="text-gray-600">
            {paymentType === 'deposit' 
              ? 'Pay the initial 50% deposit to start work on your job' 
              : 'Pay the remaining balance to receive the final deliverables without watermark'}
          </p>
        </div>
        
        {error ? (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <div className="mt-4">
              <button 
                onClick={() => navigate('/client-dashboard')}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {paymentSuccess ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mt-5 text-xl font-medium text-gray-900">Payment Successful!</h2>
                <p className="mt-3 text-gray-500">
                  {paymentType === 'deposit' 
                    ? 'Your deposit has been processed. Work on your job will begin shortly.' 
                    : 'Your final payment has been processed. You can now access the unwatermarked deliverables.'}
                </p>
                <div className="mt-6 text-green-700 font-medium">
                  <p>Amount Paid: ₹{formatCurrency(getPaymentAmount())}</p>
                  <p>Reference: #{job._id.substring(0, 8)}</p>
                </div>
                <p className="mt-6 text-sm text-gray-500">Redirecting you to the dashboard...</p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <h2 className="text-lg font-semibold text-white">
                    {job ? job.title : 'Job Payment'}
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <DollarSign className="mr-2 h-5 w-5 text-indigo-600" />
                      Payment Summary
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Job:</span>
                        <span className="font-medium">{job?.title}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Total Job Price:</span>
                        <span className="font-medium">₹{formatCurrency(job?.price)}</span>
                      </div>
                      {paymentType === 'deposit' ? (
                        <div className="flex justify-between font-bold text-lg text-indigo-700 mt-4 pt-2 border-t border-gray-200">
                          <span>Deposit Amount (50%):</span>
                          <span>₹{formatCurrency(getPaymentAmount())}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Deposit Paid:</span>
                            <span className="font-medium">-₹{formatCurrency(job?.depositAmount || job?.price / 2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg text-indigo-700 mt-4 pt-2 border-t border-gray-200">
                            <span>Remaining Balance:</span>
                            <span>₹{formatCurrency(getPaymentAmount())}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {paymentError && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{paymentError}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 p-4 rounded-lg mb-8">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <Lock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-800 font-medium">Secure Payment with Razorpay</p>
                        <p className="text-sm text-blue-700 mt-1">
                          Your payment information is securely processed through Razorpay,
                          India's trusted payment gateway.
                        </p>
                      </div>
                    </div>
                  </div>
                    
                  <div className="flex justify-between items-center mt-8">
                    <div className="text-gray-600">
                      <p className="flex items-center text-sm">
                        <Lock className="h-4 w-4 mr-1" />
                        Secure payment
                      </p>
                    </div>
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => navigate('/client-dashboard')}
                        className="mr-4 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitPayment}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium shadow-md hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <CreditCard className="mr-2 h-5 w-5" />
                            Pay ₹{formatCurrency(getPaymentAmount())}
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPaymentPage;