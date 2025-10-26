import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'

const Navbar = ({ showLogout = true }) => {
  const navigate = useNavigate()
  
  const handleLogout = () => {
    localStorage.removeItem('bitChatbotUser')
    // Also remove admin auth if it exists
    localStorage.removeItem('bitChatbotAdmin')
    navigate('/')
  }
  
  return (
    <nav className="bg-bit-primary text-white shadow-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-bit-primary font-bold text-xl">B</span>
          </div>
          <div>
            <h1 className="text-xl font-bold">BIT Chatbot</h1>
            <p className="text-xs text-blue-200">Bannari Amman Institute of Technology</p>
          </div>
        </div>
        
        {showLogout && (
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navbar
