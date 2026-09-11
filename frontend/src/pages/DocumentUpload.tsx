import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { documentAPI } from '@/services/api'
import { Button, Input, Card } from '@/components/primitives'
import { useAuthStore } from '@/store/authStore'
import {
  UploadCloud,
  AlertCircle,
  Check,
  ArrowLeft,
  Database,
  Zap,
  FileText,
  Activity,
  HardDrive,
  CheckCircle2,
  Sparkles,
  Shield,
  Clock,
  Rocket,
  Star,
  FileUp,
  Loader2,
  Cloud,
  Lock,
  Globe,
  Brain,
  Cpu
} from 'lucide-react'
import toast from 'react-hot-toast'

const DOCUMENT_TYPES = [
  { value: 'placement', label: 'Placement Notice', icon: '🎯', color: 'from-blue-500 to-cyan-500' },
  { value: 'exam', label: 'Exam Schedule', icon: '📅', color: 'from-orange-500 to-yellow-500' },
  { value: 'scholarship', label: 'Scholarship Info', icon: '💰', color: 'from-green-500 to-emerald-500' },
  { value: 'academic', label: 'Academic Policy', icon: '📚', color: 'from-purple-500 to-pink-500' },
  { value: 'other', label: 'General Document', icon: '📄', color: 'from-gray-500 to-gray-600' },
]

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

