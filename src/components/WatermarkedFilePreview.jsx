// WatermarkedFilePreview.jsx
import React, { useState, useEffect } from 'react';
import { Download, Eye, Lock, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { backendurl } from '../App';

const WatermarkedFilePreview = ({ jobId, files, isLocked }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handlePreview = async (file) => {
    if (isLocked && !file.previewUrl) {
      return; // Don't allow preview if locked and no preview URL
    }
    
    setSelectedFile(file);
    
    if (file.previewUrl) {
      setPreviewUrl(file.previewUrl);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.get(`${backendurl}/api/jobs/${jobId}/preview/${file.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setPreviewUrl(response.data.previewUrl);
    } catch (err) {
      console.error('Error getting preview:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const renderFileIcon = (type) => {
    if (type.includes('image')) {
      return <Eye className="h-5 w-5 text-blue-500" />;
    } else if (type.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Deliverable Files</h3>
      
      {isLocked && (
        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <Lock className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Files are locked</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Complete the final payment to unlock and download the unwatermarked files.
              </p>
              <div className="mt-3">
                <Link
                  to={`/jobs/${jobId}/accept`}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-yellow-600 to-red-500 hover:from-yellow-700 hover:to-red-600"
                >
                  Complete Payment
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700">Files</h4>
          </div>
          <div className="p-4 max-h-80 overflow-y-auto">
            {files && files.length > 0 ? (
              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li 
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      selectedFile && selectedFile.id === file.id ? 'bg-indigo-50 border border-indigo-200' : ''
                    }`}
                    onClick={() => handlePreview(file)}
                  >
                    <div className="flex items-center overflow-hidden">
                      {renderFileIcon(file.type)}
                      <span className="ml-2 text-sm text-gray-900 truncate">
                        {file.name}
                      </span>
                    </div>
                    {file.isWatermarked && (
                      <span className="ml-1 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                        Watermarked
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm">No files available</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="col-span-2 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-700">
              {selectedFile ? `Preview: ${selectedFile.name}` : 'File Preview'}
            </h4>

            {selectedFile && !isLocked && (
              <a
                href={selectedFile.url}
                download
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </a>
            )}
          </div>
          <div className="p-4 bg-gray-100 h-80 flex items-center justify-center">
            {loading ? (
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            ) : previewUrl ? (
              <div className="max-h-full max-w-full overflow-auto">
                {selectedFile?.type.includes('image') ? (
                  <img 
                    src={previewUrl} 
                    alt={selectedFile?.name} 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : selectedFile?.type.includes('pdf') ? (
                  <iframe 
                    src={previewUrl} 
                    title={selectedFile?.name}
                    className="w-full h-full min-h-[300px]"
                  />
                ) : (
                  <div className="text-center p-6 bg-white rounded-lg">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      Preview not available for this file type
                    </p>
                    {!isLocked && (
                      <a
                        href={selectedFile.url}
                        download
                        className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download to view
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-6">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Select a file to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatermarkedFilePreview;