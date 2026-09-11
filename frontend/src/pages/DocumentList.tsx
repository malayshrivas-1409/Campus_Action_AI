import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, FileSpreadsheet, FileImage, Trash2, UploadCloud, RefreshCw, 
  Sparkles, Search, Filter, Grid, List, ChevronDown, Calendar,
  Clock, Eye, Download, Share2, Shield, Zap
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Card from '@/components/primitives/Card'
import Button from '@/components/primitives/Button'
import Badge from '@/components/primitives/Badge'
import { SkeletonCardGrid } from '@/components/primitives/Skeleton'
import { documentAPI } from '@/services/api'

interface Doc {
  id: string
  title: string
  document_type: string
  file_size: number
  uploaded_at: string
  is_active: boolean
  mime_type?: string
}

function fileIcon(mime?: string) {
  if (mime?.includes('spreadsheet') || mime?.includes('excel')) return FileSpreadsheet
  if (mime?.includes('image')) return FileImage
  return FileText
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileTypeColor(type: string) {
  const types: Record<string, string> = {
    'pdf': 'from-red-500 to-orange-500',
    'doc': 'from-blue-500 to-cyan-500',
    'docx': 'from-blue-500 to-cyan-500',
    'xls': 'from-green-500 to-emerald-500',
    'xlsx': 'from-green-500 to-emerald-500',
    'ppt': 'from-orange-500 to-yellow-500',
    'pptx': 'from-orange-500 to-yellow-500',
    'image': 'from-purple-500 to-pink-500',
    'default': 'from-gray-500 to-gray-600',
  }
  return types[type.toLowerCase()] || types.default
}

function getFileTypeGlow(type: string) {
  const types: Record<string, string> = {
    'pdf': 'shadow-red-500/50',
    'doc': 'shadow-blue-500/50',
    'docx': 'shadow-blue-500/50',
    'xls': 'shadow-green-500/50',
    'xlsx': 'shadow-green-500/50',
    'ppt': 'shadow-orange-500/50',
    'pptx': 'shadow-orange-500/50',
    'image': 'shadow-purple-500/50',
    'default': 'shadow-gray-500/50',
  }
  return types[type.toLowerCase()] || types.default
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function DocumentList() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await documentAPI.list(0, 50)
      const payload = res.data
      const items = Array.isArray(payload?.documents)
        ? payload.documents
        : Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
            ? payload
            : []
      setDocs(items)
    } catch {
      setError('Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document?')) return
    setDeleting(id)
    try {
      await documentAPI.delete(id)
      setDocs((prev) => prev.filter((d) => d.id !== id))
      toast.success('Document deleted')
    } catch {
      toast.error('Failed to delete document')
    } finally {
      setDeleting(null)
    }
  }

  // Filter documents
  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || doc.document_type === filterType
    return matchesSearch && matchesType
  })

  // Get unique document types for filter
  const documentTypes = ['all', ...new Set(docs.map(d => d.document_type))]

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 px-4 py-8 md:px-8"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4 flex-wrap">
          <div>
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/70 text-xs mb-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <FileText size={12} className="text-purple-400" />
              <span>{docs.length} documents</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
              Documents
            </h1>
            <p className="text-white/60 mt-1">Manage your campus documents and notices</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <motion.button
              onClick={fetchDocs}
              className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200 flex items-center gap-2 text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </motion.button>
            <motion.button
              onClick={() => navigate('/documents/upload')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-2 text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UploadCloud size={16} />
              Upload
            </motion.button>
          </div>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 rounded-xl pl-10 pr-4 py-3 border border-white/20 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/30 transition-all duration-300 outline-none"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none bg-white/10 backdrop-blur-sm text-white rounded-xl px-4 py-3 pr-10 border border-white/20 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/30 transition-all duration-300 outline-none cursor-pointer w-full sm:w-auto"
              >
                {documentTypes.map(type => (
                  <option key={type} value={type} className="bg-slate-800 text-white">
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            </div>
            <div className="flex bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' : 'text-white/40 hover:text-white'}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'list' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30' : 'text-white/40 hover:text-white'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              variants={itemVariants}
              className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 rounded-2xl bg-white/5" />
              </div>
            ))}
          </div>
        ) : filteredDocs.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-20 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20">
            <FileText size={64} className="text-white/20 mx-auto mb-4" />
            <h3 className="text-2xl font-display font-bold text-white mb-2">No documents found</h3>
            <p className="text-white/60 mb-6 max-w-sm mx-auto">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Upload your first campus document or notice to get started.'}
            </p>
            {searchTerm || filterType !== 'all' ? (
              <button
                onClick={() => { setSearchTerm(''); setFilterType('all') }}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
              >
                Clear filters
              </button>
            ) : (
              <button
                onClick={() => navigate('/documents/upload')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
              >
                Upload a document
              </button>
            )}
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredDocs.map((doc) => {
              const Icon = fileIcon(doc.mime_type)
              const color = getFileTypeColor(doc.document_type)
              const glow = getFileTypeGlow(doc.document_type)
              return (
                <motion.div key={doc.id} variants={itemVariants}>
                  <div className="relative group overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 h-full hover:scale-[1.02]">
                    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                    
                    <div className="relative flex flex-col gap-4 h-full">
                      {/* Icon with glow */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="relative">
                          {/* Glow effect behind icon */}
                          <motion.div 
                            className={`absolute -inset-3 rounded-2xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-40 blur-2xl transition-opacity duration-500`}
                            animate={{
                              scale: [1, 1.1, 1],
                              opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                          <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-xl ${glow} transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl`}>
                            <Icon size={22} className="text-white" />
                            {/* Pulsing ring */}
                            <motion.div
                              className="absolute inset-0 rounded-xl border-2 border-white/20"
                              animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.5, 0, 0.5],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                          </div>
                        </div>
                        {/* Active Badge with glow */}
                        {doc.is_active ? (
                          <motion.div
                            className="relative"
                            animate={{
                              scale: [1, 1.05, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            <div className="absolute inset-0 bg-green-500/30 blur-xl rounded-full" />
                            <Badge className="relative bg-green-500/20 text-green-300 border-green-500/30 flex items-center gap-1.5 px-3 py-1">
                              <motion.div
                                className="w-2 h-2 rounded-full bg-green-400"
                                animate={{
                                  scale: [1, 1.5, 1],
                                  opacity: [1, 0.5, 1],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              />
                              Active
                            </Badge>
                          </motion.div>
                        ) : (
                          <Badge variant="default" className="bg-white/10 text-white/40 border-white/10">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      {/* Title */}
                      <div className="flex-1">
                        <p className="text-base font-semibold text-white leading-snug line-clamp-2">
                          {doc.title}
                        </p>
                        <p className="text-xs uppercase tracking-wider text-white/40 mt-2">{doc.document_type}</p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between gap-2 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <Clock size={12} />
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          {formatSize(doc.file_size)}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/documents/${doc.id}`)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={deleting === doc.id}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-white/40 hover:text-red-400"
                          >
                            {deleting === doc.id ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                                <RefreshCw size={16} />
                              </motion.div>
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          // List view
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredDocs.map((doc) => {
              const Icon = fileIcon(doc.mime_type)
              const color = getFileTypeColor(doc.document_type)
              const glow = getFileTypeGlow(doc.document_type)
              return (
                <motion.div
                  key={doc.id}
                  variants={itemVariants}
                  className="group flex items-center gap-4 px-5 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
                  whileHover={{ x: 4 }}
                >
                  {/* Icon with glow in list view */}
                  <div className="relative">
                    <motion.div 
                      className={`absolute -inset-2 rounded-xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500`}
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <div className={`relative w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg ${glow}`}>
                      <Icon size={18} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{doc.title}</p>
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      <span>{doc.document_type}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{formatSize(doc.file_size)}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {/* Active Badge with glow in list view */}
                  {doc.is_active ? (
                    <motion.div
                      className="relative"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="absolute inset-0 bg-green-500/30 blur-xl rounded-full" />
                      <Badge className="relative bg-green-500/20 text-green-300 border-green-500/30 flex items-center gap-1.5 px-3 py-1">
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full bg-green-400"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [1, 0.5, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        />
                        Active
                      </Badge>
                    </motion.div>
                  ) : (
                    <Badge variant="default" className="bg-white/10 text-white/40 border-white/10">
                      Inactive
                    </Badge>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-white/40 hover:text-red-400"
                  >
                    {deleting === doc.id ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                        <RefreshCw size={16} />
                      </motion.div>
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Footer */}
        <motion.div 
          variants={itemVariants}
          className="text-center text-white/20 text-xs pt-8 border-t border-white/10"
        >
          {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''} • Protected by advanced encryption
        </motion.div>
      </div>
    </motion.div>
  )
}