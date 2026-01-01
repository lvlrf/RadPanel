import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/me/profile'),
  updateProfile: (data) => api.put('/users/me/profile', data),
  getWallet: () => api.get('/users/me/wallet'),
}

// Agents API (Admin)
export const agentsAPI = {
  list: (params) => api.get('/admin/agents', { params }),
  get: (id) => api.get(`/admin/agents/${id}`),
  create: (data) => api.post('/admin/agents', data),
  update: (id, data) => api.put(`/admin/agents/${id}`, data),
  delete: (id) => api.delete(`/admin/agents/${id}`),
  adjustCredit: (id, data) => api.post(`/admin/agents/${id}/credit`, data),
  enable: (id) => api.post(`/admin/agents/${id}/enable`),
}

// Plans API
export const plansAPI = {
  list: () => api.get('/plans'),
  get: (id) => api.get(`/plans/${id}`),
  create: (data) => api.post('/admin/plans', data),
  update: (id, data) => api.put(`/admin/plans/${id}`, data),
  delete: (id) => api.delete(`/admin/plans/${id}`),
}

// Payment Methods API
export const paymentMethodsAPI = {
  listPublic: () => api.get('/payment-methods'),
  listAdmin: () => api.get('/admin/payment-methods'),
  create: (data) => api.post('/admin/payment-methods', data),
  update: (id, data) => api.put(`/admin/payment-methods/${id}`, data),
  delete: (id) => api.delete(`/admin/payment-methods/${id}`),
}

// Payments API
export const paymentsAPI = {
  upload: (formData) => api.post('/payments/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  myPayments: (params) => api.get('/payments/my', { params }),
  list: (params) => api.get('/admin/payments', { params }),
  pending: (params) => api.get('/admin/payments/pending', { params }),
  approve: (id, data) => api.put(`/admin/payments/${id}/approve`, data),
  reject: (id, data) => api.put(`/admin/payments/${id}/reject`, data),
}

// Orders API
export const ordersAPI = {
  create: (data) => api.post('/orders', data),
  myOrders: (params) => api.get('/orders/my', { params }),
  get: (id) => api.get(`/orders/${id}`),
  delete: (id) => api.delete(`/orders/${id}`),
  list: (params) => api.get('/orders', { params }),
}

// Marzban API
export const marzbanAPI = {
  checkUsername: (username) => api.get(`/marzban/check-username/${username}`),
  getUser: (username) => api.get(`/marzban/user/${username}`),
  health: () => api.get('/marzban/health'),
}

// Reports API (Admin)
export const reportsAPI = {
  export: (params) => api.get('/admin/reports/export', {
    params,
    responseType: 'blob'
  }),
  stats: () => api.get('/admin/reports/stats'),
}

export default api
