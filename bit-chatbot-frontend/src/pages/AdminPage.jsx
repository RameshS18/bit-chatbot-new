import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Lock, Mail, LogOut, Users, MessageSquare, Clock, CheckSquare, 
  X, Send, RotateCw, AlertCircle, ChevronRight, FileText
} from 'lucide-react'
import axios from 'axios'

// --- User Queries Modal Component ---
const UserQueriesModal = ({ user, onClose, onResolve, mode = 'escalated' }) => {
  const [queries, setQueries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedQuery, setSelectedQuery] = useState(null)
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    fetchUserQueries()
  }, [user.email])

  const fetchUserQueries = async () => {
    const isSolvedMode = mode === 'solved'
    try {
      const response = await axios.get(`/api/admin/user-queries/${encodeURIComponent(user.email)}`)
      
      // --- THIS IS THE CRITICAL CHANGE ---
      // Filter queries based on the mode
      let fetchedQueries = response.data
      if (isSolvedMode) {
        fetchedQueries = fetchedQueries.filter(q => q.status === 'Finished')
      } else {
        fetchedQueries = fetchedQueries.filter(q => q.status === 'Initiated')
      }
      setQueries(fetchedQueries)
      // --- END OF CHANGE ---

    } catch (error) {
      console.error('Error fetching user queries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveSubmit = async () => {
    if (!remarks.trim()) {
      alert('Please enter remarks before resolving.')
      return
    }

    try {
      await axios.put(`/api/admin/update-query/${selectedQuery.id}`, {
        status: 'Finished',
        remarks: remarks
      })
      alert('Query resolved successfully!')
      setSelectedQuery(null)
      setRemarks('')
      fetchUserQueries() // Refresh the list
      onResolve() // Notify parent to refresh stats
    } catch (error) {
      console.error('Error resolving query:', error)
      alert('Failed to resolve query. Please try again.')
    }
  }

  // --- NEW: Dynamic constants based on mode ---
  const isSolvedMode = mode === 'solved'
  const headerGradient = isSolvedMode ? 'from-green-600 to-green-700' : 'from-red-600 to-red-700'
  const headerTitle = isSolvedMode ? 'Solved Queries' : 'Escalated Queries'
  const headerTextColor = isSolvedMode ? 'text-green-100' : 'text-red-100'
  const borderColor = isSolvedMode ? 'border-green-500' : 'border-red-500'
  const emptyIcon = isSolvedMode ? <CheckSquare className="mx-auto text-gray-400 mb-4" size={48} /> : <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
  const emptyText = isSolvedMode ? 'No solved queries found for this user' : 'No escalated queries found for this user'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header --- CHANGED: Dynamic Colors/Title --- */}
        <div className={`bg-gradient-to-r ${headerGradient} px-6 py-4 flex justify-between items-center`}>
          <div>
            <h3 className="text-2xl font-bold text-white">{headerTitle}</h3>
            <p className={`${headerTextColor} text-sm mt-1`}>{user.user_name} ({user.email})</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isSolvedMode ? 'border-green-600' : 'border-red-600'} mx-auto`}></div>
              <p className="text-gray-600 mt-4">Loading queries...</p>
            </div>
            // --- CHANGED: Dynamic Empty State ---
          ) : queries.length === 0 ? (
            <div className="text-center py-12">
              {emptyIcon}
              <p className="text-gray-600">{emptyText}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {queries.map((query) => (
                <div 
                  key={query.id} 
                  // --- CHANGED: Dynamic Border Color ---
                  className={`bg-gray-50 rounded-lg p-5 hover:shadow-md transition-shadow border-l-4 ${borderColor}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-2">
                        {new Date(query.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Query:</p>
                      <p className="text-gray-800 mb-3">{query.query_text}</p>
                      
                      {query.remarks && (
                        <>
                          <p className="text-sm font-semibold text-gray-700 mb-2">Remarks:</p>
                          <p className="text-gray-700 bg-white rounded p-3 text-sm">{query.remarks}</p>
                        </>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full font-semibold text-xs ml-4 ${
                      query.status === 'Finished'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {query.status}
                    </span>
                  </div>
                  
                  {/* --- CHANGED: Hide Resolve button in solved mode --- */}
                  {!isSolvedMode && query.status === 'Initiated' && selectedQuery?.id !== query.id && (
                    <button
                      onClick={() => setSelectedQuery(query)}
                      className="mt-3 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Resolve Query
                    </button>
                  )}

                  {/* --- CHANGED: Hide Resolve form in solved mode --- */}
                  {!isSolvedMode && selectedQuery?.id === query.id && (
                    <div className="mt-4 bg-white rounded-lg p-4 border-2 border-red-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Resolution Remarks *
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows="3"
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mb-3"
                        placeholder="Enter details of the action taken..."
                      />
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            setSelectedQuery(null)
                            setRemarks('')
                          }}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleResolveSubmit}
                          disabled={!remarks.trim()}
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
                        >
                          <Send size={18} />
                          <span>Mark as Finished</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- User Details Modal Component ---
const UserDetailsModal = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">User Details</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="text-blue-600" size={32} />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-800">{user.user_name}</h4>
                <p className="text-gray-600">User ID: #{user.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-600 mb-1">Email Address</p>
                <p className="text-gray-800 flex items-center">
                  <Mail size={16} className="mr-2 text-gray-500" />
                  {user.email}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-600 mb-1">Phone Number</p>
                <p className="text-gray-800">
                  {user.phone_number || <span className="text-gray-400 italic">Not provided</span>}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-600 mb-1">First Seen</p>
                <p className="text-gray-800">{new Date(user.first_seen).toLocaleString()}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-600 mb-1">Last Seen</p>
                <p className="text-gray-800">{new Date(user.last_seen).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Escalated Users List Modal ---
const EscalatedUsersModal = ({ onClose, onUserSelect, onRefresh }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEscalatedUsers()
  }, [])

  const fetchEscalatedUsers = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/escalated-users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching escalated users:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">Users with Escalated Queries</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No escalated queries found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div 
                  key={user.email}
                  onClick={() => {
                    onUserSelect(user)
                    onClose()
                  }}
                  className="bg-gray-50 hover:bg-red-50 rounded-lg p-4 cursor-pointer transition-all border-l-4 border-red-500 hover:shadow-md group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-800 group-hover:text-red-700">
                        {user.user_name}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Phone: {user.phone_number || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">{user.query_count}</p>
                        <p className="text-xs text-gray-500">Queries</p>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-red-600" size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- NEW Solved Users List Modal ---
const SolvedUsersModal = ({ onClose, onUserSelect, onRefresh }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSolvedUsers()
  }, [])

  const fetchSolvedUsers = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/solved-users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching solved users:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header --- Styled Green --- */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">Users with Solved Queries</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="text-center py-12">
              {/* --- Styled Green --- */}
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No solved queries found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div 
                  key={user.email}
                  onClick={() => {
                    onUserSelect(user)
                    onClose()
                  }}
                  // --- Styled Green ---
                  className="bg-gray-50 hover:bg-green-50 rounded-lg p-4 cursor-pointer transition-all border-l-4 border-green-500 hover:shadow-md group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-800 group-hover:text-green-700">
                        {user.user_name}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Phone: {user.phone_number || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        {/* --- Styled Green --- */}
                        <p className="text-2xl font-bold text-green-600">{user.query_count}</p>
                        <p className="text-xs text-gray-500">Solved</p>
                      </div>
                      <ChevronRight className="text-gray-400 group-hover:text-green-600" size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// --- Today's Users Modal ---
const TodayUsersModal = ({ onClose }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    fetchTodayUsers()
  }, [])

  const fetchTodayUsers = async () => {
    try {
      const response = await axios.get('/api/admin/today-users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching today users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (selectedUser) {
    return (
      <UserDetailsModal 
        user={selectedUser} 
        onClose={() => setSelectedUser(null)} 
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">Today's Active Users</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No active users today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="bg-gray-50 hover:bg-blue-50 rounded-lg p-4 cursor-pointer transition-all border-l-4 border-blue-500 hover:shadow-md group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-800 group-hover:text-blue-700">
                        {user.user_name}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last seen: {new Date(user.last_seen).toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-blue-600" size={24} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- All Users Modal ---
const AllUsersModal = ({ onClose }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/api/admin/all-users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching all users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (selectedUser) {
    return (
      <UserDetailsModal 
        user={selectedUser} 
        onClose={() => setSelectedUser(null)} 
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">All Registered Users</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="bg-gray-50 hover:bg-purple-50 rounded-lg p-4 cursor-pointer transition-all border-l-4 border-purple-500 hover:shadow-md group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-800 group-hover:text-purple-700">
                        {user.user_name}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Last seen: {new Date(user.last_seen).toLocaleString()}
                      </p>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-purple-600" size={24} />
                  </div>
                </div>
              ))}
            </div>
          )}
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
  
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUniqueUsers: 0,
    todayUsers: 0,
    totalEscalated: 0,
    totalSolved: 0
  })

  // Modal States
  const [showEscalatedModal, setShowEscalatedModal] = useState(false)
  const [showTodayUsersModal, setShowTodayUsersModal] = useState(false)
  const [showAllUsersModal, setShowAllUsersModal] = useState(false)
  // --- CHANGED: Renamed state ---
  const [showSolvedUsersModal, setShowSolvedUsersModal] = useState(false)
  const [showUserQueriesModal, setShowUserQueriesModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  // --- NEW: Added state for modal mode ---
  const [modalMode, setModalMode] = useState('escalated')

  useEffect(() => {
    const adminAuth = localStorage.getItem('bitChatbotAdmin')
    if (adminAuth === 'true') {
      setIsAuthenticated(true)
      fetchStats()
    }
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    if (email === 'bit.admin.chat.sathy@bitsathy.ac.in' && password === 'bit.chat.sathy@123') {
      setIsAuthenticated(true)
      localStorage.setItem('bitChatbotAdmin', 'true')
      fetchStats()
    } else {
      setError('Invalid email or password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('bitChatbotAdmin')
    navigate('/')
  }

  // --- CHANGED: Updated to accept and set mode ---
  const handleUserSelect = (user, mode = 'escalated') => {
    setSelectedUser(user)
    setModalMode(mode) 
    setShowUserQueriesModal(true)
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
      {/* Modals */}
      {showEscalatedModal && (
        <EscalatedUsersModal 
          onClose={() => setShowEscalatedModal(false)}
          // --- CHANGED: Explicitly pass 'escalated' mode ---
          onUserSelect={(user) => handleUserSelect(user, 'escalated')}
          onRefresh={fetchStats}
        />
      )}
      
      {showUserQueriesModal && selectedUser && (
        <UserQueriesModal 
          user={selectedUser}
          onClose={() => {
            setShowUserQueriesModal(false)
            setSelectedUser(null)
          }}
          onResolve={fetchStats}
          // --- NEW: Pass the mode to the modal ---
          mode={modalMode} 
        />
      )}

      {showTodayUsersModal && (
        <TodayUsersModal onClose={() => setShowTodayUsersModal(false)} />
      )}

      {showAllUsersModal && (
        <AllUsersModal onClose={() => setShowAllUsersModal(false)} />
      )}

      {/* --- CHANGED: Replaced old modal with new one --- */}
      {showSolvedUsersModal && (
        <SolvedUsersModal 
          onClose={() => setShowSolvedUsersModal(false)}
          // --- CHANGED: Explicitly pass 'solved' mode ---
          onUserSelect={(user) => handleUserSelect(user, 'solved')}
          onRefresh={fetchStats}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Admin Header */}
        <nav className="bg-gradient-to-r from-bit-primary to-blue-700 text-white shadow-xl">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-bit-primary font-bold text-2xl">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-xs text-blue-100">BIT Chatbot Analytics & Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchStats}
                disabled={loading}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors shadow-lg"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Cards - Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Escalated Queries Card */}
            <div 
              onClick={() => setShowEscalatedModal(true)}
              className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 mb-2 font-medium">Escalated Queries</p>
                  <p className="text-5xl font-bold mb-2">{stats.totalEscalated}</p>
                  <p className="text-red-100 text-sm flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    Click to view details
                  </p>
                </div>
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <MessageSquare size={40} />
                </div>
              </div>
            </div>

            {/* Today's Users Card */}
            <div 
              onClick={() => setShowTodayUsersModal(true)}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 mb-2 font-medium">Today's Active Users</p>
                  <p className="text-5xl font-bold mb-2">{stats.todayUsers}</p>
                  <p className="text-blue-100 text-sm flex items-center">
                    <Clock size={16} className="mr-1" />
                    Click to view details
                  </p>
                </div>
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Clock size={40} />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Users Card */}
            <div 
              onClick={() => setShowAllUsersModal(true)}
              className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 mb-2 font-medium">Total Registered Users</p>
                  <p className="text-5xl font-bold mb-2">{stats.totalUniqueUsers}</p>
                  <p className="text-purple-100 text-sm flex items-center">
                    <Users size={16} className="mr-1" />
                    Click to view details
                  </p>
                </div>
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Users size={40} />
                </div>
              </div>
            </div>

            {/* Solved Queries Card */}
            {/* --- CHANGED: Updated onClick handler --- */}
            <div 
              onClick={() => setShowSolvedUsersModal(true)}
              className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 mb-2 font-medium">Solved Queries</p>
                  <p className="text-5xl font-bold mb-2">{stats.totalSolved}</p>
                  <p className="text-green-100 text-sm flex items-center">
                    <CheckSquare size={16} className="mr-1" />
                    Click to view details
                  </p>
                </div>
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <CheckSquare size={40} />
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="text-bit-primary" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Dashboard Instructions</h3>
                <ul className="text-gray-600 space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span><strong>Escalated Queries:</strong> View users with unresolved queries. Click a user to see their queries and add resolution remarks.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span><strong>Today's Active Users:</strong> View all users who have been active today. Click to see detailed information.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span><strong>Total Registered Users:</strong> View all users who have ever used the chatbot. Click to see detailed information.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span><strong>Solved Queries:</strong> View all queries that have been resolved with remarks.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AdminPage