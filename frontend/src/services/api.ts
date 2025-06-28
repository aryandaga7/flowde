import axios from 'axios'
import type { IdeaChatResponse, IdeaSession } from '../types/idea'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

// Helper function to get the JWT token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Auth related API calls
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_BASE_URL}/login`, 
      { email, password },
      { 
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      }
    )
    return response.data
  },

  signup: async (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
  }) => {
    const response = await axios.post(`${API_BASE_URL}/signup`, 
      userData,
      { 
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      }
    )
    return response.data
  },

  googleLogin: async (token: string) => {
    const formData = new FormData()
    formData.append('token', token)
    const response = await axios.post(`${API_BASE_URL}/google-login`, 
      formData,
      { 
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response.data
  },

  forgotPassword: async (email: string) => {
    const formData = new FormData()
    formData.append('email', email)
    const response = await axios.post(`${API_BASE_URL}/forgot-password`, 
      formData,
      { 
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return response.data
  },

  getCurrentUser: async () => {
    const response = await axios.get(`${API_BASE_URL}/me`, {
      withCredentials: true,
      headers: { ...getAuthHeaders() }
    })
    return response.data
  }
}

// Idea chat related API calls
export const ideaApi = {
  // Create a new session
  createSession: async () => {
    const response = await api.post<IdeaSession>('/api/idea/sessions', {}, {
      headers: { ...getAuthHeaders() }
    })
    return response.data
  },

  sendMessage: async (sessionId: string, userMsg: string): Promise<IdeaChatResponse> => {
    const response = await api.post<IdeaChatResponse>('/api/idea/message', 
      { 
        session_id: sessionId,
        user_msg: userMsg
      },
      { headers: { ...getAuthHeaders() } }
    )
    return response.data
  },

  // Get all idea sessions for the current user
  getSessions: async () => {
    const response = await api.get('/api/idea/sessions', {
      headers: { ...getAuthHeaders() }
    })
    return response.data
  },

  // Get a specific idea session
  getSession: async (sessionId: string) => {
    const response = await api.get(`/api/idea/sessions/${sessionId}`, {
      headers: { ...getAuthHeaders() }
    })
    return response.data
  },

  // Get messages and spec for a session
  getSessionMessages: async (sessionId: string) => {
    const response = await api.get(`/api/idea/sessions/${sessionId}/messages`, {
      headers: { ...getAuthHeaders() }
    })
    return response.data
  }
}

// Add axios interceptor for handling auth errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear auth data
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
) 