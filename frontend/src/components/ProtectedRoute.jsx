import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />
    } else if (user.role === 'AGENT') {
      return <Navigate to="/agent" replace />
    } else {
      return <Navigate to="/user" replace />
    }
  }

  return children
}

export default ProtectedRoute
