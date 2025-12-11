import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Lock, Mail, LogOut, Users, MessageSquare, Clock, CheckSquare, 
  X, Send, RotateCw, AlertCircle, ChevronRight, FileText, Edit,
  BookUser, Search, Filter, Download, User as UserIcon, BookCopy,
  MessageCircle, Settings, ArrowLeft, Save // <-- All Icons Imported
} from 'lucide-react'
import axios from 'axios'

// --- Spinner Component ---
const Spinner = ({ size = 'h-12 w-12', borderColor = 'border-blue-600' }) => (
  <div className={`animate-spin rounded-full ${size} border-b-2 ${borderColor} mx-auto`}></div>
)




// --- Chat History Modal (With Category Filters) ---
const ChatHistoryModal = ({ onClose }) => {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  useEffect(() => {
    fetchChatHistory()
  }, [])

  const fetchChatHistory = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/chat-history')
      setChats(response.data)
    } catch (error) {
      console.error('Error fetching chat history:', error)
      setChats([]) 
    } finally {
      setLoading(false)
    }
  }

  const categories = ['All', 'Admission', 'Hostel', 'Campus-Facility', 'Placement', 'General']

  const filteredChats = useMemo(() => {
    return chats.filter(chat => {
      const matchesSearch = 
        (chat.user_name && chat.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (chat.email && chat.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (chat.user_query && chat.user_query.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = categoryFilter === 'All' || (chat.category && chat.category === categoryFilter)
      return matchesSearch && matchesCategory
    })
  }, [chats, searchTerm, categoryFilter])

  const handleDownload = () => {
    const headers = ['Timestamp', 'Category', 'User Name', 'Email', 'Phone', 'Query', 'Response']
    const csvContent = [
      headers.join(','),
      ...filteredChats.map(row => [
        `"${row.timestamp}"`,
        `"${row.category || 'General'}"`,
        `"${row.user_name || ''}"`,
        `"${row.email || ''}"`,
        `"${row.phone_number || ''}"`,
        `"${row.user_query.replace(/"/g, '""')}"`,
        `"${row.bot_response.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `chat_history_${new Date().toISOString().slice(0,10)}.csv`
    link.click()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center shrink-0">
          <h3 className="text-2xl font-bold text-white">Global Chat History</h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2"><X size={24} /></button>
        </div>
        
        {/* Filters */}
        <div className="bg-gray-50 border-b border-gray-200 shrink-0">
          <div className="px-4 pt-4 flex space-x-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${
                  categoryFilter === cat 
                    ? 'bg-white text-indigo-700 border-t border-l border-r border-gray-200 shadow-sm relative top-[1px]' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="p-4 bg-white flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3 border-t border-gray-200">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search history..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button onClick={fetchChatHistory} className="flex items-center justify-center space-x-2 bg-white border border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-lg">
              <RotateCw size={18} /> <span>Refresh</span>
            </button>
            <button onClick={handleDownload} disabled={filteredChats.length === 0} className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50">
              <Download size={18} /> <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="text-center py-20"><Spinner borderColor="border-indigo-600" /></div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-20 text-gray-500"><MessageCircle size={48} className="mx-auto mb-4 opacity-50" /><p>No chats found.</p></div>
          ) : (
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs text-gray-600 uppercase bg-gray-100 sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-6 py-3 w-32">Time</th>
                  <th className="px-6 py-3 w-24">Category</th>
                  <th className="px-6 py-3 w-48">User</th>
                  <th className="px-6 py-3">Query</th>
                  <th className="px-6 py-3">Bot Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredChats.map((chat) => (
                  <tr key={chat.id} className="bg-white hover:bg-indigo-50">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{new Date(chat.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-0.5 rounded border border-indigo-200">
                        {chat.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{chat.user_name || 'Anonymous'}</div>
                      <div className="text-xs text-gray-500">{chat.email}</div>
                    </td>
                    <td className="px-6 py-4"><div className="max-h-24 overflow-y-auto">{chat.user_query}</div></td>
                    <td className="px-6 py-4 bg-gray-50/50"><div className="max-h-24 overflow-y-auto italic text-xs text-gray-600">{chat.bot_response}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// --- User Queries Modal (Escalated/Solved View) ---
// Now supports Back Arrow and displays Category Badges
const UserQueriesModal = ({ user, onClose, onResolve, onBack, mode = 'escalated' }) => {
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
      let fetchedQueries = response.data
      if (isSolvedMode) {
        fetchedQueries = fetchedQueries.filter(q => q.status === 'Finished')
      } else {
        fetchedQueries = fetchedQueries.filter(q => q.status === 'Initiated')
      }
      setQueries(fetchedQueries)
    } catch (error) {
      console.error('Error fetching user queries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveSubmit = async () => {
    if (!remarks.trim()) { alert('Please enter remarks.'); return }
    try {
      await axios.put(`/api/admin/update-query/${selectedQuery.id}`, { status: 'Finished', remarks: remarks })
      alert('Query resolved!')
      setSelectedQuery(null)
      setRemarks('')
      fetchUserQueries()
      onResolve()
    } catch (error) {
      alert('Failed to resolve query.')
    }
  }

  const isSolved = mode === 'solved'
  const themeColor = isSolved ? 'green' : 'red'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in-up flex flex-col">
        {/* Header with Back Button */}
        <div className={`bg-gradient-to-r from-${themeColor}-600 to-${themeColor}-700 px-6 py-4 flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                <ArrowLeft size={24} />
              </button>
            )}
            <div>
              <h3 className="text-2xl font-bold text-white">{isSolved ? 'Solved Queries' : 'Escalated Queries'}</h3>
              <p className="text-white/80 text-sm">{user.user_name} ({user.email})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2"><X size={24} /></button>
        </div>
        
        {/* Queries List */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          {loading ? (
            <div className="py-12"><Spinner borderColor={`border-${themeColor}-600`} /></div>
          ) : queries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No queries found.</div>
          ) : (
            <div className="space-y-4">
              {queries.map((query) => (
                <div key={query.id} className={`bg-white rounded-lg p-5 border-l-4 border-${themeColor}-500 shadow-sm`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-500">{new Date(query.timestamp).toLocaleString()}</span>
                    {/* --- CATEGORY BADGE --- */}
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded border border-blue-200 uppercase tracking-wide">
                      {query.category || 'GENERAL'}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700">Query:</p>
                    <p className="text-gray-800 bg-gray-50 p-2 rounded border border-gray-100 mt-1">{query.query_text}</p>
                  </div>

                  {query.remarks && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-gray-700">Remarks:</p>
                      <p className="text-gray-700 bg-green-50 border border-green-100 rounded p-2 text-sm mt-1">{query.remarks}</p>
                    </div>
                  )}
                  
                  {!isSolved && selectedQuery?.id !== query.id && (
                    <button
                      onClick={() => setSelectedQuery(query)}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                      Resolve Query
                    </button>
                  )}

                  {!isSolved && selectedQuery?.id === query.id && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200 animate-fade-in">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Resolution Remarks</label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 mb-3 focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="Action taken..."
                        rows="2"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedQuery(null); setRemarks('') }} className="bg-gray-200 px-4 py-2 rounded text-gray-700 font-medium">Cancel</button>
                        <button onClick={handleResolveSubmit} className="bg-green-600 text-white px-4 py-2 rounded font-medium flex items-center gap-2">
                          <Send size={16} /> Mark Finished
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

// --- User Details Modal ---
const UserDetailsModal = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in-up">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">User Details</h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2"><X size={24} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center"><Users className="text-blue-600" size={32} /></div>
            <div><h4 className="text-2xl font-bold text-gray-800">{user.user_name}</h4><p className="text-gray-600">ID: #{user.id}</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded p-4"><p className="text-sm font-semibold text-gray-600">Email</p><p className="text-gray-800">{user.email}</p></div>
            <div className="bg-gray-50 rounded p-4"><p className="text-sm font-semibold text-gray-600">Phone</p><p className="text-gray-800">{user.phone_number || 'N/A'}</p></div>
            <div className="bg-gray-50 rounded p-4"><p className="text-sm font-semibold text-gray-600">First Seen</p><p className="text-gray-800">{new Date(user.first_seen).toLocaleString()}</p></div>
            <div className="bg-gray-50 rounded p-4"><p className="text-sm font-semibold text-gray-600">Last Seen</p><p className="text-gray-800">{new Date(user.last_seen).toLocaleString()}</p></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Escalated Users List Modal ---
const EscalatedUsersModal = ({ onClose, onUserSelect }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/admin/escalated-users').then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fade-in-up">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">Escalated Queries</h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? <div className="py-12"><Spinner borderColor="border-red-600"/></div> : users.length === 0 ? <div className="text-center py-12 text-gray-500">No users found</div> : (
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.email} onClick={() => onUserSelect(user)} className="bg-gray-50 hover:bg-red-50 p-4 rounded-lg cursor-pointer border-l-4 border-red-500 hover:shadow-md flex justify-between items-center group transition-all">
                  <div>
                    <p className="text-lg font-semibold text-gray-800 group-hover:text-red-700">{user.user_name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-right"><p className="text-2xl font-bold text-red-600">{user.query_count}</p><p className="text-xs text-gray-500">Queries</p></div>
                     <ChevronRight className="text-gray-400 group-hover:text-red-600" />
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

// --- Solved Users List Modal ---
const SolvedUsersModal = ({ onClose, onUserSelect }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/admin/solved-users').then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fade-in-up">
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-white">Solved Queries</h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? <div className="py-12"><Spinner borderColor="border-green-600"/></div> : users.length === 0 ? <div className="text-center py-12 text-gray-500">No users found</div> : (
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.email} onClick={() => onUserSelect(user)} className="bg-gray-50 hover:bg-green-50 p-4 rounded-lg cursor-pointer border-l-4 border-green-500 hover:shadow-md flex justify-between items-center group transition-all">
                  <div>
                    <p className="text-lg font-semibold text-gray-800 group-hover:text-green-700">{user.user_name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-right"><p className="text-2xl font-bold text-green-600">{user.query_count}</p><p className="text-xs text-gray-500">Solved</p></div>
                     <ChevronRight className="text-gray-400 group-hover:text-green-600" />
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

// --- Editor Details Modal (Fully Restored) ---
const EditorDetailsModal = ({ onClose }) => {
  const [view, setView] = useState('logs')
  const [logs, setLogs] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [logsRes, staffRes] = await Promise.all([
          axios.get('/api/admin/editor-logs', { params: { search: searchTerm, filter } }),
          axios.get('/api/admin/editor-staff')
        ])
        setLogs(logsRes.data)
        setStaff(staffRes.data)
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    fetchData()
  }, [searchTerm, filter])

  const filteredStaff = useMemo(() => staff.filter(s => s.staff_name.toLowerCase().includes(searchTerm.toLowerCase()) || s.staff_id.toLowerCase().includes(searchTerm.toLowerCase())), [staff, searchTerm])

  const handleDownload = () => window.open(`/api/admin/download-editor-logs?search=${encodeURIComponent(searchTerm)}&filter=${filter}`)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex justify-between items-center shrink-0">
          <h3 className="text-2xl font-bold text-white">Editor Details</h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2"><X size={24} /></button>
        </div>
        <div className="flex border-b border-gray-200 shrink-0">
          <button onClick={() => setView('logs')} className={`flex-1 py-4 font-semibold flex justify-center gap-2 ${view === 'logs' ? 'border-b-4 border-teal-600 text-teal-600' : 'text-gray-500'}`}><BookCopy size={18}/> Edit Logs</button>
          <button onClick={() => setView('staff')} className={`flex-1 py-4 font-semibold flex justify-center gap-2 ${view === 'staff' ? 'border-b-4 border-teal-600 text-teal-600' : 'text-gray-500'}`}><UserIcon size={18}/> Staff</button>
        </div>
        <div className="p-4 bg-gray-50 border-b flex gap-3 shrink-0">
          <div className="relative flex-1"><Search className="absolute left-3 top-3 text-gray-400" size={18} /><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"/></div>
          <select value={filter} onChange={e => setFilter(e.target.value)} disabled={view === 'staff'} className="border rounded-lg px-4 py-2"><option value="all">All Time</option><option value="10days">10 Days</option><option value="30days">30 Days</option></select>
          <button onClick={handleDownload} disabled={view === 'staff'} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"><Download size={18}/> Logs</button>
        </div>
        <div className="flex-1 overflow-y-auto p-0">
          {loading ? <div className="py-20 text-center"><Spinner borderColor="border-teal-600"/></div> : view === 'logs' ? (
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-100 uppercase text-xs text-gray-600 sticky top-0"><tr><th className="px-6 py-3">Time</th><th className="px-6 py-3">Staff</th><th className="px-6 py-3">Action</th><th className="px-6 py-3">Doc</th></tr></thead>
              <tbody className="divide-y">{logs.map(log => (<tr key={log.log_id} className="bg-white hover:bg-gray-50"><td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td><td className="px-6 py-4">{log.staff_name}</td><td className="px-6 py-4">{log.action_performed}</td><td className="px-6 py-4">{log.document_name}</td></tr>))}</tbody>
            </table>
          ) : (
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-100 uppercase text-xs text-gray-600 sticky top-0"><tr><th className="px-6 py-3">ID</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Last Login</th></tr></thead>
              <tbody className="divide-y">{filteredStaff.map(s => (<tr key={s.staff_id} className="bg-white hover:bg-gray-50"><td className="px-6 py-4 font-medium">{s.staff_id}</td><td className="px-6 py-4">{s.staff_name}</td><td className="px-6 py-4">{s.last_login ? new Date(s.last_login).toLocaleString() : 'Never'}</td></tr>))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Generic User List Modal (Today / All Users) ---
const GenericUserListModal = ({ title, color, endpoint, onClose }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    axios.get(endpoint).then(r => setUsers(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [endpoint])

  if (selectedUser) return <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} />

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-fade-in-up">
        <div className={`bg-gradient-to-r from-${color}-600 to-${color}-700 px-6 py-4 flex justify-between items-center`}>
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
           {loading ? <div className="py-12"><Spinner borderColor={`border-${color}-600`}/></div> : users.length === 0 ? <div className="text-center py-12 text-gray-500">No users found</div> : (
             <div className="space-y-3">
               {users.map(u => (
                 <div key={u.id} onClick={() => setSelectedUser(u)} className={`bg-gray-50 hover:bg-${color}-50 p-4 rounded-lg cursor-pointer border-l-4 border-${color}-500 hover:shadow-md flex justify-between items-center group transition-all`}>
                   <div><p className="text-lg font-semibold group-hover:text-${color}-700">{u.user_name}</p><p className="text-sm text-gray-600">{u.email}</p></div>
                   <ChevronRight className="text-gray-400 group-hover:text-${color}-600" />
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
  
  const [stats, setStats] = useState({ totalUniqueUsers: 0, todayUsers: 0, totalEscalated: 0, totalSolved: 0 })

  // Modal States
  const [activeModal, setActiveModal] = useState(null) // 'escalated', 'solved', 'today', 'all', 'editor', 'chat', 'config'
  const [selectedUser, setSelectedUser] = useState(null)
  
  // Session Timeout
  const [lastActivity, setLastActivity] = useState(Date.now())

  useEffect(() => {
    const adminAuth = localStorage.getItem('bitChatbotAdmin')
    if (adminAuth === 'true') {
      setIsAuthenticated(true)
      fetchStats()
    }
  }, [])

  // Session Timeout Effect (5 Minutes)
  useEffect(() => {
    if (!isAuthenticated) return
    const handleActivity = () => setLastActivity(Date.now())
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keypress', handleActivity)
    window.addEventListener('click', handleActivity)

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > 300000) { // 300,000 ms = 5 mins
        handleLogout()
        alert('Session timed out due to inactivity.')
      }
    }, 1000)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keypress', handleActivity)
      window.removeEventListener('click', handleActivity)
      clearInterval(interval)
    }
  }, [isAuthenticated, lastActivity])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/admin/stats')
      setStats(response.data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    if (email === 'bit.admin.chat.sathy@bitsathy.ac.in' && password === 'bit.chat.sathy@123') {
      setIsAuthenticated(true)
      localStorage.setItem('bitChatbotAdmin', 'true')
      setLastActivity(Date.now())
      fetchStats()
    } else {
      setError('Invalid email or password')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('bitChatbotAdmin')
    setActiveModal(null)
    setSelectedUser(null)
    navigate('/')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-white" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-gray-800">Admin Login</h2>
            <p className="text-gray-600 mt-2">BIT Chatbot Administration</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Email</label><div className="relative"><Mail className="absolute left-3 top-3.5 text-gray-400" size={20} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none" required /></div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Password</label><div className="relative"><Lock className="absolute left-3 top-3.5 text-gray-400" size={20} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none" required /></div></div>
            <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 rounded-lg transition-transform hover:scale-[1.02] shadow-lg">Login</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <>
      {activeModal === 'escalated' && <EscalatedUsersModal onClose={() => setActiveModal(null)} onUserSelect={(user) => { setSelectedUser(user); setActiveModal('user_queries_escalated') }} />}
      {activeModal === 'solved' && <SolvedUsersModal onClose={() => setActiveModal(null)} onUserSelect={(user) => { setSelectedUser(user); setActiveModal('user_queries_solved') }} />}
      
      {/* Detail View with BACK Logic */}
      {selectedUser && (activeModal === 'user_queries_escalated' || activeModal === 'user_queries_solved') && (
        <UserQueriesModal 
          user={selectedUser}
          mode={activeModal === 'user_queries_solved' ? 'solved' : 'escalated'}
          onClose={() => { setSelectedUser(null); setActiveModal(null) }}
          onResolve={fetchStats}
          onBack={() => {
            setActiveModal(activeModal === 'user_queries_solved' ? 'solved' : 'escalated')
            setSelectedUser(null)
          }}
        />
      )}

      {activeModal === 'today' && <GenericUserListModal title="Today's Active Users" color="blue" endpoint="/api/admin/today-users" onClose={() => setActiveModal(null)} />}
      {activeModal === 'all' && <GenericUserListModal title="All Registered Users" color="purple" endpoint="/api/admin/all-users" onClose={() => setActiveModal(null)} />}
      {activeModal === 'editor' && <EditorDetailsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'chat' && <ChatHistoryModal onClose={() => setActiveModal(null)} />}
      

      <div className="min-h-screen bg-gray-50">
        <nav className="bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-xl sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-900 font-bold text-xl">A</div>
              <div><h1 className="text-xl font-bold">Admin Dashboard</h1></div>
            </div>
            <div className="flex items-center space-x-3">
              
              <button onClick={() => navigate('/editor')} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 px-3 py-2 rounded-lg transition-colors text-sm text-black font-medium"><Edit size={16} /> <span className="hidden sm:inline">Editor</span></button>
              <button onClick={fetchStats} className="p-2 hover:bg-white/10 rounded-full"><RotateCw size={20} className={loading ? 'animate-spin' : ''} /></button>
              <button onClick={handleLogout} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg transition-colors text-sm shadow"><LogOut size={16} /> Logout</button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <DashboardCard title="Escalated Queries" count={stats.totalEscalated} icon={<MessageSquare size={32}/>} color="red" onClick={() => setActiveModal('escalated')} />
            <DashboardCard title="Today's Users" count={stats.todayUsers} icon={<Clock size={32}/>} color="blue" onClick={() => setActiveModal('today')} />
            <DashboardCard title="Total Users" count={stats.totalUniqueUsers} icon={<Users size={32}/>} color="purple" onClick={() => setActiveModal('all')} />
            <DashboardCard title="Solved Queries" count={stats.totalSolved} icon={<CheckSquare size={32}/>} color="green" onClick={() => setActiveModal('solved')} />
            <DashboardCard title="Editor Details" label="Logs & Staff" icon={<BookUser size={32}/>} color="teal" onClick={() => setActiveModal('editor')} />
            <DashboardCard title="Global Chat History" label="View All Chats" icon={<MessageCircle size={32}/>} color="indigo" onClick={() => setActiveModal('chat')} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText size={20} className="text-blue-600"/> Dashboard Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <ul className="space-y-2">
                <li className="flex gap-2"><span className="text-red-500 font-bold">•</span> Escalated: Unresolved queries (categorized).</li>
                <li className="flex gap-2"><span className="text-blue-500 font-bold">•</span> Today's Users: Active right now.</li>
                <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Chat History: Searchable log with filters.</li>
              </ul>
              <ul className="space-y-2">
                 
                 <li className="flex gap-2"><span className="text-yellow-600 font-bold flex items-center"><Edit size={14} className="mr-1"/> Editor:</span> Update chatbot knowledge documents.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const DashboardCard = ({ title, count, label, icon, color, onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl shadow-lg border-l-4 border-${color}-500 p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group`}>
    <div className="flex justify-between items-start">
      <div><p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</p><h3 className={`text-4xl font-bold text-${color}-600 my-2`}>{count !== undefined ? count : label}</h3><p className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Click to view details &rarr;</p></div>
      <div className={`p-3 rounded-full bg-${color}-50 text-${color}-600 group-hover:bg-${color}-100 transition-colors`}>{icon}</div>
    </div>
  </div>
)

export default AdminPage