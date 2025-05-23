import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search,
  User,
  CheckCircle,
  AlertCircle,
  Loader,
  Users,
  UserPlus,
  Filter,
  RefreshCw,
  Shield,
  UserCheck,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { backendurl } from '../../config/config';

const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [roleUpdateLoading, setRoleUpdateLoading] = useState({});
  const [filterRole, setFilterRole] = useState('all');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [usersPerPage] = useState(10);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [page, filterRole]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Fetch users from the backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', usersPerPage);
      if (filterRole !== 'all') {
        params.append('role', filterRole);
      }
      
      const response = await axios.get(`${backendurl}/api/admin/users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUsers(response.data.data);
      setFilteredUsers(response.data.data);
      setTotalUsers(response.data.totalUsers || response.data.data.length);
      setTotalPages(response.data.totalPages || Math.ceil(response.data.data.length / usersPerPage));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users. Please try again.');
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(value.toLowerCase()) ||
        user.email?.toLowerCase().includes(value.toLowerCase()) ||
        user._id?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  // Handle role filter change
  const handleRoleFilterChange = (e) => {
    setFilterRole(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  // Toggle dropdown for a user
  const toggleDropdown = (e, userId) => {
    e.stopPropagation(); // Prevent event bubbling
    setOpenDropdown(openDropdown === userId ? null : userId);
  };

  // Update user role
  const updateUserRole = async (userId, newRole) => {
    try {
      setRoleUpdateLoading(prev => ({ ...prev, [userId]: true }));
      setError(null);
      setSuccessMessage('');
      setOpenDropdown(null); // Close dropdown after selection
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setRoleUpdateLoading(prev => ({ ...prev, [userId]: false }));
        return;
      }
      
      const response = await axios.put(
        `${backendurl}/api/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update the local state with the updated user
      const updatedUsers = users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(
        searchTerm.trim() === '' 
          ? updatedUsers 
          : updatedUsers.filter(user => 
              user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user._id?.toLowerCase().includes(searchTerm.toLowerCase())
            )
      );
      
      setSuccessMessage(`User role updated successfully to ${newRole}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err.response?.data?.message || 'Failed to update user role. Please try again.');
    } finally {
      setRoleUpdateLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Handle pagination
  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  // Get role badge style
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'contributor':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 mr-1" />;
      case 'contributor':
        return <UserPlus className="h-4 w-4 mr-1" />;
      case 'client':
        return <UserCheck className="h-4 w-4 mr-1" />;
      default:
        return <User className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">
            Search for users and manage their roles. Assign roles to control user permissions and access.
          </p>
        </div>
        
        {/* Search and filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={filterRole}
                  onChange={handleRoleFilterChange}
                >
                  <option value="all">All Roles</option>
                  <option value="client">Clients</option>
                  <option value="contributor">Contributors</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
              
              <button
                onClick={() => fetchUsers()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        {/* Success and error messages */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Role Descriptions */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <UserCheck className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium text-green-700">Client</h3>
            </div>
            <p className="text-sm text-green-600">Can post jobs, hire contributors, and manage their own projects.</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <UserPlus className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-medium text-blue-700">Contributor</h3>
            </div>
            <p className="text-sm text-blue-600">Can apply for jobs, complete work, and submit deliverables to clients.</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Shield className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="font-medium text-red-700">Admin</h3>
            </div>
            <p className="text-sm text-red-600">Has full access to manage the platform, users, jobs, and system settings.</p>
          </div>
        </div>
        
        {/* Users table */}
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-gray-500">
                {searchTerm ? 'Try a different search term or clear the search.' : 'No users match the selected filter.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Role
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map(user => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt={user.name}
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <User className="h-5 w-5 text-indigo-600" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 font-mono">{user._id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeStyle(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end">
                            <div className="relative">
                              <button
                                onClick={(e) => toggleDropdown(e, user._id)}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                disabled={roleUpdateLoading[user._id]}
                              >
                                {roleUpdateLoading[user._id] ? (
                                  <Loader className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <>
                                    Change Role
                                    <ChevronDown className="h-3 w-3 ml-1" />
                                  </>
                                )}
                              </button>
                              
                              {/* Role dropdown */}
                              {openDropdown === user._id && (
                                <div 
                                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="py-1" role="menu" aria-orientation="vertical">
                                    <button
                                      onClick={() => updateUserRole(user._id, 'client')}
                                      className={`w-full text-left px-4 py-2 text-sm ${user.role === 'client' ? 'bg-gray-100 text-gray-500' : 'text-gray-700 hover:bg-gray-100'} flex items-center`}
                                      disabled={user.role === 'client'}
                                    >
                                      <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                                      Make Client
                                    </button>
                                    <button
                                      onClick={() => updateUserRole(user._id, 'contributor')}
                                      className={`w-full text-left px-4 py-2 text-sm ${user.role === 'contributor' ? 'bg-gray-100 text-gray-500' : 'text-gray-700 hover:bg-gray-100'} flex items-center`}
                                      disabled={user.role === 'contributor'}
                                    >
                                      <UserPlus className="h-4 w-4 mr-2 text-blue-600" />
                                      Make Contributor
                                    </button>
                                    <button
                                      onClick={() => updateUserRole(user._id, 'admin')}
                                      className={`w-full text-left px-4 py-2 text-sm ${user.role === 'admin' ? 'bg-gray-100 text-gray-500' : 'text-gray-700 hover:bg-gray-100'} flex items-center`}
                                      disabled={user.role === 'admin'}
                                    >
                                      <Shield className="h-4 w-4 mr-2 text-red-600" />
                                      Make Admin
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * usersPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(page * usersPerPage, totalUsers)}
                      </span>{' '}
                      of <span className="font-medium">{totalUsers}</span> users
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => goToPage(page - 1)}
                        disabled={page === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page numbers */}
                      {[...Array(totalPages).keys()].map((pageNum) => (
                        <button
                          key={pageNum + 1}
                          onClick={() => goToPage(pageNum + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                            page === pageNum + 1
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => goToPage(page + 1)}
                        disabled={page === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagementPage;