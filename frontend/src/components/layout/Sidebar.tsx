import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Search,
  MessageSquare,
  Upload,
  LogOut,
  X,
  Sparkles,
  Settings,
  HelpCircle,
  User,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/documents/upload', label: 'Upload', icon: Upload },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/chat', label: 'AI Chat', icon: MessageSquare },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initial = user?.name?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      {/* Mobile overlay with blur */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel with glass morphism */}
      <motion.aside
        className={[
          'fixed top-0 left-0 h-full w-72 z-50',
          'bg-white/10 backdrop-blur-xl border-r border-white/20',
          'flex flex-col transition-all duration-300 ease-in-out',
          'lg:translate-x-0 shadow-2xl shadow-purple-500/10',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        initial={false}
        animate={{ x: open ? 0 : -288 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Brand + close */}
        <div className="flex items-center justify-between px-6 h-20 border-b border-white/10 shrink-0">
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
            <span className="font-display font-bold text-lg bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Campus AI
            </span>
          </motion.div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-white/60 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10'
                    : 'text-white/60 hover:text-white hover:bg-white/10',
                ].join(' ')
              }
            >
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
              {({ isActive }) => isActive && (
                <motion.div
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  layoutId="activeDot"
                />
              )}
            </NavLink>
          ))}

          {/* Divider */}
          <div className="border-t border-white/10 my-4" />

          {/* Additional nav items */}
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10'
                  : 'text-white/60 hover:text-white hover:bg-white/10',
              ].join(' ')
            }
          >
            <Settings size={18} className="shrink-0" />
            <span>Settings</span>
          </NavLink>
          <NavLink
            to="/help"
            onClick={onClose}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10'
                  : 'text-white/60 hover:text-white hover:bg-white/10',
              ].join(' ')
            }
          >
            <HelpCircle size={18} className="shrink-0" />
            <span>Help & Support</span>
          </NavLink>
        </nav>

        {/* User + Logout */}
        <div className="shrink-0 border-t border-white/10 px-4 py-4 space-y-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-white font-bold text-sm">{initial}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-purple-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name ?? 'User'}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={16} className="shrink-0" />
            <span>Sign out</span>
          </motion.button>
        </div>
      </motion.aside>
    </>
  )
}