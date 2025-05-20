// RevisionActionButtons.jsx
import React from 'react';
import { ThumbsUp, RotateCcw, AlertCircle } from 'lucide-react';

const RevisionActionButtons = ({ 
  status, 
  onRequestRevision, 
  onApproveWork, 
  revisionsRemaining,
  isClient = false
}) => {
  // Only show the buttons if the job is in a completed or revision_completed state
  // and the user is a client (they can approve or request revisions)
  if (!isClient || (status !== 'completed' && status !== 'revision_completed')) {
    return null;
  }
  
  return (
    <div className="mt-4">
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-900 mb-2">Review Submission</h4>
        
        <div className="text-sm text-gray-600 mb-4">
          Please review the submitted work and choose to either approve it or request revisions.
        </div>
        
        {revisionsRemaining <= 0 ? (
          <div className="bg-orange-50 p-3 rounded-lg mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-orange-700">
                  You have no revisions remaining for this job. You can only approve the work now.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-700">
                  You have <span className="font-bold">{revisionsRemaining}</span> revision{revisionsRemaining !== 1 ? 's' : ''} remaining for this job.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          {revisionsRemaining > 0 && (
            <button
              onClick={onRequestRevision}
              className="inline-flex items-center justify-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Request Revision
            </button>
          )}
          
          <button
            onClick={onApproveWork}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <ThumbsUp className="h-4 w-4 mr-2" />
            Approve Work
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevisionActionButtons;