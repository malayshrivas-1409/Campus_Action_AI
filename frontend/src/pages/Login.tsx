import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Sparkles, ArrowRight, Shield, Zap, BookOpen } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Button from '@/components/primitives/Button'
import Input from '@/components/primitives/Input'

// Animated background particles
const BackgroundParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, -10, 0],
            opacity: [0.1, 0.5, 0.1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Animated floating icons
const FloatingIcons = () => {
  const icons = [
    { Icon: BookOpen, delay: 0, x: 10, y: 20 },
    { Icon: Zap, delay: 2, x: -15, y: 30 },
    { Icon: Shield, delay: 4, x: 20, y: 10 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map(({ Icon, delay, x, y }, i) => (
        <motion.div
          key={i}
          className="absolute text-white/20"
          style={{
            left: `${20 + i * 30}%`,
            top: `${10 + i * 25}%`,
          }}
          animate={{
            y: [y, y - 20, y],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 8,
            delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Icon size={40} />
        </motion.div>
      ))}
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [isFocused, setIsFocused] = useState<'email' | 'password' | null>(null)

  const validate = () => {
    const errs: typeof fieldErrors = {}
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) errs.email = 'Enter a valid email address'
    if (!password) errs.password = 'Password is required'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})
    await login({ email: email.trim(), password })
    const { token } = useAuthStore.getState()
    if (token) navigate('/dashboard')
  }

  // Gradient animation variants
  const gradientVariants = {
    animate: {
      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      transition: {
        duration: 15,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 opacity-30"
        variants={gradientVariants}
        animate="animate"
        style={{
          background: 'linear-gradient(-45deg, #4F46E5, #7C3AED, #EC4899, #4F46E5)',
          backgroundSize: '400% 400%',
        }}
      />

      {/* Animated grid overlay - Fixed SVG with escaped characters */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Particles */}
      <BackgroundParticles />
      <FloatingIcons />

      {/* Main content */}
      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Logo mark with glow */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full bg-purple-500/30 blur-2xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/50">
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        >
          {/* Headline with gradient text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-4xl font-display font-bold text-center mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Welcome back
            </h1>
            <p className="text-center text-white/70 mb-8">Sign in to your campus assistant account</p>
          </motion.div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            {/* Global error with animation */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-start gap-3 backdrop-blur-sm"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-2 ml-1">
                  Email address
                </label>
                <div
                  className={`relative transition-all duration-300 ${
                    isFocused === 'email' ? 'scale-[1.02]' : ''
                  }`}
                >
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused('email')}
                    onBlur={() => setIsFocused(null)}
                    className={`w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 rounded-xl pl-10 pr-4 py-3 border transition-all duration-300 outline-none ${
                      fieldErrors.email
                        ? 'border-red-500/50 focus:border-red-500'
                        : isFocused === 'email'
                        ? 'border-purple-400/70 shadow-lg shadow-purple-500/30'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                    autoComplete="email"
                    autoFocus
                  />
                  {fieldErrors.email && (
                    <motion.p
                      className="text-red-300 text-xs mt-1 ml-1"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {fieldErrors.email}
                    </motion.p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-2 ml-1">
                  Password
                </label>
                <div
                  className={`relative transition-all duration-300 ${
                    isFocused === 'password' ? 'scale-[1.02]' : ''
                  }`}
                >
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused('password')}
                    onBlur={() => setIsFocused(null)}
                    className={`w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 rounded-xl pl-10 pr-12 py-3 border transition-all duration-300 outline-none ${
                      fieldErrors.password
                        ? 'border-red-500/50 focus:border-red-500'
                        : isFocused === 'password'
                        ? 'border-purple-400/70 shadow-lg shadow-purple-500/30'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {fieldErrors.password && (
                    <motion.p
                      className="text-red-300 text-xs mt-1 ml-1"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {fieldErrors.password}
                    </motion.p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Forgot password link */}
            <motion.div
              className="text-right"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Link
                to="/forgot-password"
                className="text-sm text-white/60 hover:text-white transition-colors hover:underline"
              >
                Forgot password?
              </Link>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-3.5 px-4 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles size={20} />
                      </motion.div>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </motion.div>
          </form>

          {/* Sign up link */}
          <motion.p
            className="mt-8 text-center text-sm text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-white font-medium hover:text-purple-200 transition-colors relative group"
            >
              Create one
              <motion.span
                className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300"
              />
            </Link>
          </motion.p>

          {/* Features badges */}
          <motion.div
            className="mt-8 flex justify-center gap-4 flex-wrap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            {[
              { icon: Shield, text: 'Secure' },
              { icon: Zap, text: 'Fast' },
              { icon: Sparkles, text: 'AI-Powered' },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/70 text-xs"
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <Icon size={12} />
                <span>{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="mt-8 text-center text-white/30 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          Protected by advanced encryption &bull; Your data is secure
        </motion.p>
      </motion.div>
    </div>
  )
}