// Animated background particles
const BackgroundParticles = () => {
  const particles = Array.from({ length: 15 }, (_, i) => ({
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

export default function DocumentUpload() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState('placement')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const validateFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Only PDF documents are accepted')
      return false
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('Document exceeds 50MB size limit')
      return false
    }
    setError('')
    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile)
      if (!title) {
        setTitle(selectedFile.name.replace(/\.pdf$/i, ''))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile)
      if (!title) {
        setTitle(droppedFile.name.replace(/\.pdf$/i, ''))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !title.trim()) {
      setError('Document and title are required')
      return
    }

    if (!token) {
      navigate('/login')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')
    setUploadProgress(0)

    const uploadToast = toast.loading('Uploading document...')

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const next = prev + Math.random() * 15
          return next >= 90 ? 90 : next
        })
      }, 300)

      await documentAPI.uploadDocument(file, title, documentType)

      clearInterval(progressInterval)
      setUploadProgress(100)

      toast.dismiss(uploadToast)
      toast.success('Document uploaded successfully!')
      setSuccess('✨ Document uploaded and indexed successfully!')

      setTimeout(() => {
        setFile(null)
        setTitle('')
        setUploadProgress(0)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        navigate('/documents')
      }, 2000)
    } catch (err: any) {
      toast.dismiss(uploadToast)
      const errorMsg = err.response?.data?.detail || 'Upload failed'
      setError(errorMsg)
      toast.error(errorMsg)
      setUploadProgress(0)
    } finally {
      setIsLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!token) return null

  const selectedType = DOCUMENT_TYPES.find(t => t.value === documentType)

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 px-4 py-8 md:px-8 relative overflow-hidden"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      <BackgroundParticles />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <motion.button
            type="button"
            onClick={() => navigate('/documents')}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white/60 hover:text-white hover:bg-white/20 transition-all duration-200"
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Back to documents"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/70 text-xs mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>AI-Powered Upload</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
              Upload Document
            </h1>
            <p className="text-white/60 mt-1">Add new documents to your knowledge base</p>
          </div>
        </motion.div>

        {/* Upload zone */}
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <UploadCloud className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Select your document</h2>
            </div>

            <motion.div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative p-12 border-2 border-dashed rounded-2xl transition-all cursor-pointer text-center ${
                isDragging
                  ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/30'
                  : 'border-white/20 hover:border-purple-500/50 hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />

              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  {file ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <FileText className="w-10 h-10 text-purple-400" />
                    </motion.div>
                  ) : (
                    <FileUp className="w-10 h-10 text-purple-400" />
                  )}
                </div>

                {file ? (
                  <motion.div 
                    className="space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        <Check className="w-5 h-5 text-green-400" />
                      </motion.div>
                      <span className="text-base font-medium text-white">{file.name}</span>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm text-white/50">
                      <span>📄 {formatFileSize(file.size)}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>✅ Ready for upload</span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white">Drop PDF here or click to select</h3>
                    <p className="text-sm text-white/50">Supported format: PDF • Maximum size: 50MB</p>
                    <div className="flex justify-center gap-6 text-xs text-white/30">
                      <span>🔒 Encrypted</span>
                      <span>⚡ Instant indexing</span>
                      <span>🤖 AI-ready</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Form (only show when file selected) */}
        <AnimatePresence>
          {file && (
            <motion.div
              variants={itemVariants}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Document details</h2>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Document title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter a descriptive title..."
                      disabled={isLoading}
                      className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 rounded-xl px-4 py-3 border border-white/20 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/30 transition-all duration-300 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-3">Category</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {DOCUMENT_TYPES.map((type) => (
                        <motion.label
                          key={type.value}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all duration-300 ${
                            documentType === type.value
                              ? `border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20`
                              : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <input
                            type="radio"
                            name="documentType"
                            value={type.value}
                            checked={documentType === type.value}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="sr-only"
                            disabled={isLoading}
                          />
                          <span className="text-2xl">{type.icon}</span>
                          <span className="text-sm text-white font-medium">{type.label}</span>
                          {documentType === type.value && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-auto"
                            >
                              <div className="h-3 w-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                            </motion.div>
                          )}
                        </motion.label>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        className="rounded-xl border border-red-500/30 bg-red-500/20 p-4 text-sm text-red-200 flex items-start gap-3 backdrop-blur-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {success && (
                      <motion.div
                        className="rounded-xl border border-green-500/30 bg-green-500/20 p-4 text-sm text-green-200 flex items-start gap-3 backdrop-blur-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Check className="w-5 h-5 shrink-0 mt-0.5" />
                        <p>{success}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isLoading && (
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <div className="flex items-center justify-between text-sm text-white/70">
                        <span className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Loader2 className="w-4 h-4" />
                          </motion.div>
                          Uploading to knowledge base...
                        </span>
                        <span className="text-white/50">{Math.round(uploadProgress)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                          initial={{ width: '0%' }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-white/30">
                        <span>🔍 Indexing</span>
                        <span>⚡ Processing</span>
                        <span>📊 Analyzing</span>
                      </div>
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isLoading || !file || !title.trim()}
                    className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-4 px-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative flex items-center gap-3">
                      {isLoading ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                            <UploadCloud size={20} />
                          </motion.div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <UploadCloud size={20} />
                          Upload Document
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* System status and guidelines */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">System Status</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Vector Database', icon: Database, status: 'Operational', color: 'text-green-400' },
                { label: 'AI Indexing', icon: Brain, status: 'Ready', color: 'text-blue-400' },
                { label: 'Storage', icon: HardDrive, status: 'Available', color: 'text-amber-400' },
                { label: 'Knowledge Graph', icon: Cpu, status: 'Active', color: 'text-purple-400' },
              ].map(({ label, icon: Icon, status, color }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-sm text-white/70">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.span
                      className="h-2 w-2 rounded-full bg-green-400"
                      animate={{ 
                        scale: [1, 1.5, 1],
                        opacity: [1, 0.5, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-xs text-white/50">{status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Upload Guidelines</h3>
            </div>
            <div className="space-y-3 text-sm text-white/60">
              {[
                { icon: '📄', text: 'Only PDF documents are accepted' },
                { icon: '🤖', text: 'Files are automatically indexed with AI embeddings' },
                { icon: '⚡', text: 'Content is instantly searchable after upload' },
                { icon: '🔒', text: 'All uploads are secure and encrypted' },
                { icon: '🌐', text: 'Accessible across all campus devices' },
              ].map(({ icon, text }) => (
                <motion.div 
                  key={text} 
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  whileHover={{ x: 4 }}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-white/70">{text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}