import React from 'react'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const userData = localStorage.getItem('bitChatbotUser')
  
  if (!userData) {
    return <Navigate to="/" replace />
  }
  
  return children
}

export default ProtectedRoute
