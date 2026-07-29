import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { documentAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

interface Document {
  id: string;
  title: string;
  document_type: string;
  file_size: number;
  uploaded_at: string;
  created_at: string;
}

export default function DocumentList() {
  const { token } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');

  const documentTypes = [
    { value: '', label: 'All Types' },
    { value: 'placement', label: 'Placement' },
    { value: 'exam', label: 'Exam' },
    { value: 'scholarship', label: 'Scholarship' },
    { value: 'academic', label: 'Academic' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await documentAPI.list(0, 50, selectedType || undefined);
        setDocuments(response.data.items);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      loadDocuments();
    }
  }, [token, selectedType]);

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentAPI.delete(documentId);
      setDocuments(documents.filter((d) => d.id !== documentId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents</h1>
            <p className="text-gray-600">Manage all uploaded documents</p>
          </div>
          <Link
            to="/documents/upload"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            + Upload Document
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {documentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : documents.length === 0 ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No documents found</h3>
            <p className="mt-1 text-gray-500">Get started by uploading your first document.</p>
            <Link
              to="/documents/upload"
              className="mt-4 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Upload Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {documents.map((document) => (
              <div
                key={document.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{document.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(document.document_type)}`}>
                      {document.document_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>📁 {formatFileSize(document.file_size)}</span>
                    <span>📅 {formatDate(document.uploaded_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/documents/${document.id}`}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(document.id)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ About Documents</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• PDFs are automatically parsed and chunked for analysis</li>
            <li>• Embeddings are generated to enable semantic search</li>
            <li>• Maximum file size is 50MB per document</li>
            <li>• Deleting a document will remove it from the system</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
