import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileText, MessageSquare, Search, UploadCloud, ArrowRight, 
  Sparkles, Zap, BookOpen, Users, Clock, Calendar, 
  TrendingUp, Award, ChevronRight, Activity, Bell,
  Shield, Star, Rocket, Target, Briefcase, GraduationCap
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Card from '@/components/primitives/Card'
import Button from '@/components/primitives/Button'
import StatBlock from '@/components/primitives/StatBlock'
import Badge from '@/components/primitives/Badge'
import { SkeletonCardGrid } from '@/components/primitives/Skeleton'
import { ProfileCompletionReminder } from '@/components/ProfileCompletionReminder'
import { documentAPI, chatAPI } from '@/services/api'

interface DashboardStats {
  documents: number
  conversations: number
}

const quickActions = [
  {
    label: 'Upload document',
    description: 'Add a new campus notice or document',
    icon: UploadCloud,
    href: '/documents/upload',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    label: 'Ask AI',
    description: 'Chat about campus documents and notices',
    icon: MessageSquare,
    href: '/chat',
    color: 'from-purple-500 to-pink-500',
  },
  {
    label: 'Search documents',
    description: 'Find information across all documents',
    icon: Search,
    href: '/search',
    color: 'from-green-500 to-emerald-500',
  },
]

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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// Animated stats card with gradient
const AnimatedStatCard = ({ value, label, icon: Icon, gradient, delay }: any) => {
  return (
    <motion.div
      variants={itemVariants}
      className="relative group overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300"
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-3xl font-bold text-white mb-1">{value}</div>
          <div className="text-sm text-white/60">{label}</div>
        </div>
        <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
          <Icon size={20} className="text-white/70" />
        </div>
      </div>
      <motion.div 
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400"
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 1, delay: 0.5 }}
      />
    </motion.div>
  )
}

