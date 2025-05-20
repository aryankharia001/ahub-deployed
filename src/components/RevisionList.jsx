// RevisionList.jsx
import React from 'react';
import { Clock, AlertCircle, CheckCircle, MessageCircle, Calendar } from 'lucide-react';

const RevisionList = ({ revisions = [], onStartRevision, onSubmitRevision }) => {
  if (!revisions || revisions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Revision Requests</h3>
        <div className="text-gray-500 italic py-4 text-center">
          No revision requests yet
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'requested':
        return (
          <span className="inline-flex items-center bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
            <AlertCircle className="h-3 w-3 mr-1" />
            Requested
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Revision Requests</h3>
      
      <div className="space-y-4">
        {revisions.map((revision, index) => (
          <div 
            key={index} 
            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 hover:bg-indigo-50/20 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center">
                  <span className="font-medium text-gray-900">Revision #{index + 1}</span>
                  <div className="ml-2">{getStatusBadge(revision.status)}</div>
                </div>
                <div className="text-sm text-gray-500 flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  Requested on {formatDate(revision.requestedAt)}
                </div>
              </div>
              <div className="flex space-x-2">
                {revision.status === 'requested' && (
                  <button
                    onClick={() => onStartRevision(revision._id)}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 flex items-center"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Start Working
                  </button>
                )}
                {revision.status === 'in_progress' && (
                  <button
                    onClick={() => onSubmitRevision(revision._id)}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Submit Revision
                  </button>
                )}
              </div>
            </div>
            
            {revision.clientNotes && (
              <div className="mt-3 bg-orange-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <MessageCircle className="h-4 w-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-orange-800 mb-1">Client Feedback:</div>
                    <p className="text-sm text-orange-700 whitespace-pre-line">{revision.clientNotes}</p>
                  </div>
                </div>
              </div>
            )}
            
            {revision.freelancerNotes && revision.status !== 'requested' && (
              <div className="mt-3 bg-indigo-50 p-3 rounded-lg">
                <div className="flex items-start">
                  <MessageCircle className="h-4 w-4 text-indigo-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-indigo-800 mb-1">Your Response:</div>
                    <p className="text-sm text-indigo-700 whitespace-pre-line">{revision.freelancerNotes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevisionList;