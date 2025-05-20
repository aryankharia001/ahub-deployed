import React, { useState } from 'react';
import { Clock, CheckCircle, RotateCcw, AlertCircle, Eye, Download } from 'lucide-react';

const RevisionHistoryPanel = ({ revisions, jobId }) => {
  const [expandedRevision, setExpandedRevision] = useState(null);

  const toggleRevision = (index) => {
    if (expandedRevision === index) {
      setExpandedRevision(null);
    } else {
      setExpandedRevision(index);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'requested':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'requested':
        return 'Requested';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'approved':
        return 'Approved';
      default:
        return status;
    }
  };

  if (!revisions || revisions.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center mb-3">
        <RotateCcw className="mr-2 h-5 w-5 text-gray-400" />
        <h2 className="text-lg font-medium text-gray-900">Revision History</h2>
      </div>
      <div className="ml-7">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {revisions.map((revision, index) => (
            <div key={index} className="border-b border-gray-200 last:border-b-0">
              <div 
                className={`p-4 cursor-pointer hover:bg-gray-50 ${expandedRevision === index ? 'bg-gray-50' : ''}`}
                onClick={() => toggleRevision(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getStatusIcon(revision.status)}
                    <h3 className="ml-2 text-sm font-medium text-gray-900">
                      Revision Request #{index + 1}
                    </h3>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(revision.status)}`}>
                      {getStatusText(revision.status)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="mr-1 h-4 w-4" />
                    {revision.requestedAt ? formatDate(revision.requestedAt) : 'N/A'}
                  </div>
                </div>
              </div>
              
              {expandedRevision === index && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="space-y-4">
                    {/* Client Notes */}
                    <div>
                      <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-2">Client Request</h4>
                      <div className="bg-white p-3 rounded border border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {revision.clientNotes || 'No specific requests provided.'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Freelancer Notes (if available) */}
                    {revision.status === 'completed' && revision.freelancerNotes && (
                      <div>
                        <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-2">Contributor Response</h4>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-sm text-gray-700 whitespace-pre-line">{revision.freelancerNotes}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Deliverables (if available) */}
                    {revision.status === 'completed' && revision.deliverables && revision.deliverables.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-2">Revised Files</h4>
                        <ul className="space-y-2">
                          {revision.deliverables.map((file, fileIndex) => (
                            <li key={fileIndex} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                              <span className="text-sm text-gray-700">{file.name}</span>
                              <div className="flex space-x-2">
                                <a 
                                  href={file.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                >
                                  <Eye className="mr-1 h-3 w-3" />
                                  View
                                </a>
                                <a 
                                  href={file.url} 
                                  download 
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                                >
                                  <Download className="mr-1 h-3 w-3" />
                                  Download
                                </a>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Completed Date */}
                    {revision.completedAt && (
                      <div className="text-xs text-gray-500 flex items-center">
                        <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                        Completed on {formatDate(revision.completedAt)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RevisionHistoryPanel;