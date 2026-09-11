import { useState, useEffect, useRef, FormEvent } from 'react';
import { useAuthStore } from '@/store/authStore';
import { chatAPI, ragAPI } from '@/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    chunk_id: string;
    document_title: string;
    document_type: string;
    page_number?: number;
    section?: string;
  }>;
  timestamp: Date;
  isLoading?: boolean;
}

export default function Chat() {
  const { token } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ragStatus, setRagStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check RAG service status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await ragAPI.status();
        setRagStatus(status.data);
      } catch (err: any) {
        console.error('Failed to check RAG status:', err);
      }
    };

    if (token) {
      checkStatus();
    }
  }, [token]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      // Call chat API
      const response = await chatAPI.sendMessage(null, input, 10, 0.7, 0.3);
      
      // Remove loading message and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        return [
          ...filtered,
          {
            id: `response-${Date.now()}`,
            role: 'assistant',
            content: response.data.response,
            sources: response.data.sources,
            timestamp: new Date(),
          },
        ];
      });
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
    <div className="flex h-screen bg-gray-50">
      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Document Chat</h1>
              <p className="text-sm text-gray-600 mt-1">
                Ask questions about your uploaded documents
              </p>
            </div>
            {ragStatus && (
              <div className="text-right">
                <p className="text-xs font-medium text-gray-500">
                  {ragStatus.llm_configured ? '✅ LLM Ready' : '⚠️ LLM Not Configured'}
                </p>
                {ragStatus.embeddings_available && (
                  <p className="text-xs text-gray-500">
                    Embeddings: {ragStatus.embedding_model?.split('/')[1] || 'BGE'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start a Conversation
              </h3>
              <p className="text-gray-600 max-w-md">
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
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <div>
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      
                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            📚 Sources ({message.sources.length})
                          </p>
                          <div className="space-y-2">
                            {message.sources.map((source) => (
                              <div
                                key={source.chunk_id}
                                className="text-xs bg-gray-50 p-2 rounded border border-gray-200"
                              >
                                <p className="font-medium text-gray-900">
                                  {source.document_title}
                                </p>
                                <div className="flex gap-2 mt-1 text-gray-600">
                                  {source.page_number && <span>📄 Page {source.page_number}</span>}
                                  <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                                    {source.document_type}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
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
          <div className="px-6 py-3 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your documents..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              💡 Tip: Use specific questions for better results. The AI will search all documents and cite sources.
            </p>
          </form>
        </div>
      </div>

      {/* Info Sidebar */}
      <div className="hidden lg:block w-64 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">How It Works</h3>
        <ul className="space-y-3 text-xs text-gray-600">
          <li className="flex gap-2">
            <span className="flex-shrink-0 text-indigo-600 font-bold">1</span>
            <span>Ask a question about your documents</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 text-indigo-600 font-bold">2</span>
            <span>AI searches all PDFs using semantic + keyword search</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 text-indigo-600 font-bold">3</span>
            <span>LLM generates answer with relevant context</span>
          </li>
          <li className="flex gap-2">
            <span className="flex-shrink-0 text-indigo-600 font-bold">4</span>
            <span>Sources are cited for transparency</span>
          </li>
        </ul>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Example Questions</h3>
          <ul className="space-y-2 text-xs">
            {[
              'What are the placement eligibility criteria?',
              'Who is eligible for this scholarship?',
              'What are the exam dates?',
              'What documents do I need to submit?',
              'Tell me about company policies',
            ].map((question) => (
              <button
                key={question}
                onClick={() => setInput(question)}
                className="w-full text-left p-2 rounded bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors text-xs"
              >
                {question}
              </button>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
