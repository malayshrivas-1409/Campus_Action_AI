import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AppShell } from '@/components/layout'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ProfileSetup from '@/pages/ProfileSetup'
import Dashboard from '@/pages/Dashboard'
import DocumentUpload from '@/pages/DocumentUpload'
import DocumentList from '@/pages/DocumentList'
import DocumentView from '@/pages/DocumentView'
import Search from '@/pages/Search'
import Chat from '@/pages/Chat'
import Settings from '@/pages/Settings'
import { useAuthStore } from '@/store/authStore'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)
  const tokenExpiresAt = useAuthStore((state) => state.tokenExpiresAt)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  useEffect(() => {
    if (token && tokenExpiresAt && tokenExpiresAt < Date.now()) {
      logout()
      navigate('/login')
    }
    if (token && !tokenExpiresAt) {
      logout()
      navigate('/login')
    }
  }, [token, tokenExpiresAt, logout, navigate])

  const isValid = Boolean(token && tokenExpiresAt && tokenExpiresAt > Date.now())

  if (isValid && !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white/60 text-sm">
        Loading your session…
      </div>
    )
  }

  return isValid ? <AppShell>{children}</AppShell> : <Navigate to="/login" replace />
}

function AuthGate() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return null
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthGate />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected routes with AppShell */}
          <Route
            path="/profile-setup"
            element={
              <PrivateRoute>
                <ProfileSetup />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <PrivateRoute>
                <DocumentList />
              </PrivateRoute>
            }
          />
          <Route
            path="/documents/upload"
            element={
              <PrivateRoute>
                <DocumentUpload />
              </PrivateRoute>
            }
          />
          <Route
            path="/documents/:documentId"
            element={
              <PrivateRoute>
                <DocumentView />
              </PrivateRoute>
            }
          />
          <Route
            path="/search"
            element={
              <PrivateRoute>
                <Search />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          
          {/* Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '0.75rem',
              color: '#f1f5f9',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
              fontSize: '0.875rem',
              padding: '12px 16px',
            },
            success: {
              style: {
                border: '1px solid rgba(74, 222, 128, 0.3)',
                background: 'rgba(15, 23, 42, 0.95)',
              },
              iconTheme: {
                primary: '#4ade80',
                secondary: '#0f172a',
              },
              duration: 3000,
            },
            error: {
              style: {
                border: '1px solid rgba(248, 113, 113, 0.3)',
                background: 'rgba(15, 23, 42, 0.95)',
              },
              iconTheme: {
                primary: '#f87171',
                secondary: '#0f172a',
              },
              duration: 5000,
            },
            loading: {
              style: {
                border: '1px solid rgba(168, 85, 247, 0.3)',
                background: 'rgba(15, 23, 42, 0.95)',
              },
              iconTheme: {
                primary: '#a855f7',
                secondary: '#0f172a',
              },
            },
          }}
        />
      </Router>
    </ErrorBoundary>
  )
}

export default App