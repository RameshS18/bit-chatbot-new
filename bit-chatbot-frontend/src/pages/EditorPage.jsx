import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Lock, Mail, LogOut, User, FileText, Plus, Save, Trash2,
  ChevronLeft, Loader2, Search, X, UserCheck, Eye, UploadCloud, Folder, Upload,
  Download, FolderOpen, File as FileIcon // <-- New icons
} from 'lucide-react'

// Helper component for loading spinners
const Spinner = ({ size = 20 }) => (
  <Loader2 size={size} className="animate-spin" />
)

// Helper component for toast-like messages
const Toast = ({ message, type, onClose }) => {
  const isError = type === 'error'
  const bgColor = isError ? 'bg-red-600' : 'bg-green-600'
  const textColor = 'text-white'

  useEffect(() => {
    const timer = setTimeout(() => onClose(), 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed top-5 right-5 ${bgColor} ${textColor} px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50`}>
      <span>{message}</span>
      <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1">
        <X size={18} />
      </button>
    </div>
  )
}

// --- Login Step 1: Static Admin Login ---
const EditorLoginStep1 = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await axios.post('/api/editor/login', { email, password })
      if (response.data.status === 'success') {
        onLoginSuccess()
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800">Document Editor Login</h2>
        <p className="text-gray-600 mt-2">Step 1: Admin Verification</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Editor Admin Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
              placeholder="editor.bitra@bitsathy.ac.in"
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
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 rounded-lg transition-all shadow-lg flex items-center justify-center"
        >
          {loading ? <Spinner /> : 'Login - Step 1'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/admin')}
          className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Admin Dashboard
        </button>
      </div>
    </div>
  )
}

// --- Login Step 2: Staff Verification ---
const EditorLoginStep2 = ({ onStaffVerified }) => {
  const [staffId, setStaffId] = useState('')
  const [staffName, setStaffName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await axios.post('/api/editor/verify-staff', {
        staff_id: staffId,
        staff_name: staffName
      })
      if (response.data.status === 'success') {
        onStaffVerified(response.data.staff_id, response.data.session_id)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please check details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserCheck className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800">Staff Verification</h2>
        <p className="text-gray-600 mt-2">Step 2: Please verify your identity</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Staff ID</label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              placeholder="e.g., BIT-STAFF-101"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Staff Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              placeholder="e.g., Dr. S. Ramesh"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg transition-all shadow-lg flex items-center justify-center"
        >
          {loading ? <Spinner /> : 'Verify and Enter Editor'}
        </button>
      </form>
    </div>
  )
}

// --- NEW: File Browser Modal Component ---
const FileBrowserModal = ({ allFiles, onFileSelect, onClose }) => {
  const [selectedFolder, setSelectedFolder] = useState('Main Folder')
  const [searchTerm, setSearchTerm] = useState('')

  // This logic processes the file list once and is fast
  const { folders, filesByFolder } = useMemo(() => {
    const folders = new Set(['Main Folder'])
    const filesByFolder = { 'Main Folder': [] }

    allFiles.forEach(file => {
      if (file.includes('/')) {
        const folder = file.split('/')[0]
        folders.add(folder)
        if (!filesByFolder[folder]) {
          filesByFolder[folder] = []
        }
        filesByFolder[folder].push(file)
      } else {
        filesByFolder['Main Folder'].push(file)
      }
    })
    return { folders: Array.from(folders).sort(), filesByFolder }
  }, [allFiles])

  // Filter files based on search term
  const filteredFiles = useMemo(() => {
    if (!searchTerm) {
      return filesByFolder[selectedFolder]
    }
    return filesByFolder[selectedFolder].filter(file =>
      file.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [searchTerm, selectedFolder, filesByFolder])

  const handleSelect = (file) => {
    onFileSelect(file)
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 p-4 backdrop-blur-sm"
      onClick={onClose} // Close modal on background click
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800">Browse Files</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-200 hover:text-gray-800 rounded-full p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex min-h-0">
          {/* Folder List */}
          <div className="w-1/3 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <ul className="divide-y divide-gray-200">
              {folders.map(folder => (
                <li
                  key={folder}
                  onClick={() => {
                    setSelectedFolder(folder)
                    setSearchTerm('') // Clear search when changing folder
                  }}
                  className={`p-4 flex items-center space-x-3 cursor-pointer transition-colors ${
                    selectedFolder === folder
                      ? 'bg-yellow-100 text-yellow-800 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FolderOpen size={18} />
                  <span>{folder}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* File List */}
          <div className="w-2/3 flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={`Search in ${selectedFolder}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredFiles.length === 0 ? (
                 <div className="p-10 text-center text-gray-500">
                   <FileIcon size={40} className="mx-auto mb-2" />
                   No files found.
                 </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredFiles.map(file => (
                    <li
                      key={file}
                      onClick={() => handleSelect(file)}
                      className="p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <FileText size={18} className="text-gray-500" />
                      {/* Show only the filename, not the full path */}
                      <span className="text-gray-800">{file.split('/').pop()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
// --- END: File Browser Modal Component ---

// --- Main Editor Interface ---
const EditorInterface = ({ staffId, sessionId, onLogout }) => {
  const navigate = useNavigate()
  const [allFiles, setAllFiles] = useState([]) // --- RENAMED
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [isEditorLoading, setIsEditorLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)
  
  const [newFileName, setNewFileName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState('Main Folder')
  const [fileToUpload, setFileToUpload] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // --- NEW: Modal State ---
  const [showFileBrowser, setShowFileBrowser] = useState(false)

  const isReadOnly = (filename) => {
    if (!filename) return false;
    const lowerFile = filename.toLowerCase()
    return !lowerFile.endsWith('.txt') && !lowerFile.endsWith('.md')
  }
  
  const readOnly = isReadOnly(selectedFile)

  useEffect(() => {
    fetchDocuments()
    fetchFolders()
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await axios.get('/api/editor/get-documents')
      setAllFiles(response.data.sort()) // --- RENAMED
    } catch (err) {
      setError('Failed to fetch documents.')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchFolders = async () => {
    try {
      const response = await axios.get('/api/editor/get-folders')
      setFolders(response.data)
    } catch (err) {
      showToast('Failed to fetch folder list', 'error')
    }
  }

  const handleFileSelect = async (filename) => {
    if (isSaving || isCommitting || isUploading) {
      showToast('Cannot change file while working', 'error')
      return
    }
    try {
      setIsEditorLoading(true)
      setIsCreating(false)
      setSelectedFile(filename)
      setFileContent('')
      const response = await axios.post('/api/editor/get-document-content', { filename })
      if (response.data && typeof response.data.content === 'string') {
        setFileContent(response.data.content)
        if (isReadOnly(filename)) {
          showToast('This file is read-only. Editing is disabled.', 'success')
        }
      } else {
        setFileContent('Error: Could not read file content.')
        showToast('Could not read file content', 'error')
      }
    } catch (err) {
      showToast('Failed to load file content', 'error')
    } finally {
      setIsEditorLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedFile || readOnly) return
    setIsSaving(true)
    try {
      const response = await axios.post('/api/editor/update-document', {
        filename: selectedFile,
        content: fileContent,
        staff_id: staffId
      })
      showToast(response.data.message, 'success')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save file', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedFile) return
    if (!window.confirm(`Are you sure you want to delete ${selectedFile}? You must click "Commit to RAG" after to update the bot.`)) {
      return
    }
    setIsSaving(true)
    try {
      const response = await axios.post('/api/editor/delete-document', {
        filename: selectedFile,
        staff_id: staffId
      })
      showToast(response.data.message, 'success')
      setSelectedFile(null)
      setFileContent('')
      fetchDocuments()
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete file', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateNewTextFile = () => {
    setSelectedFile(null)
    setFileContent('')
    setNewFileName('')
    setIsCreating(true)
  }

  const handleSaveNewTextFile = async () => {
    if (!newFileName.trim()) {
      showToast('New filename cannot be empty', 'error')
      return
    }
    setIsSaving(true)
    try {
      const response = await axios.post('/api/editor/add-document', {
        filename: newFileName,
        content: fileContent,
        staff_id: staffId,
        folder: selectedFolder
      })
      showToast(response.data.message, 'success')
      setIsCreating(false)
      setNewFileName('')
      setFileContent('')
      fetchDocuments()
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create file', 'error')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFileToUpload(e.target.files[0])
    }
  }
  
  const handleUpload = async () => {
    if (!fileToUpload) {
      showToast('Please select a file to upload first', 'error')
      return
    }
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', fileToUpload)
    formData.append('folder', selectedFolder)
    formData.append('staff_id', staffId)
    
    try {
      const response = await axios.post('/api/editor/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      showToast(response.data.message, 'success')
      fetchDocuments()
      setFileToUpload(null)
      document.getElementById('file-upload-input').value = null
    } catch (err) {
       showToast(err.response?.data?.error || 'Failed to upload file', 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = () => {
    if (!selectedFile) return;
    try {
      window.open(`/api/editor/download-file?filename=${encodeURIComponent(selectedFile)}`)
    } catch (err) {
      showToast('Failed to download file', 'error')
    }
  }
  
  const handleCommit = async () => {
    if (isSaving || isCommitting || isUploading) {
       showToast('Please wait for other operations to finish', 'error')
       return
    }
    if (!window.confirm('This will rebuild the RAG index with all saved changes. This may take a moment. Continue?')) {
      return
    }
    setIsCommitting(true)
    try {
      const response = await axios.post('/api/editor/commit-index', {
        staff_id: staffId
      })
      showToast(response.data.message, 'success')
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to commit changes', 'error')
    } finally {
      setIsCommitting(false)
    }
  }

  return (
    <>
      {/* --- NEW: Render the modal if showFileBrowser is true --- */}
      {showFileBrowser && (
        <FileBrowserModal
          allFiles={allFiles}
          onClose={() => setShowFileBrowser(false)}
          onFileSelect={handleFileSelect}
        />
      )}
    
      <div className="min-h-screen w-full flex bg-gray-100">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* --- Sidebar --- */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">RAG Documents</h2>
            <p className="text-sm text-gray-500">Logged in as {staffId}</p>
          </div>

          {/* --- MODIFIED: "Browse" button --- */}
          <div className="p-4">
            <button
              onClick={() => setShowFileBrowser(true)} // <-- Open modal
              className="w-full flex items-center justify-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              <FolderOpen size={18} />
              <span>Browse / Select File</span>
            </button>
          </div>
          
          {/* --- UPLOAD SECTION --- */}
          <div className="p-4 border-t border-b border-gray-200 bg-gray-50 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">UPLOAD / REPLACE FILE</h3>
            <div>
              <label className="text-xs font-medium text-gray-600">Choose Location</label>
              <div className="relative mt-1">
                <Folder className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                >
                  {folders.map(folder => (
                    <option key={folder} value={folder}>{folder}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Select File</label>
               <input
                id="file-upload-input"
                type="file"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading || !fileToUpload}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isUploading ? <Spinner /> : <Upload size={18} />}
              <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
            </button>
          </div>
          
          {/* --- COMMIT BUTTON --- */}
          <div className="p-4">
             <button
              onClick={handleCommit}
              disabled={isSaving || isCommitting || isUploading}
              className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
              title="Rebuild the RAG index with all changes"
            >
              {isCommitting ? <Spinner /> : <UploadCloud size={18} />}
              <span>Commit to RAG</span>
            </button>
          </div>

          {/* --- REMOVED: Long file list --- */}
          {/* The flex-1 just fills the empty space now */}
          <div className="flex-1 overflow-y-auto"></div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-2">
             <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} />
              <span>Admin Dashboard</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Logout Editor</span>
            </button>
          </div>
        </div>

        {/* --- Main Editor Area --- */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="h-16 bg-white border-b border-gray-200 flex justify-between items-center px-6 shadow-sm">
            {isCreating ? (
              <div className="flex-1 flex items-center">
                <input
                  type="text"
                  placeholder="Enter new .txt filename..."
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-1/2 text-lg font-semibold text-gray-800 border-b-2 border-gray-300 focus:border-green-500 outline-none"
                />
              </div>
            ) : (
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedFile ? selectedFile : 'Select a file to view or upload a new file'}
              </h2>
            )}

            <div>
              {isCreating ? (
                // --- Buttons for NEW .txt file ---
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                  > Cancel </button>
                  <button
                    onClick={handleSaveNewTextFile}
                    disabled={isSaving || isCommitting || isUploading}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2"
                  >
                    {isSaving ? <Spinner /> : <Save size={18} />}
                    <span>Save New Text File</span>
                  </button>
                </div>
              ) : selectedFile ? (
                // --- Buttons for EXISTING file ---
                <div className="flex space-x-3">
                  <button
                    onClick={handleDownload}
                    disabled={isSaving || isCommitting || isEditorLoading || isUploading}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                    title="Download this file"
                  >
                    <Download size={18} />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isSaving || isCommitting || isEditorLoading || isUploading}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                    title="Delete file (does not commit)"
                  >
                    <Trash2 size={18} />
                    <span>Delete</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || isCommitting || isEditorLoading || readOnly || isUploading}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={readOnly ? 'Cannot edit this file type' : 'Save changes (does not commit)'}
                  >
                    {isSaving ? <Spinner /> : <Save size={18} />}
                    <span>Save Changes</span>
                  </button>
                </div>
              ) : (
                // --- "New Text File" button when nothing is selected ---
                 <button
                    onClick={handleCreateNewTextFile}
                    className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    <Plus size={18} />
                    <span>New Text File</span>
                  </button>
              )}
            </div>
          </div>

          {/* Text Area */}
          <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
            {isEditorLoading ? (
              <div className="flex items-center justify-center h-full"> <Spinner size={40} /> </div>
            ) : (selectedFile || isCreating) ? (
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                disabled={isSaving || isCommitting || readOnly || isUploading}
                readOnly={readOnly}
                className={`w-full h-full p-6 bg-white rounded-lg shadow-inner border border-gray-300 resize-none font-mono text-sm outline-none focus:ring-2 focus:ring-yellow-500 ${
                  readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                placeholder={isCreating ? "Start typing your new .txt file content..." : (readOnly ? "--- This file is read-only. Download it and upload a new version to change it. ---" : "")}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FileText size={64} />
                <p className="mt-4 text-lg">Select a document from the list to view</p>
                <p>or</p>
                <p className="text-lg">Upload a new file using the sidebar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// --- Main Page Component ---
const EditorPage = () => {
  const [authStep, setAuthStep] = useState(1)
  const [staffId, setStaffId] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const navigate = useNavigate()

  const handleStep1Success = () => {
    sessionStorage.setItem('editorStep1', 'true')
    setAuthStep(2)
  }

  const handleStep2Success = (verifiedStaffId, newSessionId) => {
    sessionStorage.setItem('editorStep2', verifiedStaffId)
    sessionStorage.setItem('editorSession', newSessionId)
    setStaffId(verifiedStaffId)
    setSessionId(newSessionId)
    setAuthStep(3)
  }

  const handleLogout = async () => {
    if (sessionId) {
      try {
        await axios.post('/api/editor/logout', { session_id: sessionId })
      } catch (err) {
        console.error("Failed to log out session on backend", err)
      }
    }
    sessionStorage.removeItem('editorStep1')
    sessionStorage.removeItem('editorStep2')
    sessionStorage.removeItem('editorSession')
    setAuthStep(1)
    setStaffId(null)
    setSessionId(null)
    navigate('/admin')
  }

  useEffect(() => {
    const step1 = sessionStorage.getItem('editorStep1')
    const step2 = sessionStorage.getItem('editorStep2')
    const session = sessionStorage.getItem('editorSession')

    if (step1 === 'true' && step2 && session) {
      setStaffId(step2)
      setSessionId(session)
      setAuthStep(3)
    } else if (step1 === 'true') {
      setAuthStep(2)
    }
  }, [])

  const renderAuthStep = () => {
    switch (authStep) {
      case 1:
        return <EditorLoginStep1 onLoginSuccess={handleStep1Success} />
      case 2:
        return <EditorLoginStep2 onStaffVerified={handleStep2Success} />
      case 3:
        return <EditorInterface staffId={staffId} sessionId={sessionId} onLogout={handleLogout} />
      default:
        return <EditorLoginStep1 onLoginSuccess={handleStep1Success} />
    }
  }

  // --- NEW: Add CSS for the modal animation ---
  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate3d(0, 30px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .backdrop-blur-sm {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        {renderAuthStep()}
      </div>
    </>
  )
}

export default EditorPage