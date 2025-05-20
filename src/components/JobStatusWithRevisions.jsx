// JobStatusWithRevisions.jsx
import React from 'react';
import { CheckCircle, Circle, Clock, RotateCcw, ThumbsUp } from 'lucide-react';

const JobStatusWithRevisions = ({ job }) => {
  // Determine which step is active based on job status
  const getStepStatus = (step) => {
    const statusMap = {
      'pending': 1,
      'approved': 2,
      'deposit_paid': 3,
      'in_progress': 4,
      'completed': 5,
      'revision_requested': 6,
      'revision_in_progress': 6,
      'revision_completed': 6,
      'approved_by_client': 7,
      'final_paid': 8
    };
    
    const currentStep = statusMap[job?.status] || 1;
    
    if (step < currentStep) {
      return 'completed';
    } else if (step === currentStep) {
      return 'current';
    } else {
      return 'upcoming';
    }
  };
  
  // Check if job is in any revision state
  const isInRevisionState = () => {
    return ['revision_requested', 'revision_in_progress', 'revision_completed'].includes(job?.status);
  };
  
  // Get the revision step status
  const getRevisionStatus = () => {
    switch (job?.status) {
      case 'revision_requested':
        return 'requested';
      case 'revision_in_progress':
        return 'in_progress';
      case 'revision_completed':
        return 'completed';
      default:
        return null;
    }
  };
  
  // Get the revision count from the job
  const getRevisionCount = () => {
    return job?.revisions?.length || 0;
  };
  
  // Format a date nicely
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return null;
    }
  };

  const renderStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-white" />;
      case 'current':
        return <Clock className="h-5 w-5 text-indigo-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };
  
  const steps = [
    { id: 1, name: 'Submitted', date: formatDate(job?.createdAt) },
    { id: 2, name: 'Approved', date: formatDate(job?.approvedAt) },
    { id: 3, name: 'Deposit Paid', date: formatDate(job?.depositPaidAt) },
    { id: 4, name: 'In Progress', date: null },
    { id: 5, name: 'Completed', date: formatDate(job?.completedAt) },
    { id: 6, name: 'Revision', icon: <RotateCcw className="h-5 w-5" />, 
      subStatus: getRevisionStatus(), 
      badge: getRevisionCount() > 0 ? getRevisionCount() : null 
    },
    { id: 7, name: 'Approved', icon: <ThumbsUp className="h-5 w-5" />, date: formatDate(job?.clientApprovedAt) },
    { id: 8, name: 'Final Paid', date: formatDate(job?.finalPaidAt) }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Job Progress</h3>
      
      {/* Progress bar */}
      <div className="mb-8 relative">
        <div className="overflow-hidden h-2 mb-6 text-xs flex rounded bg-gray-200">
          <div 
            style={{ width: `${Math.min(100, (getStepStatus(8) === 'completed' ? 100 : (steps.findIndex(s => getStepStatus(s.id) === 'current') / (steps.length - 1)) * 100))}%` }} 
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600"
          ></div>
        </div>
        
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const status = getStepStatus(step.id);
            // Skip the revision step if not in a revision state and no revisions
            if (step.id === 6 && !isInRevisionState() && getRevisionCount() === 0) {
              return null;
            }
            
            return (
              <div key={step.id} className="text-center flex flex-col items-center">
                <div 
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    status === 'completed' 
                      ? 'bg-indigo-600 border-2 border-indigo-600' 
                      : status === 'current'
                        ? 'bg-white border-2 border-indigo-600' 
                        : 'bg-white border-2 border-gray-300'
                  }`}
                >
                  {step.icon ? (
                    <div className={status === 'completed' ? 'text-white' : status === 'current' ? 'text-indigo-600' : 'text-gray-400'}>
                      {step.icon}
                    </div>
                  ) : (
                    renderStepIcon(status)
                  )}
                  
                  {step.badge && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                      {step.badge}
                    </span>
                  )}
                </div>
                
                <div className="mt-2 text-xs font-medium">
                  <div className={`${
                    status === 'completed' 
                      ? 'text-indigo-600' 
                      : status === 'current'
                        ? 'text-indigo-800 font-semibold' 
                        : 'text-gray-500'
                  }`}>
                    {step.name}
                    
                    {step.subStatus && (
                      <span className={`ml-1 inline-block px-1.5 py-0.5 rounded-full text-xs ${
                        step.subStatus === 'requested' 
                          ? 'bg-orange-100 text-orange-800' 
                          : step.subStatus === 'in_progress'
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {step.subStatus.charAt(0).toUpperCase() + step.subStatus.slice(1)}
                      </span>
                    )}
                  </div>
                  
                  {step.date && (
                    <div className="text-xs text-gray-500 mt-1">
                      {step.date}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current status display */}
      <div className="text-center mt-4">
        <div className="inline-flex items-center px-3 py-1 rounded-md bg-indigo-50 border border-indigo-200">
          <span className="font-medium text-indigo-700">
            Current Status: {job?.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </span>
        </div>
        
        {job?.revisionsRemaining !== undefined && (
          <div className="mt-2 text-sm text-gray-600">
            {job.revisionsRemaining > 0 
              ? `Revisions Remaining: ${job.revisionsRemaining}` 
              : "No revisions remaining"
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default JobStatusWithRevisions;