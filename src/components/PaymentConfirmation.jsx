// PaymentConfirmation.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CheckCircle, AlertCircle, CreditCard, Shield } from 'lucide-react';
import axios from 'axios';
import { backendurl } from '../App';

const PaymentConfirmation = ({ job, paymentType, onSuccess, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const getPaymentAmount = () => {
    if (!job) return 0;
    const halfPrice = job.price / 2;
    
    if (paymentType === 'deposit') {
      return halfPrice;
    } else {
      return halfPrice; // Final payment is also half
    }
  };
  
  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const endpoint = paymentType === 'deposit' 
        ? `${backendurl}/api/jobs/payment/deposit` 
        : `${backendurl}/api/jobs/payment/final`;
      
      const response = await axios.post(endpoint, {
        jobId: job._id,
        paymentMethod: 'credit_card', // In a real app, you'd integrate with a payment gateway
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Payment processing failed. Please try again.');
      setIsProcessing(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="text-center mb-6">
        <div className="inline-block p-3 rounded-full bg-indigo-100 mb-4">
          <DollarSign className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {paymentType === 'deposit' ? 'Pay Deposit' : 'Complete Final Payment'}
        </h2>
        <p className="text-gray-600 mt-1">
          {paymentType === 'deposit' 
            ? 'Pay the initial 50% to get your job started'
            : 'Pay the remaining 50% to access full deliverables'}
        </p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Job:</span>
          <span className="font-medium truncate max-w-xs">{job?.title}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Total Job Price:</span>
          <span className="font-medium">${job?.price?.toFixed(2)}</span>
        </div>
        {paymentType === 'final' && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Deposit Paid:</span>
            <span className="font-medium text-green-600">-${(job?.price / 2).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200">
          <span className="font-bold text-gray-900">
            {paymentType === 'deposit' ? 'Deposit Amount (50%):' : 'Remaining Amount (50%):'}
          </span>
          <span className="font-bold text-xl text-indigo-600">
            ${getPaymentAmount().toFixed(2)}
          </span>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-center mb-6">
        <Shield className="h-5 w-5 text-green-600 mr-2" />
        <span className="text-sm text-gray-600">Secure payment processing</span>
      </div>
      
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium"
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handlePayment}
          className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <CreditCard className="h-4 w-4 mr-2" />
              Pay ${getPaymentAmount().toFixed(2)}
            </div>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default PaymentConfirmation;