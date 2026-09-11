import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { searchAPI } from '@/services/api'
import { 
  Search as SearchIcon, 
  AlertCircle, 
  FileText, 
  TrendingUp, 
  ChevronRight, 
  Zap, 
  Sparkles,
  Filter,
  Clock,
  BarChart3,
  Star,
  Award,
  ArrowUp
} from 'lucide-react'
import { Button, Card, Input } from '@/components/primitives'

interface SearchResult {
  chunk_id: string
  document_id: string
  document_title: string
  document_type: string
  content: string
  page_number?: number
  section?: string
  similarity_score: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function Search() {
  const navigate = useNavigate()
  const { token } = useAuthStore()

  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<'vector' | 'keyword'>('vector')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  if (!token) return null

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setResults([])
    setHasSearched(true)

    if (!query.trim()) {
      setError('Please enter a search query')
      return
    }

    setIsLoading(true)
    try {
      const response =
        searchType === 'vector'
          ? await searchAPI.vectorSearch(query, 20, 0.5)
          : await searchAPI.keywordSearch(query, 20)

      setResults(response.data.results || [])
    } catch (err: any) {
      setError(err.message || 'Failed to search')
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400'
    if (score >= 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 0.8) return 'border-green-500/30 bg-green-500/20 text-green-300'
    if (score >= 0.6) return 'border-yellow-500/30 bg-yellow-500/20 text-yellow-300'
    return 'border-red-500/30 bg-red-500/20 text-red-300'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return <Star size={14} className="text-green-400" />
    if (score >= 0.6) return <Award size={14} className="text-yellow-400" />
    return <BarChart3 size={14} className="text-red-400" />
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 px-4 py-8 md:px-8"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero */}
        <motion.section variants={itemVariants} className="text-center max-w-2xl mx-auto">
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/70 text-xs mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles size={12} className="text-purple-400" />
            <span>AI-Powered Search</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Find anything
          </h1>
          <p className="text-lg text-white/60">
            Search across your documents with natural language and get instant results.
          </p>
        </motion.section>

        {/* Search form */}
        <motion.section variants={itemVariants}>
          <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
            
            <form onSubmit={handleSearch} className="relative space-y-6">
              {/* Query input */}
              <div>
                <label htmlFor="search-query" className="block text-sm font-medium text-white/80 mb-2">
                  Search query
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    <SearchIcon size={20} />
                  </div>
                  <input
                    id="search-query"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Placement criteria, exam dates, scholarship rules..."
                    disabled={isLoading}
                    className="w-full bg-white/10 backdrop-blur-sm text-white placeholder-white/40 rounded-xl pl-12 pr-4 py-4 border border-white/20 focus:border-purple-400/70 focus:shadow-lg focus:shadow-purple-500/30 transition-all duration-300 outline-none text-lg"
                  />
                </div>
                <p className="mt-2 text-sm text-white/40">Search across all uploaded documents.</p>
              </div>

              {/* Search type selection */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-3">Search method</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { value: 'vector' as const, label: 'Semantic search', desc: 'Find meaning-based matches (AI-powered)', icon: Sparkles },
                    { value: 'keyword' as const, label: 'Keyword search', desc: 'Find exact text matches', icon: Filter },
                  ].map((option) => (
                    <motion.label
                      key={option.value}
                      className={[
                        'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300',
                        searchType === option.value
                          ? 'border-purple-400/70 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10',
                      ].join(' ')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <input
                        type="radio"
                        value={option.value}
                        checked={searchType === option.value}
                        onChange={(e) => setSearchType(e.target.value as 'vector' | 'keyword')}
                        disabled={isLoading}
                        className="mt-1 h-5 w-5 accent-purple-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <option.icon size={16} className={searchType === option.value ? 'text-purple-400' : 'text-white/40'} />
                          <p className="font-medium text-white">{option.label}</p>
                        </div>
                        <p className="text-sm text-white/50">{option.desc}</p>
                      </div>
                    </motion.label>
                  ))}
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-4 px-6 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-3">
                  {isLoading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <SearchIcon size={20} />
                      </motion.div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <SearchIcon size={20} />
                      Search
                    </>
                  )}
                </span>
              </motion.button>
            </form>
          </div>
        </motion.section>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-red-500/30 bg-red-500/20 p-4 text-sm text-red-200 flex items-start gap-3 backdrop-blur-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p>{error}</p>
                <button onClick={() => setError('')} className="mt-2 text-xs font-medium underline underline-offset-2 text-red-300 hover:text-red-200">
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results section */}
        {hasSearched && (
          <motion.section variants={itemVariants} className="space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-display font-bold text-white">Results</h2>
              {results.length > 0 && (
                <span className="text-sm text-white/40 bg-white/10 px-3 py-1 rounded-full">
                  {results.length} found
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-3 border-purple-500/30 border-t-purple-500 rounded-full"
                  />
                  <p className="text-sm text-white/40">Searching across documents...</p>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-20 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20">
                <SearchIcon className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-2xl font-display font-bold text-white mb-2">No results found</h3>
                <p className="text-white/60 text-sm max-w-md mx-auto mb-6">
                  Try different keywords or switch to {searchType === 'vector' ? 'keyword' : 'semantic'} search.
                </p>
                <button
                  onClick={() => setSearchType(searchType === 'vector' ? 'keyword' : 'vector')}
                  className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
                >
                  Try {searchType === 'vector' ? 'Keyword' : 'Semantic'} Search
                </button>
              </div>
            ) : (
              <motion.div className="space-y-4" variants={containerVariants} initial="hidden" animate="show">
                {results.map((result, idx) => (
                  <motion.div key={result.chunk_id} variants={itemVariants}>
                    <div className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:border-white/40 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
                      {/* Animated gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative flex items-start justify-between gap-4 mb-4 pb-4 border-b border-white/10">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                              <FileText className="w-6 h-6 text-purple-400" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                              {idx + 1}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-white truncate">{result.document_title}</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide font-medium text-white/60">
                                {result.document_type}
                              </span>
                              {result.page_number && (
                                <span className="inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide font-medium text-white/60">
                                  Page {result.page_number}
                                </span>
                              )}
                              {result.section && (
                                <span className="inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide font-medium text-white/60">
                                  {result.section}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {searchType === 'vector' && (
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                              {getScoreIcon(result.similarity_score)}
                              <p className={`text-sm font-semibold ${getScoreColor(result.similarity_score)}`}>
                                {(result.similarity_score * 100).toFixed(0)}% match
                              </p>
                            </div>
                            <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full bg-gradient-to-r ${
                                  result.similarity_score >= 0.8 
                                    ? 'from-green-400 to-emerald-400' 
                                    : result.similarity_score >= 0.6 
                                    ? 'from-yellow-400 to-orange-400' 
                                    : 'from-red-400 to-orange-400'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${result.similarity_score * 100}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                              />
                            </div>
                            <span className={`inline-flex rounded-full border px-2 py-1 text-xs uppercase tracking-wide font-medium ${getScoreBg(result.similarity_score)}`}>
                              {result.similarity_score >= 0.8 ? 'High' : result.similarity_score >= 0.6 ? 'Medium' : 'Low'} Relevance
                            </span>
                          </div>
                        )}
                      </div>

                      <motion.p 
                        className="text-white/70 mb-4 line-clamp-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {result.content}
                      </motion.p>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/documents/${result.document_id}`)}
                          className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm transition-all duration-200 group"
                        >
                          View document
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <span className="text-xs text-white/30 flex items-center gap-1">
                          <Clock size={12} />
                          {/* You can add timestamp here if available */}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>
        )}

        {/* Tips (when no search yet) */}
        {!hasSearched && (
          <motion.section variants={itemVariants}>
            <div className="rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
              <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Search tips
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: 'Semantic search', desc: 'Find meaning-based matches like "who can apply"', icon: Sparkles },
                  { title: 'Keyword search', desc: 'Find exact phrases like "CGPA 7.0"', icon: Filter },
                  { title: 'Better results', desc: 'Longer queries produce more accurate matches', icon: ArrowUp },
                  { title: 'Relevance ranking', desc: 'Results are ranked by semantic relevance', icon: BarChart3 },
                ].map((tip) => (
                  <motion.div 
                    key={tip.title} 
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="font-medium text-white mb-1 flex items-center gap-2">
                      <tip.icon size={16} className="text-purple-400" />
                      {tip.title}
                    </p>
                    <p className="text-sm text-white/50">{tip.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Footer */}
        <motion.div 
          variants={itemVariants}
          className="text-center text-white/20 text-xs pt-8 border-t border-white/10"
        >
          {results.length > 0 ? `${results.length} results found` : 'AI-Powered Search'} • Protected by advanced encryption
        </motion.div>
      </div>
    </motion.div>
  )
}