import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X } from 'lucide-react'
import { authAPI } from '@/services/api'

interface ProfileStatus {
  is_complete: boolean
  user_id: string
  email: string
  name: string
}

export function ProfileCompletionReminder() {
  const navigate = useNavigate()
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null)
  const [showReminder, setShowReminder] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    checkProfileStatus()
    // Check every 5 minutes
    const interval = setInterval(checkProfileStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const checkProfileStatus = async () => {
    try {
      const response = await authAPI.getProfileStatus()
      setProfileStatus(response.data)
      
      // Show reminder if profile is incomplete and not dismissed
      if (!response.data.is_complete && !dismissed) {
        setShowReminder(true)
      }
    } catch (error) {
      console.error('Failed to check profile status:', error)
    }
  }

  const handleDismiss = () => {
    setShowReminder(false)
    setDismissed(true)
    // Reset after 1 hour
    setTimeout(() => setDismissed(false), 60 * 60 * 1000)
  }

  const handleSetupProfile = () => {
    setShowReminder(false)
    navigate('/profile-setup')
  }

  return (
    <AnimatePresence>
      {showReminder && (
        <motion.div
          className="fixed bottom-6 right-6 z-50 max-w-sm"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={handleDismiss}
          />

          {/* Card */}
          <div className="relative z-50 bg-white border-2 border-warning rounded-2xl shadow-card p-6">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 hover:bg-bg-subtle rounded-lg transition-colors"
              aria-label="Close"
            >
              <X size={18} className="text-ink-400" />
            </button>

            {/* Content */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 pt-1">
                <AlertCircle className="w-6 h-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-ink-900 mb-2">
                  Profile incomplete
                </h3>
                <p className="text-sm text-ink-600 mb-4">
                  Complete your student profile to unlock personalized opportunities, scholarships, and placement recommendations.
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-3 py-2 text-sm font-medium text-ink-600 hover:bg-bg-subtle rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={handleSetupProfile}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-warning hover:bg-warning/90 rounded-lg transition-colors"
                  >
                    Setup Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
