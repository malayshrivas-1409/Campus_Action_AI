import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { searchAPI } from '@/services/api';

interface SearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  document_type: string;
  content: string;
  page_number?: number;
  section?: string;
  similarity_score: number;
}

export default function Search() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'vector' | 'keyword'>('vector');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to search</p>
      </div>
    );
  }

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResults([]);
    setHasSearched(true);

    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsLoading(true);
    try {
      const response = searchType === 'vector' 
        ? await searchAPI.vectorSearch(query, 20, 0.5)
        : await searchAPI.keywordSearch(query, 20);

      setResults(response.data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to search');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      placement: 'bg-blue-100 text-blue-800',
      exam: 'bg-purple-100 text-purple-800',
      scholarship: 'bg-green-100 text-green-800',
      academic: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors['other'];
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Documents</h1>
          <p className="text-gray-600">Find relevant information across all uploaded documents</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., placement eligibility requirements"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="vector"
                    checked={searchType === 'vector'}
                    onChange={(e) => setSearchType(e.target.value as 'vector' | 'keyword')}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-700">Semantic (Vector)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="keyword"
                    checked={searchType === 'keyword'}
                    onChange={(e) => setSearchType(e.target.value as 'vector' | 'keyword')}
                    className="mr-2"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-gray-700">Keyword</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {searchType === 'vector' 
                  ? 'Semantic search finds meaning-based matches' 
                  : 'Keyword search finds exact text matches'}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </span>
              ) : (
                'Search'
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {hasSearched && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Results {results.length > 0 && <span className="text-gray-600">({results.length})</span>}
              </h2>
            </div>

            {results.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No results found</h3>
                <p className="mt-1 text-gray-500">Try different search terms or keywords</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {results.map((result) => (
                  <div
                    key={result.chunk_id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{result.document_title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getTypeColor(result.document_type)}`}>
                          {result.document_type}
                        </span>
                      </div>
                      {searchType === 'vector' && (
                        <div className={`text-sm font-semibold ${getScoreColor(result.similarity_score)}`}>
                          {(result.similarity_score * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      {result.page_number && <span>📄 Page {result.page_number}</span>}
                      {result.section && <span>📑 {result.section}</span>}
                    </div>

                    {/* Content */}
                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {result.content}
                    </p>

                    {/* Action */}
                    <button
                      onClick={() => navigate(`/documents/${result.document_id}`)}
                      className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                    >
                      View Document →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Search Tips</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use <strong>Semantic Search</strong> for meaning-based queries (e.g., &quot;who can apply&quot;)</li>
            <li>• Use <strong>Keyword Search</strong> for exact phrase matches (e.g., &quot;CGPA 7.0&quot;)</li>
            <li>• Longer queries may give better semantic results</li>
            <li>• Results are ranked by relevance score</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
