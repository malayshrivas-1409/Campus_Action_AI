import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { studentAPI } from '@/services/api'
import { 
  Check, AlertCircle, Info, ArrowLeft, User, GraduationCap, 
  BookOpen, Award, Calendar, Mail, Sparkles, Shield, 
  Star, Rocket, Users, Briefcase, Code, Brain, Target,
  Edit, Save, X, Clock
} from 'lucide-react'
import { Button, Card, Input } from '@/components/primitives'

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Biotechnology',
  'Other',
]

// Animated background particles
const BackgroundParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/10"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, -5, 0],
            opacity: [0.1, 0.3, 0.1],
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

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState({
    rollNumber: '',
    department: '',
    batch: new Date().getFullYear(),
    cgpa: '',
    backlogs: '',
  })

  if (!token || !user) {
    navigate('/login')
    return null
  }

  // Fetch student profile to determine if we are in edit or create mode
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await studentAPI.getMyProfile()
        setIsEditMode(true)
        setFormData({
          rollNumber: response.data.roll_number,
          department: response.data.department,
          batch: response.data.batch,
          cgpa: response.data.cgpa ?? '',
          backlogs: response.data.backlogs ?? '',
        })
      } catch (err: any) {
        if (err.response?.status === 404) {
          setIsEditMode(false)
        } else {
          setError('Failed to load profile information')
        }
      }
    }

    fetchProfile()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'batch' || name === 'cgpa' || name === 'backlogs' ? (value ? parseFloat(value) : '') : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (isEditMode) {
      const cgpaValue = formData.cgpa
      const backlogsValue = formData.backlogs

      if (cgpaValue !== '' && (isNaN(cgpaValue) || parseFloat(cgpaValue) < 0 || parseFloat(cgpaValue) > 10)) {
        setError('Please enter a valid CGPA between 0 and 10')
        return
      }

      if (backlogsValue !== '' && (isNaN(backlogsValue) || parseInt(backlogsValue) < 0)) {
        setError('Please enter a valid number of backlogs (non-negative integer)')
        return
      }
    } else {
      if (!formData.rollNumber.trim()) {
        setError('Roll number is required')
        return
      }

      if (!formData.department) {
        setError('Department is required')
        return
      }

      if (!formData.batch || formData.batch < 2000 || formData.batch > new Date().getFullYear() + 5) {
        setError('Please enter a valid batch year')
        return
      }

      if (formData.cgpa !== '' && (isNaN(formData.cgpa) || parseFloat(formData.cgpa) < 0 || parseFloat(formData.cgpa) > 10)) {
        setError('Please enter a valid CGPA between 0 and 10')
        return
      }
    }

    setIsLoading(true)

    try {
      if (isEditMode) {
        await studentAPI.updateProfile(
          formData.cgpa ? parseFloat(formData.cgpa.toString()) : undefined,
          formData.backlogs ? parseInt(formData.backlogs.toString()) : undefined,
        )
      } else {
        await studentAPI.createProfile(
          formData.rollNumber.trim(),
          formData.department,
          formData.batch,
          formData.cgpa ? parseFloat(formData.cgpa.toString()) : undefined,
        )
      }

      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <BackgroundParticles />

      <motion.div
        className="w-full max-w-2xl relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Back button */}
        <motion.button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft size={16} className="group-hover:text-purple-400 transition-colors" />
          <span>Back</span>
        </motion.button>

        {/* Header */}
        <div className="mb-8 text-center">
          <motion.div
            className="relative inline-flex items-center justify-center w-24 h-24 mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/50">
              <span className="text-3xl font-bold text-white">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </motion.div>

          <motion.h1 
            className="font-display font-bold text-4xl md:text-5xl text-white mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {isEditMode ? 'Update your profile' : 'Complete your profile'}
          </motion.h1>
          
          <motion.p 
            className="text-white/60"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Welcome, <span className="font-semibold text-white">{user.name}</span>! 
            {isEditMode ? ' Update your student information below.' : " Let's set up your student account."}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-8 md:p-10 shadow-2xl shadow-purple-500/10">
            {/* Gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

            <AnimatePresence>
              {error && (
                <motion.div
                  className="mb-6 rounded-xl border border-red-500/30 bg-red-500/20 p-4 text-sm text-red-200 flex items-start gap-3 backdrop-blur-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-8">
              {!isEditMode ? (
                // Create mode
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-400" />
                        Roll number
                      </label>
                      <input
                        id="rollNumber"
                        type="text"
                        name="rollNumber"
                        value={formData.rollNumber}
                        onChange={handleChange}
                        placeholder="e.g., CSE2021001"
                        disabled={isLoading}
                        className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 rounded-xl px-4 py-3 border border-white/20 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/30 transition-all duration-300 outline-none"
                      />
                      <p className="mt-1.5 text-xs text-white/30">Your unique student ID</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-purple-400" />
                        Department
                      </label>
                      <select
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        disabled={isLoading}
                        className="w-full bg-white/10 backdrop-blur-sm text-white rounded-xl px-4 py-3 border border-white/20 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/30 transition-all duration-300 outline-none appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-slate-800 text-white/60">Select your department</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept} className="bg-slate-800 text-white">
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        Batch year
                      </label>
                      <input
                        id="batch"
                        type="number"
                        name="batch"
                        value={formData.batch}
                        onChange={handleChange}
                        placeholder="e.g., 2024"
                        disabled={isLoading}
                        min="2000"
                        max={new Date().getFullYear() + 5}
                        className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 rounded-xl px-4 py-3 border border-white/20 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/30 transition-all duration-300 outline-none"
                      />
                      <p className="mt-1.5 text-xs text-white/30">When you started or will start</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-400" />
                        CGPA (optional)
                      </label>
                      <input
                        id="cgpa"
                        type="number"
                        name="cgpa"
                        value={formData.cgpa}
                        onChange={handleChange}
                        placeholder="e.g., 8.5"
                        disabled={isLoading}
                        min="0"
                        max="10"
                        step="0.01"
                        className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 rounded-xl px-4 py-3 border border-white/20 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/30 transition-all duration-300 outline-none"
                      />
                      <p className="mt-1.5 text-xs text-white/30">Current cumulative GPA (0-10 scale)</p>
                    </div>
                  </div>
                </>
              ) : (
                // Edit mode
                <>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <User className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-white/40">Roll Number</p>
                          <p className="text-sm font-medium text-white">{formData.rollNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <Briefcase className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-white/40">Department</p>
                          <p className="text-sm font-medium text-white">{formData.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <Calendar className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-white/40">Batch</p>
                          <p className="text-sm font-medium text-white">{formData.batch}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <Clock className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-white/40">Status</p>
                          <p className="text-sm font-medium text-green-400">Active Student</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4 text-purple-400" />
                          CGPA (optional)
                        </label>
                        <input
                          id="cgpa"
                          type="number"
                          name="cgpa"
                          value={formData.cgpa}
                          onChange={handleChange}
                          placeholder="e.g., 8.5"
                          disabled={isLoading}
                          min="0"
                          max="10"
                          step="0.01"
                          className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 rounded-xl px-4 py-3 border border-white/20 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/30 transition-all duration-300 outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-purple-400" />
                          Backlogs
                        </label>
                        <input
                          id="backlogs"
                          type="number"
                          name="backlogs"
                          value={formData.backlogs}
                          onChange={handleChange}
                          placeholder="e.g., 0"
                          disabled={isLoading}
                          min="0"
                          className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 rounded-xl px-4 py-3 border border-white/20 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/30 transition-all duration-300 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Info card */}
              <motion.div 
                className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-6 flex gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="p-2 rounded-lg bg-purple-500/30">
                  <Info className="w-5 h-5 text-purple-400 shrink-0" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-3">Why we need this information</h3>
                  <ul className="space-y-2 text-sm text-white/60">
                    {[
                      '🎯 Personalize opportunities for your profile',
                      '📊 Show relevant scholarships and placements',
                      '📈 Track your academic progress',
                    ].map((item) => (
                      <li key={item} className="flex gap-2 items-start">
                        <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {isEditMode ? 'Cancel' : 'Skip for now'}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 relative group overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-3 px-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  <span className="relative flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <Sparkles size={16} />
                        </motion.div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        {isEditMode ? 'Update Profile' : 'Complete Profile'}
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>

            <motion.p 
              className="mt-8 text-center text-sm text-white/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {isEditMode 
                ? 'Your profile information is saved and used to personalize your experience.' 
                : 'You can update this information anytime in your settings.'}
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}