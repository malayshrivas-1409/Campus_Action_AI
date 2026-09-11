import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, FileText, Download, Share2, Copy, Check, AlertCircle,
  Calendar, User, HardDrive, Zap, Maximize2, Minimize2, Search, Eye
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { documentAPI } from '@/services/api'

interface DocumentContent {
  id: string
  title: string
  document_type: string
  file_size: number
  mime_type: string
  uploaded_at: string
  uploaded_by: string
  source_url?: string
}

interface Chunk {
  chunk_index: number
  content: string
  page_number?: number
  section?: string
}

interface ViewResponse {
  success: boolean
  document: DocumentContent
  chunks: Chunk[]
  total_chunks: number
}

export default function DocumentView() {
  const { documentId } = useParams<{ documentId: string }>()
  const navigate = useNavigate()
  
  const [document, setDocument] = useState<DocumentContent | null>(null)
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedChunk, setCopiedChunk] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'pdf' | 'text'>('pdf')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId) {
        setError('Document ID is missing')
        return
      }

      setLoading(true)
      setError(null)
      try {
        const res = await documentAPI.getDocumentView(documentId)
        const data: ViewResponse = res.data

        if (!data.success) {
          setError('Failed to load document')
          return
        }

        setDocument(data.document)
        setChunks(data.chunks)
      } catch (err: any) {
        console.error('Error fetching document:', err)
        setError(err.response?.data?.detail || 'Failed to load document')
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()
  }, [documentId])

  useEffect(() => {
    const fetchPdf = async () => {
      if (viewMode === 'pdf' && documentId && !pdfUrl) {
        setPdfLoading(true)
        try {
          const token = localStorage.getItem('access_token')
          const response = await fetch(`/api/v1/documents/${documentId}/pdf`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.statusText}`)
          }
          
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          setPdfUrl(url)
        } catch (err: any) {
          console.error('Error fetching PDF:', err)
          toast.error('Failed to load PDF')
        } finally {
          setPdfLoading(false)
        }
      }
    }

    fetchPdf()

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
      }
    }
  }, [viewMode, documentId])

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredChunks = chunks.filter(chunk =>
    chunk.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chunk.section?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const fullContent = chunks
    .sort((a, b) => a.chunk_index - b.chunk_index)
    .map(chunk => chunk.content)
    .join('\n\n')

  const handleCopyChunk = (content: string, index: number) => {
    navigator.clipboard.writeText(content)
    setCopiedChunk(index)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedChunk(null), 2000)
  }

  const handleDownloadContent = () => {
    const fullContent = chunks
      .sort((a, b) => a.chunk_index - b.chunk_index)
      .map((chunk, idx) => {
        let text = ''
        if (chunk.page_number) text += `[Page ${chunk.page_number}]\n`
        if (chunk.section) text += `Section: ${chunk.section}\n\n`
        text += chunk.content + '\n\n'
        return text
      })
      .join('\n---\n\n')

    const element = document.createElement('a')
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(fullContent)}`)
    element.setAttribute('download', `${document?.title || 'document'}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success('Document downloaded')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full"
        />
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/documents')}
            className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors mb-6"
          >
            <ChevronLeft size={20} />
            Back to Documents
          </button>
          <div className="rounded-2xl bg-red-500/20 border border-red-500/30 p-8 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Document</h2>
            <p className="text-red-200 mb-6">{error || 'Failed to load document'}</p>
            <button
              onClick={() => navigate('/documents')}
              className="px-6 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
            >
              Return to Documents
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={`${fullscreen ? 'fixed inset-0 z-50' : ''} bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 transition-all duration-300`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className={`${fullscreen ? 'h-full flex flex-col' : 'min-h-screen'} px-4 py-6 md:px-8`}>
        {/* Header */}
        <motion.div
          className="max-w-5xl mx-auto w-full flex-shrink-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <button
              onClick={() => navigate('/documents')}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ChevronLeft size={20} />
              Back
            </button>
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-1">
                <button
                  onClick={() => setViewMode('pdf')}
                  className={`px-3 py-1.5 rounded text-sm transition-all ${
                    viewMode === 'pdf'
                      ? 'bg-purple-500 text-white'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  PDF
                </button>
                <button
                  onClick={() => setViewMode('text')}
                  className={`px-3 py-1.5 rounded text-sm transition-all ${
                    viewMode === 'text'
                      ? 'bg-purple-500 text-white'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Text
                </button>
              </div>
              <button
                onClick={handleDownloadContent}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                title="Download as text"
              >
                <Download size={20} />
              </button>
              <button
                onClick={() => setFullscreen(!fullscreen)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {fullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>
          </div>

          {/* Document Header Card */}
          <motion.div
            className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <FileText size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 break-words">{document.title}</h1>
                  <p className="text-purple-200 uppercase tracking-wider text-sm">{document.document_type}</p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-medium flex items-center gap-1.5 flex-shrink-0">
                <motion.div
                  className="w-2 h-2 rounded-full bg-green-400"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                Active
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Size</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <HardDrive size={16} className="text-purple-400" />
                  {formatSize(document.file_size)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Uploaded</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <Calendar size={16} className="text-purple-400" />
                  {formatDate(document.uploaded_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Chunks</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <Zap size={16} className="text-purple-400" />
                  {chunks.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Format</p>
                <p className="text-white font-medium">{document.mime_type}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Content Area */}
        <div className={`${fullscreen ? 'flex-1 overflow-y-auto' : ''} max-w-5xl mx-auto w-full`}>
          {viewMode === 'pdf' ? (
            // PDF View
            <motion.div
              className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {pdfLoading ? (
                <div className="flex items-center justify-center h-96 bg-white/5">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full"
                  />
                </div>
              ) : pdfUrl ? (
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  className="w-full h-screen"
                >
                  <div className="flex flex-col items-center justify-center h-96 bg-white/5">
                    <FileText size={48} className="text-white/20 mb-4" />
                    <p className="text-white/40 mb-4">Unable to display PDF in browser</p>
                    <button
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = pdfUrl
                        link.download = `${document?.title || 'document'}.pdf`
                        link.click()
                      }}
                      className="px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                    >
                      Download PDF
                    </button>
                  </div>
                </object>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 bg-white/5">
                  <FileText size={48} className="text-white/20 mb-4" />
                  <p className="text-white/40">Failed to load PDF</p>
                </div>
              )}
            </motion.div>
          ) : (
            // Text View
            <>
              {/* Search Bar */}
              <motion.div
                className="relative mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 rounded-xl pl-12 pr-4 py-3 border border-white/20 focus:border-purple-400 focus:shadow-lg focus:shadow-purple-500/30 transition-all outline-none"
                />
                {searchTerm && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40">
                    {filteredChunks.length} results
                  </span>
                )}
              </motion.div>

              {/* Chunks Display */}
              <motion.div
                className="space-y-4"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 },
                  },
                }}
              >
                <AnimatePresence>
                  {searchTerm ? (
                    // Search results - show matching chunks
                    chunks.filter(chunk =>
                      chunk.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      chunk.section?.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length > 0 ? (
                      chunks
                        .filter(chunk =>
                          chunk.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          chunk.section?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((chunk) => (
                          <motion.div
                            key={chunk.chunk_index}
                            className="group rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 hover:border-white/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            whileHover={{ x: 4 }}
                          >
                            {/* Chunk Header */}
                            <div className="flex items-start justify-between gap-4 mb-3 pb-3 border-b border-white/10">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {chunk.page_number && (
                                  <div className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-medium flex-shrink-0">
                                    Page {chunk.page_number}
                                  </div>
                                )}
                                {chunk.section && (
                                  <div className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-medium break-words">
                                    {chunk.section}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-white/40 flex-shrink-0">Chunk {chunk.chunk_index + 1}</div>
                            </div>

                            {/* Content */}
                            <p className="text-white/80 leading-relaxed mb-4 text-sm whitespace-pre-wrap">
                              {chunk.content}
                            </p>

                            {/* Actions */}
                            <button
                              onClick={() => handleCopyChunk(chunk.content, chunk.chunk_index)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              {copiedChunk === chunk.chunk_index ? (
                                <>
                                  <Check size={14} />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  Copy
                                </>
                              )}
                            </button>
                          </motion.div>
                        ))
                    ) : (
                      <motion.div
                        className="text-center py-12 rounded-xl bg-white/10 border border-white/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Search size={48} className="mx-auto mb-3 text-white/20" />
                        <p className="text-white/40">No chunks match your search</p>
                      </motion.div>
                    )
                  ) : (
                    // Full document view
                    <motion.div
                      className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-8"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="prose prose-invert max-w-none">
                        <div className="text-white/80 leading-relaxed whitespace-pre-wrap text-sm md:text-base font-normal">
                          {fullContent}
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-white/10 flex justify-end">
                        <button
                          onClick={() => handleCopyChunk(fullContent, -1)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          {copiedChunk === -1 ? (
                            <>
                              <Check size={16} />
                              Copied All
                            </>
                          ) : (
                            <>
                              <Copy size={16} />
                              Copy All
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Footer */}
              <motion.div
                className="mt-8 text-center text-white/20 text-xs py-6 border-t border-white/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {searchTerm ? `Showing ${filteredChunks.length} of ${chunks.length} matching chunks` : `Document with ${chunks.length} chunks`}
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
