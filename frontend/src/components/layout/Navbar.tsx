import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  Search,
  Sparkles,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  Shield,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/documents/upload', label: 'Upload', icon: UploadCloud },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/chat', label: 'AI Chat', icon: Sparkles },
]

interface NavbarProps {
  sidebarOpen?: boolean
  onMenuToggle?: () => void
}

export default function Navbar({ sidebarOpen, onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const initial = user?.name?.[0]?.toUpperCase() ?? '?'
  const firstName = user?.name ? user.name.split(' ')[0] : 'there'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Fixed floating navbar with glass morphism */}
      <motion.nav
        className="fixed top-4 left-0 right-0 z-40 flex justify-center px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-purple-500/10 px-4 py-2 flex items-center justify-between w-full max-w-6xl">
          {/* Left: Logo with gradient */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div 
              className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Sparkles size={18} className="text-white" />
              <motion.div 
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 blur-xl"
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <span className="hidden md:inline font-display font-bold text-xl bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Campus AI
            </span>
          </motion.div>

          {/* Center: Nav links (desktop only) */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`
                }
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Greeting (desktop) */}
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-xs text-white/50">Welcome</span>
              <span className="text-sm font-semibold text-white truncate">{firstName}</span>
            </div>
            {/* User menu (desktop) */}
            <div className="hidden md:flex items-center relative">
              <motion.button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-colors group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-display font-bold text-sm flex items-center justify-center shadow-lg shadow-purple-500/30">
                    {initial}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-purple-900" />
                </div>
                <ChevronDown size={16} className="text-white/60 group-hover:text-white transition-colors" />
              </motion.button>

              {/* User dropdown with glass morphism */}
              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <motion.div
                      className="absolute top-full right-0 mt-2 w-64 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-purple-500/20 p-2 z-50"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-white/10 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-white/50 truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            navigate('/profile-setup')
                            setUserMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                        >
                          <User size={16} />
                          Edit Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate('/settings')
                            setUserMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                        >
                          <Settings size={16} />
                          Settings
                        </button>
                        <button
                          onClick={() => {
                            navigate('/help')
                            setUserMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                        >
                          <HelpCircle size={16} />
                          Help & Support
                        </button>
                        <div className="border-t border-white/10 my-2" />
                        <button
                          onClick={() => {
                            handleLogout()
                            setUserMenuOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
                        >
                          <LogOut size={16} />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Backdrop for dropdown */}
              {userMenuOpen && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
              )}
            </div>

            {/* Mobile hamburger */}
            <motion.button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-white/10 transition-colors text-white"
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? (
                <X size={24} className="text-white" />
              ) : (
                <Menu size={24} className="text-white" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu with glass morphism */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop with blur */}
            <motion.div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu panel */}
            <motion.div
              className="fixed top-20 left-4 right-4 z-40 md:hidden"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-purple-500/20 p-4 space-y-2">
                {/* User info in mobile menu */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-white/50 truncate">{user?.email}</p>
                  </div>
                </div>

                {navItems.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                ))}

                <div className="border-t border-white/10 my-2 pt-2 space-y-1">
                  <button
                    onClick={() => {
                      navigate('/profile-setup')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <User size={16} />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}