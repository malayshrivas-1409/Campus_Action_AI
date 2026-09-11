import { Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'

interface TopbarProps {
  onMenuToggle: () => void
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const user = useAuthStore((s) => s.user)
  const initial = user?.name?.[0]?.toUpperCase() ?? '?'

  return (
    <motion.header 
      className="h-16 border-b border-white/10 bg-white/5 backdrop-blur-sm flex items-center px-4 gap-4 shrink-0 lg:px-6"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hamburger (mobile only) */}
      <motion.button
        type="button"
        onClick={onMenuToggle}
        className="lg:hidden text-white/60 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10"
        aria-label="Open sidebar"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Menu size={22} />
      </motion.button>

      {/* Brand with gradient */}
      <motion.span 
        className="font-display font-bold text-sm bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent lg:hidden"
        whileHover={{ scale: 1.02 }}
      >
        Campus AI
      </motion.span>

      <div className="flex-1" />

      {/* User avatar (desktop) with glass morphism */}
      <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200">
        <span className="text-sm text-white/60">{user?.email ?? ''}</span>
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="text-white font-bold text-xs">{initial}</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-purple-900" />
        </div>
      </div>

      {/* Mobile user avatar */}
      <div className="lg:hidden flex items-center">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span className="text-white font-bold text-xs">{initial}</span>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-purple-900" />
        </div>
      </div>
    </motion.header>
  )
}