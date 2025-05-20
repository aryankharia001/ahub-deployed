// Implementation of RevisionRequestModal.jsx component

import React, { useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

const RevisionRequestModal = ({ isOpen, onClose, onSubmit, isSubmitting, revisionsRemaining }) => {
  const [feedback, setFeedback] = useState('');
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Request Revision</h3>
          <p className="text-sm text-gray-500 mt-1">
            Please provide detailed feedback on what changes you need.
          </p>
          <div className="mt-2 bg-orange-50 p-3 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-orange-700">
                  You have <span className="font-bold">{revisionsRemaining}</span> revision{revisionsRemaining !== 1 ? 's' : ''} remaining for this job.
                </p>
              </div>
            </div>
          </div>
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
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(feedback)}
            disabled={!feedback.trim() || isSubmitting}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-1" />
                Request Revision
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevisionRequestModal;