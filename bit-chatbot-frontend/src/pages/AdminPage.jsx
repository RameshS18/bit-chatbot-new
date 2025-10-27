import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Lock, Mail, LogOut, Users, MessageSquare, Clock, CheckSquare, 
  X, Edit2, Send, RotateCw 
} from 'lucide-react'
import axios from 'axios'

// --- Remarks Modal Component ---
const RemarksModal = ({ query, onClose, onSave }) => {
  const [remarks, setRemarks] = useState(query.remarks || '')

  const handleSubmit = () => {
    onSave(query.id, remarks)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-800">Resolve Query</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600">User:</p>
            <p className="text-gray-800">{query.user_name} ({query.email})</p>
            <p className="text-sm font-medium text-gray-600 mt-2">Query:</p>
            <p className="text-gray-800">{query.query_text}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Remarks *
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows="4"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-bit-secondary focus:border-transparent outline-none"
              placeholder="Enter details of the action taken..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-6 border-t space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!remarks.trim()}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 disabled:opacity-50"
          >
            <Send size={18} />
            <span>Mark as Finished</span>
          </button>
        </div>
      </div>
    </div>
  )
}


// --- Main Admin Page Component ---
const AdminPage = () => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const [queries, setQueries] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUniqueUsers: 0,
    todayUsers: 0,
    totalEscalated: 0
  })

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentQuery, setCurrentQuery] = useState(null)

  useEffect(() => {
    const adminAuth = localStorage.getItem('bitChatbotAdmin')
    if (adminAuth === 'true') {
      setIsAuthenticated(true)
      fetchData()
    }
  }, [])

  // --- UPDATED: Fetch all data from backend ---
  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      // --- Fetch 1: Stats ---
      const statsResponse = await axios.get('/api/admin/stats')
      setStats(statsResponse.data)
      
      // --- Fetch 2: Escalated Queries ---
      const queriesResponse = await axios.get('/api/admin/escalated-queries')  
      setQueries(queriesResponse.data)

      // --- Fetch 3: All Users ---
      const allUsersResponse = await axios.get('/api/admin/all-users')
      setAllUsers(allUsersResponse.data)

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch data from server.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    if (email === 'bit.admin.chat.sathy@bitsathy.ac.in' && password === 'bit.chat.sathy@123') {
      setIsAuthenticated(true)
      localStorage.setItem('bitChatbotAdmin', 'true')
      fetchData()
    } else {
      setError('Invalid email or password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('bitChatbotAdmin')
    navigate('/')
  }

  const handleResolveClick = (query) => {
    setCurrentQuery(query)
    setIsModalOpen(true)
  }

  const handleUpdateQuery = async (queryId, remarks) => {
    try {
      await axios.put(`/api/admin/update-query/${queryId}`, {
        status: 'Finished',
        remarks: remarks
      })
      // Close modal and refresh data
      setIsModalOpen(false)
      setCurrentQuery(null)
      fetchData(false) // Refresh data without full loading spinner
    } catch (error) {
      console.error('Error updating query:', error)
      alert('Failed to update query. Please try again.')
    }
  }


  // --- Login Page ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-bit-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Admin Login</h2>
            <p className="text-gray-600 mt-2">BIT Chatbot Administration</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bit-secondary focus:border-transparent outline-none transition"
                  placeholder="admin@bitsathy.ac.in"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bit-secondary focus:border-transparent outline-none transition"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-bit-primary hover:bg-blue-900 text-white font-semibold py-4 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg"
            >
              Login to Dashboard
            </button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- Main Dashboard Page ---
  return (
    <>
      {/* Modal */}
      {isModalOpen && currentQuery && (
        <RemarksModal
          query={currentQuery}
          onClose={() => setIsModalOpen(false)}
          onSave={handleUpdateQuery}
        />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Admin Header */}
        <nav className="bg-bit-primary text-white shadow-lg">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-bit-primary font-bold text-xl">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-xs text-blue-200">BIT Chatbot Analytics</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Escalated Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Escalated Queries</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalEscalated}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="text-red-600" size={24} />
                </div>
              </div>
            </div>
            {/* Total Unique Users Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Unique Users</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.totalUniqueUsers}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="text-green-600" size={24} />
                </div>
              </div>
            </div>
            {/* Today's Users Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Today's Active Users</p>
                  <p className="text-3xl font-bold text-gray-800">{stats.todayUsers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="text-bit-primary" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Escalated Queries Log */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="flex justify-between items-center bg-gradient-to-r from-bit-primary to-blue-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <CheckSquare className="mr-2" size={24} />
                Escalated Queries for Review
              </h2>
              <button
                onClick={() => fetchData(true)}
                disabled={loading}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-white transition-colors"
              >
                <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
            <div className="p-2 sm:p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bit-primary mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading queries...</p>
                </div>
              ) : queries.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No escalated queries yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          User Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Query
                        </th>
                        {/* --- THIS IS THE FIXED LINE --- */}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Remarks
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {queries.map((query) => (
                        <tr key={query.id} className="hover:bg-gray-50 transition-colors">
                          
                          {/* User Details */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-gray-900">{query.user_name}</p>
                            <p className="text-sm text-gray-600">{query.email}</p>
                            <p className="text-sm text-gray-600">{query.phone_number}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(query.timestamp).toLocaleString()}
                            </p>
                          </td>
                          
                          {/* Query */}
                          <td className="px-4 py-4 text-sm text-gray-800 max-w-xs">
                            <div 
                              className="truncate" 
                              title={query.query_text}
                            >
                              {query.query_text}
                            </div>
                          </td>
                          
                          {/* Remarks */}
                          <td className="px-4 py-4 text-sm text-gray-700 max-w-xs">
                            <div 
                              className="truncate" 
                              title={query.remarks}
                            >
                              {query.remarks || (
                                <span className="text-gray-400 italic">No remarks yet</span>
                              )}
                            </div>
                          </td>
                          
                          {/* Status */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 rounded-full font-semibold text-xs ${
                              query.status === 'Finished'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {query.status}
                            </span>
                          </td>
                          
                          {/* Action Button */}
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            {query.status === 'Initiated' ? (
                              <button
                                onClick={() => handleResolveClick(query)}
                                className="flex items-center space-x-2 bg-bit-primary hover:bg-blue-900 text-white font-semibold py-2 px-3 rounded-lg"
                              >
                                <Edit2 size={16} />
                                <span>Resolve</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleResolveClick(query)}
                                className="flex items-center space-x-2 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-3 rounded-lg"
                              >
                                <Edit2 size={16} />
                                <span>Edit</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* --- All Users Log --- */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mt-8">
            <div className="flex justify-between items-center bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Users className="mr-2" size={24} />
                All Registered Users
              </h2>
              <button
                onClick={() => fetchData(true)}
                disabled={loading}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-white transition-colors"
              >
                <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
            </div>
            
            <div className="p-2 sm:p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading users...</p>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No users found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          User Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          First Seen
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Last Seen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {allUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          
                          {/* User Details */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-gray-900">{user.user_name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </td>
                          
                          {/* Phone */}
                          <td className="px-4 py-4 text-sm text-gray-800">
                            {user.phone_number || <span className="text-gray-400 italic">N/A</span>}
                          </td>
                          
                          {/* First Seen */}
                          <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {new Date(user.first_seen).toLocaleString()}
                          </td>
                          
                          {/* Last Seen --- THIS IS THE SECOND FIXED LINE --- */}
                          <td className="px-4 py-4 text-sm text-gray-700 whitespace-nowrap">
                            {new Date(user.last_seen).toLocaleString()}
                          </td>
Type Message
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          {/* --- END OF ALL USERS SECTION --- */}

        </div>
      </div>
    </>
  )
}

export default AdminPage