import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Check auth status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await authAPI.me()
      setUser(response.data)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      await authAPI.login({ username, password })
      const response = await authAPI.me()
      setUser(response.data)
      toast.success('خوش آمدید!')

      // Redirect based on role
      if (response.data.role === 'ADMIN') {
        navigate('/admin')
      } else if (response.data.role === 'AGENT') {
        navigate('/agent')
      } else {
        navigate('/user')
      }

      return true
    } catch (error) {
      const message = error.response?.data?.detail || 'خطا در ورود'
      toast.error(message)
      return false
    }
  }

  const register = async (data) => {
    try {
      await authAPI.register(data)
      toast.success('ثبت‌نام با موفقیت انجام شد')
      navigate('/login')
      return true
    } catch (error) {
      const message = error.response?.data?.detail || 'خطا در ثبت‌نام'
      toast.error(message)
      return false
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      // Ignore logout errors
    }
    setUser(null)
    navigate('/login')
    toast.success('خروج موفق')
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isAgent: user?.role === 'AGENT',
    isEndUser: user?.role === 'END_USER',
    login,
    register,
    logout,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={value}>
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

export default useAuth
