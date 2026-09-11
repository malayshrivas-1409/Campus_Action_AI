import { useState, useEffect, useRef, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { chatAPI, ragAPI } from '@/services/api';
import ReactMarkdown from 'react-markdown';
import { Plus, Trash2, PanelLeftClose, PanelLeftOpen, Loader2, Search, MessageSquare, Sparkles, AlertCircle, FileText, Zap } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: Array<{
    chunk_id: string;
    document_title: string;
    document_type: string;
    page_number?: number;
    section?: string;
  }> | null;
  timestamp: Date;
  isLoading?: boolean;
}

interface ConversationSummary {
  id: string
  title: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const WELCOME_MESSAGE = `Hello! 👋 I'm your document assistant. I can help you find information across all your uploaded documents.

**How to use:**
1. Ask a question about your documents
2. I'll search through all PDFs and find relevant information
3. You'll get answers with sources cited

**Example questions:**
- "What are the placement eligibility criteria?"
- "Who is eligible for this scholarship?"
- "What are the exam dates?"

Feel free to ask anything about your documents!`;

export default function Chat() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ragStatus, setRagStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Conversation sidebar state
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [conversationsSearch, setConversationsSearch] = useState('')
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null)
  const [conversationToDelete, setConversationToDelete] = useState<ConversationSummary | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [switchingConversation, setSwitchingConversation] = useState(false)

  // Load conversations helper function
  const loadConversations = async (search?: string) => {
    setConversationsLoading(true)
    try {
      const response = await chatAPI.listConversations(search)
      setConversations(response.data || [])
    } catch (err: any) {
      console.error('Failed to load conversations:', err)
    } finally {
      setConversationsLoading(false)
    }
  }

  // Initialize with welcome message on first load
  useEffect(() => {
    if (messages.length === 0 && !conversationId) {
      setMessages([{ id: 'welcome-message', role: 'assistant', content: WELCOME_MESSAGE, timestamp: new Date(), sources: null }])
    }
  }, []);

  // Check RAG service status on mount
  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const checkStatus = async () => {
      try {
        const status = await ragAPI.status();
        setRagStatus(status.data);
      } catch (err: any) {
        console.error('Failed to check RAG status:', err);
      }
    };

    checkStatus()
    loadConversations()
  }, [token, navigate]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debounced search effect
  useEffect(() => {
    if (!token) return
    const id = setTimeout(() => {
      loadConversations(conversationsSearch || undefined)
    }, 300)
    return () => clearTimeout(id)
  }, [conversationsSearch, token])

  // Handlers
  const handleNewChat = () => {
    setConversationId(null)
    setMessages([{ id: 'welcome-message', role: 'assistant', content: WELCOME_MESSAGE, timestamp: new Date(), sources: null }])
    setError('')
    inputRef.current?.focus()
  }

  const handleSelectConversation = async (id: string) => {
    if (id === conversationId) return
    setSwitchingConversation(true)
    setError('')
    try {
      const response = await chatAPI.getConversation(id)
      const loaded: Message[] = (response.data.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: m.sources || [],
        timestamp: new Date(m.created_at),
      }))
      setConversationId(id)
      setMessages(loaded.length > 0 ? loaded : [{ id: 'welcome-message', role: 'assistant', content: WELCOME_MESSAGE, timestamp: new Date(), sources: null }])
    } catch (err: any) {
      console.error('Failed to load conversation:', err)
      toast.error('Could not load that conversation')
    } finally {
      setSwitchingConversation(false)
    }
  }

  const handleDeleteConversation = async (conv: ConversationSummary) => {
    setDeletingConversationId(conv.id)
    try {
      await chatAPI.deleteConversation(conv.id)
      setConversations((prev) => prev.filter((c) => c.id !== conv.id))
      if (conv.id === conversationId) handleNewChat()
      toast.success('Conversation deleted')
    } catch (err: any) {
      console.error('Failed to delete conversation:', err)
      toast.error('Failed to delete conversation')
    } finally {
      setDeletingConversationId(null)
      setConversationToDelete(null)
    }
  }

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    setError('');
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      sources: null,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
      sources: null,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Call chat API with current conversation ID (null for new chat, or existing ID)
      const response = await chatAPI.sendMessage(conversationId, input, 10, 0.7, 0.3);
      
      // Update conversation ID if this is a new conversation
      if (!conversationId && response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
      }
      
      // Remove loading message and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        return [
          ...filtered,
          {
            id: `response-${Date.now()}`,
            role: 'assistant',
            content: response.data.response,
            sources: response.data.sources || null,
            timestamp: new Date(),
          },
        ];
      });
      
      // Reload conversations to show newly created ones or updated titles
      // Add a small delay to allow backend to fully commit the title
      setTimeout(() => {
        loadConversations(conversationsSearch || undefined);
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to get response');
      // Remove loading message on error
      setMessages((prev) => prev.filter((m) => !m.isLoading));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to use chat</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex overflow-hidden">
      {/* Conversation Sidebar */}
      {sidebarOpen && (
        <aside className="w-64 bg-white/5 backdrop-blur-sm border-r border-white/10 flex flex-col overflow-hidden flex-shrink-0">
          {/* New Chat Button */}
          <div className="p-4 border-b border-white/10">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium text-sm shadow-lg shadow-purple-500/30"
            >
              <Plus size={16} />
              New Chat
            </button>
          </div>

          {/* Search Box */}
          <div className="p-4 border-b border-white/10">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={conversationsSearch}
                onChange={(e) => setConversationsSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:outline-none text-sm text-white placeholder-white/40 transition-all"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {conversationsLoading && conversationsSearch === '' ? (
              <div className="p-4 text-center text-white/60 text-sm">
                <Loader2 size={16} className="inline-block animate-spin mr-2" />
                Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-white/60 text-sm">
                {conversationsSearch ? 'No conversations found' : 'No conversations yet'}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                      conv.id === conversationId
                        ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-500/50 text-white'
                        : 'hover:bg-white/10 text-white/70 hover:text-white border border-transparent'
                    }`}
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                  <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conv.title && conv.title !== "New Chat" ? conv.title : "New Chat"}
                      </p>
                      <p className="text-xs text-white/50">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setConversationToDelete(conv)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      disabled={deletingConversationId === conv.id}
                    >
                      {deletingConversationId === conv.id ? (
                        <Loader2 size={16} className="text-red-400 animate-spin" />
                      ) : (
                        <Trash2 size={16} className="text-red-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-sm px-6 py-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white/90"
              >
                {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Document Chat
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </h1>
                <p className="text-sm text-white/60">
                  Ask questions about your uploaded documents
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {switchingConversation && (
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Loading conversation...
                </div>
              )}
              {ragStatus && (
                <div className="flex items-center gap-3 px-3 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className={`h-2 w-2 rounded-full ${ragStatus.llm_configured ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span className="text-xs text-white/70">
                    {ragStatus.llm_configured ? 'Online' : 'Configuring'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <MessageSquare className="mx-auto h-12 w-12 text-white/40" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Start a Conversation
              </h3>
              <p className="text-white/60 max-w-md text-sm">
                Ask questions about your documents. The AI will search through all uploaded PDFs
                and provide answers with sources.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-sm border border-purple-500/30 text-white'
                      : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Zap size={16} className="text-purple-400" />
                      </motion.div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  ) : (
                    <div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ node, ...props }: any) => <p className="text-sm text-white/90 mb-2" {...props} />,
                            strong: ({ node, ...props }: any) => <strong className="font-bold text-white" {...props} />,
                            em: ({ node, ...props }: any) => <em className="italic text-white/90" {...props} />,
                            h1: ({ node, ...props }: any) => <h1 className="text-lg font-bold text-white mb-2" {...props} />,
                            h2: ({ node, ...props }: any) => <h2 className="text-base font-bold text-white mb-2" {...props} />,
                            h3: ({ node, ...props }: any) => <h3 className="text-sm font-bold text-white mb-1" {...props} />,
                            ul: ({ node, ...props }: any) => <ul className="list-disc list-inside space-y-1 mb-2 text-white/90" {...props} />,
                            ol: ({ node, ...props }: any) => <ol className="list-decimal list-inside space-y-1 mb-2 text-white/90" {...props} />,
                            li: ({ node, ...props }: any) => <li className="text-sm text-white/90" {...props} />,
                            code: ({ node, inline, ...props }: any) => 
                              inline ? (
                                <code className="bg-white/10 px-2 py-0.5 rounded font-mono text-xs text-purple-300" {...props} />
                              ) : (
                                <code className="block bg-white/10 p-3 rounded font-mono text-xs text-purple-300 overflow-x-auto mb-2" {...props} />
                              ),
                            blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-purple-500 pl-3 italic text-white/70 my-2" {...props} />,
                            a: ({ node, ...props }: any) => <a className="text-purple-400 hover:text-purple-300 underline" {...props} />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {/* Sources - Only show if there are valid sources with document titles */}
                      {message.sources && message.sources.length > 0 && (
                        (() => {
                          const validSources = message.sources.filter((s: any) => s?.document_title);
                          return validSources.length > 0 ? (
                            <div className="mt-4 pt-3 border-t border-white/10">
                              <p className="text-xs font-semibold text-white/70 mb-2 flex items-center gap-1">
                                <FileText size={14} /> Sources ({validSources.length})
                              </p>
                              <div className="space-y-2">
                                {validSources.map((source: any, idx: number) => (
                                  <div
                                    key={`source-${idx}`}
                                    className="text-xs bg-white/5 p-2 rounded border border-white/10 hover:border-purple-500/30 transition-colors"
                                  >
                                    <p className="font-medium text-white">
                                      {source.document_title}
                                    </p>
                                    <div className="flex gap-2 mt-1 text-white/60 flex-wrap">
                                      {source?.page_number && (
                                        <span className="px-2 py-0.5 bg-white/10 rounded text-xs">
                                          Page {source.page_number}
                                        </span>
                                      )}
                                      {source?.document_type && (
                                        <span className="px-2 py-0.5 bg-purple-500/20 rounded text-xs border border-purple-500/30">
                                          {source.document_type}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null;
                        })()
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex-shrink-0 px-6 py-3 bg-red-500/20 backdrop-blur-sm border-t border-red-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-300">{error}</p>
                <button 
                  onClick={() => setError('')}
                  className="text-xs mt-1 text-red-300 hover:text-red-200 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-white/10 bg-white/5 backdrop-blur-sm px-6 py-4">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 focus-within:border-purple-500/50 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your documents..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/40 disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg shadow-purple-500/30"
              >
                {isLoading ? (
                  <Zap size={16} className="animate-spin" />
                ) : (
                  'Send'
                )}
              </button>
            </div>
            <p className="text-xs text-white/50">
              💡 Tip: Use specific questions for better results. The AI will search all documents and cite sources.
            </p>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {conversationToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800 rounded-xl border border-white/20 p-6 max-w-sm mx-4 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete Conversation?
            </h3>
            <p className="text-white/60 text-sm mb-6">
              Are you sure you want to delete "{conversationToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConversationToDelete(null)}
                className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConversation(conversationToDelete)}
                className="flex-1 px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
