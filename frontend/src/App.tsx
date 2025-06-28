import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { lazy, Suspense } from 'react'
import { useAuthSession } from './stores/authSession'
import './App.css'

// Lazy load components
const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

const queryClient = new QueryClient()

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthSession()
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Auth Route component (redirects to dashboard if already logged in)
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthSession()
  
  if (token) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={
          <div className="h-screen flex items-center justify-center">
            <div className="text-gray-600">Loading...</div>
          </div>
        }>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={
              <AuthRoute>
                <Login />
              </AuthRoute>
            } />
            <Route path="/signup" element={
              <AuthRoute>
                <Signup />
              </AuthRoute>
            } />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }>
              <Route path="ideas/new" element={null} />
              <Route path="ideas/:id" element={null} />
            </Route>
            
            {/* Redirect root to login/dashboard based on auth state */}
            <Route path="/" element={
              <Navigate to="/dashboard" replace />
            } />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
