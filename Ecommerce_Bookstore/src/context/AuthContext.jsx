import { createContext, useContext, useState, useEffect } from 'react'
import api from '../config/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  }

  const verifyOtpLogin = async (email, otp, purpose = 'login') => {
    const response = await api.post('/auth/verify-otp', { email, otp, purpose })
    const { token, user: userData } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const resendOtp = async (email, purpose = 'login') => {
    const response = await api.post('/auth/resend-otp', { email, purpose })
    return response.data
  }

  const register = async (data) => {
    const response = await api.post('/auth/register', data)
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateProfile = async (data) => {
    const response = await api.put('/auth/profile', data)
    const userData = response.data.user
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const changePassword = async (data) => {
    await api.put('/auth/change-password', data)
  }

  const sendOtp = async (email, purpose) => {
    const response = await api.post('/otp/send', { email, purpose })
    return response.data
  }

  const verifyOtp = async (email, otp, purpose) => {
    const response = await api.post('/otp/verify', { email, otp, purpose })
    return response.data
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, verifyOtpLogin, resendOtp, register, logout, updateProfile, changePassword, sendOtp, verifyOtp }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
