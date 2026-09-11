import React from 'react'
import Navbar from './Navbar'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Floating navbar */}
      <Navbar />

      {/* Main content with proper spacing for floating navbar */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