// Activity timeline item
const ActivityItem = ({ icon: Icon, title, description, time, color }: any) => {
  return (
    <motion.div 
      className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
      whileHover={{ x: 4 }}
    >
      <div className={`p-2 rounded-lg bg-gradient-to-br ${color} shadow-lg`}>
        <Icon size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-xs text-white/50 truncate">{description}</p>
      </div>
      <span className="text-xs text-white/30 whitespace-nowrap">{time}</span>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user, studentProfile, getStudentProfile } = useAuthStore()
  const navigate = useNavigate()

  const [stats, setStats] = useState<DashboardStats>({ documents: 0, conversations: 0 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [recentDocs, setRecentDocs] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  useEffect(() => {
    if (!studentProfile) getStudentProfile()
  }, [studentProfile, getStudentProfile])

  useEffect(() => {
    const load = async () => {
      setStatsLoading(true)
      try {
        const [docsRes, convsRes] = await Promise.allSettled([
          documentAPI.list(0, 5),
          chatAPI.listConversations(),
        ])
        const docs = docsRes.status === 'fulfilled' ? docsRes.value.data : { items: [], total: 0 }
        const convs = convsRes.status === 'fulfilled' ? convsRes.value.data : []
        setStats({
          documents: docs.total ?? docs.items?.length ?? 0,
          conversations: Array.isArray(convs) ? convs.length : 0,
        })
        setRecentDocs(docs.items?.slice(0, 4) ?? [])
      } catch {
        // stats stay at 0
      } finally {
        setStatsLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const { activityAPI } = await import('@/services/api')
        const res = await activityAPI.recent(6)
        if (res.data && res.data.activities) {
          setRecentActivities(res.data.activities)
        }
      } catch (e) {
        // ignore - keep hardcoded fallback
        console.warn('Could not load recent activities', e)
      }
    }
    loadActivities()
  }, [])

  return (
    <>
      <ProfileCompletionReminder />
      <motion.div
        className="min-h-[calc(100vh-4rem)] w-full bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 px-4 py-6 md:px-8"
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        <div className="max-w-full lg:max-w-7xl mx-auto space-y-6 pb-8">
          {/* Hero section with animated gradient */}
          <motion.section 
            variants={itemVariants} 
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10 p-6 md:p-10"
          >
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white/5"
                  style={{
                    width: Math.random() * 4 + 2,
                    height: Math.random() * 4 + 2,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.1, 0.3, 0.1],
                  }}
                  transition={{
                    duration: Math.random() * 5 + 5,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                  }}
                />
              ))}
            </div>

            <div className="relative">
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/70 text-xs mb-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Activity size={12} className="text-green-400" />
                <span>System Online</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              </motion.div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-3">
                Good {getTimeOfDay()}, {firstName} 
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="inline-block ml-2"
                >
                  👋
                </motion.span>
              </h1>
              <p className="text-base md:text-lg text-white/70 max-w-2xl">
                Access your campus documents, chat with AI, and stay connected with important notices and announcements.
              </p>
              
              <motion.div 
                className="mt-4 flex flex-wrap gap-2 md:gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Badge variant="success" className="bg-green-500/20 text-green-300 border-green-500/30">
                  <Sparkles size={12} className="mr-1" />
                  AI Powered
                </Badge>
                <Badge variant="info" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <Zap size={12} className="mr-1" />
                  Real-time
                </Badge>
                <Badge variant="warning" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                  <Shield size={12} className="mr-1" />
                  Secure
                </Badge>
              </motion.div>
            </div>
          </motion.section>

          {/* Stats row with animated cards */}
          <motion.section
            variants={itemVariants}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
          >
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-28 rounded-2xl bg-white/5" />
                </div>
              ))
            ) : (
              <>
                <AnimatedStatCard
                  value={stats.documents}
                  label="Documents"
                  icon={FileText}
                  gradient="from-blue-500 to-cyan-500"
                  delay={0.1}
                />
                <AnimatedStatCard
                  value={stats.conversations}
                  label="Chats"
                  icon={MessageSquare}
                  gradient="from-purple-500 to-pink-500"
                  delay={0.2}
                />
                <AnimatedStatCard
                  value={studentProfile?.cgpa ?? '—'}
                  label="CGPA"
                  icon={Award}
                  gradient="from-yellow-500 to-orange-500"
                  delay={0.3}
                />
                <AnimatedStatCard
                  value={studentProfile?.department?.split(' ')[0] ?? '—'}
                  label="Department"
                  icon={Users}
                  gradient="from-green-500 to-emerald-500"
                  delay={0.4}
                />
              </>
            )}
          </motion.section>

          {/* Quick actions and activity feed grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Quick actions */}
            <motion.section variants={itemVariants} className="lg:col-span-2 space-y-4">
              <h2 className="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
                <Zap size={20} className="text-purple-400" />
                Quick actions
              </h2>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {quickActions.map(({ label, description, icon: Icon, href, color }) => (
                  <motion.div
                    key={href}
                    variants={itemVariants}
                    onClick={() => navigate(href)}
                    className="cursor-pointer group"
                  >
                    <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 h-full hover:scale-[1.02]">
                      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg mb-3`}>
                          <Icon size={20} className="text-white" />
                        </div>
                        <h3 className="text-white font-semibold text-sm mb-1">{label}</h3>
                        <p className="text-xs text-white/60">{description}</p>
                        <motion.div 
                          className="mt-3 text-white/40 group-hover:text-white/70 transition-colors"
                          whileHover={{ x: 4 }}
                        >
                          <ChevronRight size={14} />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>

            {/* Activity feed */}
            <motion.section variants={itemVariants} className="space-y-4">
              <h2 className="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
                <Clock size={20} className="text-purple-400" />
                Recent activity
              </h2>
              <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-4">
                <div className="space-y-1">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((a) => {
                      // Map action_type to icon and color
                      let IconComp = FileText
                      let color = 'from-purple-500 to-pink-500'
                      const t = (a.action_type || '').toLowerCase()
                      if (t.includes('upload')) {
                        IconComp = UploadCloud
                        color = 'from-blue-500 to-cyan-500'
                      } else if (t.includes('chat') || t.includes('message')) {
                        IconComp = MessageSquare
                        color = 'from-purple-500 to-pink-500'
                      } else if (t.includes('search')) {
                        IconComp = Search
                        color = 'from-green-500 to-emerald-500'
                      } else if (t.includes('update') || t.includes('edit')) {
                        IconComp = FileText
                        color = 'from-yellow-500 to-orange-500'
                      }

                      const created = new Date(a.created_at)
                      const time = (() => {
                        const diff = Date.now() - created.getTime()
                        const minutes = Math.floor(diff / 60000)
                        if (minutes < 1) return 'just now'
                        if (minutes < 60) return `${minutes} min ago`
                        const hours = Math.floor(minutes / 60)
                        if (hours < 24) return `${hours} hour${hours>1?'s':''} ago`
                        const days = Math.floor(hours / 24)
                        return `${days} day${days>1?'s':''} ago`
                      })()

                      return (
                        <ActivityItem
                          key={a.id}
                          icon={IconComp}
                          title={a.action_type}
                          description={a.entity_type ? `${a.entity_type} ${a.entity_id ?? ''}` : ''}
                          time={time}
                          color={color}
                        />
                      )
                    })
                  ) : (
                    // Fallback to the previous static items
                    <>
                      <ActivityItem
                        icon={UploadCloud}
                        title="Document uploaded"
                        description="Campus Notice Q1 2024.pdf"
                        time="2 min ago"
                        color="from-blue-500 to-cyan-500"
                      />
                      <ActivityItem
                        icon={MessageSquare}
                        title="New chat session"
                        description="Asked about placement criteria"
                        time="15 min ago"
                        color="from-purple-500 to-pink-500"
                      />
                      <ActivityItem
                        icon={Search}
                        title="Document search"
                        description='Searched "scholarship eligibility"'
                        time="1 hour ago"
                        color="from-green-500 to-emerald-500"
                      />
                      <ActivityItem
                        icon={FileText}
                        title="Document updated"
                        description="Updated academic calendar"
                        time="3 hours ago"
                        color="from-yellow-500 to-orange-500"
                      />
                    </>
                  )}
                </div>
              </div>
            </motion.section>
          </div>

          {/* Recent documents */}
          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
                <FileText size={20} className="text-purple-400" />
                Recent documents
              </h2>
              <button
                onClick={() => navigate('/documents')}
                className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1 group"
              >
                View all
                <motion.span whileHover={{ x: 4 }}>
                  <ArrowRight size={14} />
                </motion.span>
              </button>
            </div>

            {statsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-14 rounded-xl bg-white/5" />
                  </div>
                ))}
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <FileText size={48} className="text-white/20 mx-auto mb-4" />
                <p className="text-white/60 mb-4">No documents uploaded yet.</p>
                <button
                  onClick={() => navigate('/documents/upload')}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300"
                >
                  Upload your first document
                </button>
              </div>
            ) : (
              <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="show">
                {recentDocs.map((doc) => (
                  <motion.div
                    key={doc.id}
                    variants={itemVariants}
                    className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3 md:py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 group cursor-pointer"
                    whileHover={{ scale: 1.01, x: 4 }}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <FileText size={16} className="text-purple-400" />
                    </div>
                    <span className="flex-1 text-white text-sm md:text-base truncate">{doc.title}</span>
                    <Badge variant={doc.is_active ? 'success' : 'default'} className="bg-white/10 text-white/80 border-white/20 text-xs">
                      {doc.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-white/40 shrink-0 hidden sm:block">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                    <ChevronRight size={16} className="text-white/20 group-hover:text-white/60 transition-colors" />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>

          {/* Footer */}
          <motion.div 
            variants={itemVariants}
            className="text-center text-white/20 text-xs pt-6 border-t border-white/10 mt-4"
          >
            Protected by advanced encryption &bull; {new Date().getFullYear()} Campus AI
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}