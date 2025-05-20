// ApprovalModal.jsx
import React, { useState } from 'react';
import { CheckCircle, ThumbsUp } from 'lucide-react';

const ApprovalModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [feedback, setFeedback] = useState('');
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-10 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Approve Work</h3>
          <p className="text-sm text-gray-500 mt-1">
            Once approved, you'll be able to make the final payment to receive unwatermarked files.
          </p>
          <div className="mt-2 bg-green-50 p-3 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-green-700">
                  By approving this work, you confirm that the deliverables meet your requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          rows="4"
          placeholder="Optional feedback for the contributor..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
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
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <ThumbsUp className="h-4 w-4 mr-1" />
                Approve Work
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;