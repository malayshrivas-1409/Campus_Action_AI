import React from 'react'
import { useAuthStore } from '@/store/authStore'
import { AppShell } from '@/components/layout'

export default function Settings() {
  const user = useAuthStore((s) => s.user)

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-4rem)] p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">Settings</h1>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-white/70 mb-4">Manage your account and preferences.</p>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-white/40">Name</p>
              <p className="text-sm font-medium text-white">{user?.name ?? '—'}</p>
            </div>

            <div>
              <p className="text-xs text-white/40">Email</p>
              <p className="text-sm font-medium text-white">{user?.email ?? '—'}</p>
            </div>

            <div>
              <p className="text-xs text-white/40">Student roll number</p>
              <p className="text-sm font-medium text-white">{user?.id ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
