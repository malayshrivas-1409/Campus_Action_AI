import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Sparkles, ArrowRight, Shield, Zap, CheckCircle } from 'lucide-react'
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

// Password strength indicator
const PasswordStrength = ({ password }: { password: string }) => {
  const getStrength = () => {
    let score = 0
    if (password.length >= 8) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++
    return score
  }

  const strength = getStrength()
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  const width = `${(strength / 4) * 100}%`

  if (password.length === 0) return null

  return (
    <motion.div 
      className="mt-2 space-y-1"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">Password strength</span>
        <span className={`text-xs font-medium ${
          strength === 0 ? 'text-red-400' :
          strength === 1 ? 'text-orange-400' :
          strength === 2 ? 'text-yellow-400' :
          'text-green-400'
        }`}>
          {labels[strength - 1] || 'Weak'}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colors[strength - 1] || colors[0]}`}
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  )
}

export default function Signup() {
  const navigate = useNavigate()
  const { signup, isLoading, error, clearError } = useAuthStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isFocused, setIsFocused] = useState<string | null>(null)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) errs.email = 'Enter a valid email address'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your password'
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (!acceptTerms) errs.terms = 'You must accept the terms'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})
    await signup({ name: name.trim(), email: email.trim(), password })
    const { token } = useAuthStore.getState()
    if (token) navigate('/profile-setup')
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

      {/* Animated grid overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Particles */}
      <BackgroundParticles />

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
          className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20 max-h-[80vh] overflow-y-auto"
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
              Create account
            </h1>
            <p className="text-center text-white/70 mb-8">Join the campus community</p>
          </motion.div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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

            {/* Full Name Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-2 ml-1">
                  Full name
                </label>
                <div
                  className={`relative transition-all duration-300 ${
                    isFocused === 'name' ? 'scale-[1.02]' : ''
                  }`}
                >
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setIsFocused('name')}
                    onBlur={() => setIsFocused(null)}
                    className={`w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 rounded-xl pl-10 pr-4 py-3 border transition-all duration-300 outline-none ${
                      fieldErrors.name
                        ? 'border-red-500/50 focus:border-red-500'
                        : isFocused === 'name'
                        ? 'border-purple-400/70 shadow-lg shadow-purple-500/30'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                    autoComplete="name"
                    autoFocus
                  />
                  {fieldErrors.name && (
                    <motion.p
                      className="text-red-300 text-xs mt-1 ml-1"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {fieldErrors.name}
                    </motion.p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
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
              transition={{ delay: 0.7 }}
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
                    placeholder="Min. 8 characters"
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
                    autoComplete="new-password"
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
                <PasswordStrength password={password} />
              </div>
            </motion.div>

            {/* Confirm Password Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="relative">
                <label className="block text-sm font-medium text-white/80 mb-2 ml-1">
                  Confirm password
                </label>
                <div
                  className={`relative transition-all duration-300 ${
                    isFocused === 'confirm' ? 'scale-[1.02]' : ''
                  }`}
                >
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setIsFocused('confirm')}
                    onBlur={() => setIsFocused(null)}
                    className={`w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 rounded-xl pl-10 pr-12 py-3 border transition-all duration-300 outline-none ${
                      fieldErrors.confirmPassword
                        ? 'border-red-500/50 focus:border-red-500'
                        : isFocused === 'confirm'
                        ? 'border-purple-400/70 shadow-lg shadow-purple-500/30'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {fieldErrors.confirmPassword && (
                    <motion.p
                      className="text-red-300 text-xs mt-1 ml-1"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {fieldErrors.confirmPassword}
                    </motion.p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Terms and Conditions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-5 h-5 rounded-lg border-2 transition-all duration-300 flex items-center justify-center ${
                      acceptTerms
                        ? 'bg-purple-500 border-purple-500'
                        : fieldErrors.terms
                        ? 'border-red-500'
                        : 'border-white/40 group-hover:border-white/70'
                    }`}
                  >
                    {acceptTerms && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      >
                        <CheckCircle size={14} className="text-white" />
                      </motion.div>
                    )}
                  </div>
                </div>
                <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                  I agree to the{' '}
                  <Link to="/terms" className="text-purple-300 hover:text-purple-200 underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-purple-300 hover:text-purple-200 underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {fieldErrors.terms && (
                <motion.p
                  className="text-red-300 text-xs mt-1 ml-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {fieldErrors.terms}
                </motion.p>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-2"
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
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </motion.div>
          </form>

          {/* Sign in link */}
          <motion.p
            className="mt-8 text-center text-sm text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-white font-medium hover:text-purple-200 transition-colors relative group"
            >
              Sign in
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
            transition={{ delay: 1.2 }}
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
          transition={{ delay: 1.3 }}
        >
          Protected by advanced encryption &bull; Your data is secure
        </motion.p>
      </motion.div>
    </div>
  )
}