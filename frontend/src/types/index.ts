// Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'admin' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  roll_number: string;
  department: string;
  batch: number;
  cgpa?: number;
  backlogs: number;
  created_at: string;
  updated_at: string;
}

// Document Types
export interface Document {
  id: string;
  title: string;
  document_type: string;
  source_url?: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  uploaded_by: string;
  uploaded_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_version_id: string;
  chunk_index: number;
  content: string;
  page_number?: number;
  section?: string;
  embedding?: number[];
  metadata?: Record<string, any>;
  created_at: string;
}

// Action Types
export interface Action {
  id: string;
  document_id: string;
  action_title: string;
  action_description?: string;
  action_type: string;
  deadline?: string;
  is_mandatory: boolean;
  required_documents: string[];
  dependencies: string[];
  evidence_chunks: string[];
  eligibility_requirements: string[];
  created_at: string;
  updated_at: string;
}

export interface StudentAction {
  id: string;
  student_id: string;
  action_id: string;
  eligibility_status: 'eligible' | 'not_eligible' | 'maybe';
  eligibility_reason?: string;
  eligibility_confidence?: number;
  required_info: string[];
  status: 'pending' | 'completed' | 'dismissed';
  view_count: number;
  first_viewed_at?: string;
  completed_at?: string;
  dismissed_at?: string;
  created_at: string;
  updated_at: string;
}

// Search Types
export interface SearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  document_type: string;
  content: string;
  page_number?: number;
  section?: string;
  similarity_score: number;
}

// Chat Types
export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  tokens_used?: number;
  created_at: string;
}

export interface Source {
  chunk_id: string;
  document_title: string;
  document_type: string;
  page_number?: number;
  section?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Notification Types
export interface Notification {
  id: string;
  student_id: string;
  action_id?: string;
  notification_type: string;
  title: string;
  message?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

// Auth Request Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  name: string;
  password: string;
}

export interface CreateStudentProfileRequest {
  roll_number: string;
  department: string;
  batch: number;
  cgpa?: number;
  backlogs?: number;
}
