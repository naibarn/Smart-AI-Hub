/**
 * RAG System Types
 * Types for Retrieval-Augmented Generation system with multi-tier access control
 */

// Document access levels
export enum DocumentAccessLevel {
  PRIVATE = 'PRIVATE',
  AGENT = 'AGENT',
  AGENCY = 'AGENCY',
  ORGANIZATION = 'ORGANIZATION',
  PUBLIC = 'PUBLIC'
}

// Document status
export enum DocumentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Document types
export interface Document {
  id: string;
  userId: string;
  organizationId?: string;
  agencyId?: string;
  agentId?: string;
  title: string;
  filename?: string;
  fileType?: string;
  fileSize?: number;
  r2Bucket: string;
  r2Key: string;
  vectorizeIndex: string;
  vectorizeNamespace?: string;
  totalChunks: number;
  accessLevel: DocumentAccessLevel;
  sharedWithAgentIds: string[];
  allowDownload: boolean;
  allowCopy: boolean;
  status: DocumentStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

// Document chunk
export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  chunkText: string;
  chunkSize: number;
  vectorId: string;
  embeddingModel: string;
  pageNumber?: number;
  sectionTitle?: string;
  createdAt: Date;
}

// Access log
export interface DocumentAccessLog {
  id: string;
  documentId: string;
  userId: string;
  agentId?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  granted: boolean;
  deniedReason?: string;
  accessedAt: Date;
}

// RAG query request
export interface RAGQueryRequest {
  query: string;
  agentId?: string;
  topK?: number;
  accessLevel?: DocumentAccessLevel;
  filters?: {
    organizationId?: string;
    agencyId?: string;
    userId?: string;
  };
}

// RAG query response
export interface RAGQueryResponse {
  results: RAGQueryResult[];
  totalResults: number;
  queryTime: number;
}

// RAG query result
export interface RAGQueryResult {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  chunkText: string;
  score: number;
  metadata: {
    pageNumber?: number;
    sectionTitle?: string;
    accessLevel: DocumentAccessLevel;
  };
}

// Upload document request
export interface UploadDocumentRequest {
  file: File | Buffer;
  title: string;
  accessLevel: DocumentAccessLevel;
  sharedWithAgentIds?: string[];
  agentId?: string;
}

// Update document access request
export interface UpdateDocumentAccessRequest {
  accessLevel: DocumentAccessLevel;
  sharedWithAgentIds?: string[];
}

// Vectorize configuration
export interface VectorizeConfig {
  dimensions: number;
  metric: 'cosine' | 'euclidean' | 'dotproduct';
  metadataIndexed: string[];
}

// R2 configuration
export interface R2Config {
  bucket: string;
  region: string;
  endpoint?: string;
}

// RAG service configuration
export interface RAGServiceConfig {
  vectorize: VectorizeConfig;
  r2: R2Config;
  embedding: {
    model: string;
    batchSize: number;
    maxTokens: number;
  };
  chunking: {
    chunkSize: number;
    chunkOverlap: number;
  };
}

// MCP RAG tool schemas
export interface MCPQueryRAGTool {
  name: 'query_rag';
  description: string;
  inputSchema: {
    query: string;
    agentId?: string;
    topK?: number;
  };
}

export interface MCPUploadDocumentTool {
  name: 'upload_document';
  description: string;
  inputSchema: {
    file: string; // base64 encoded
    title: string;
    accessLevel: DocumentAccessLevel;
    sharedWithAgentIds?: string[];
  };
}

// RAG constants
export const RAG_CONSTANTS = {
  // Vectorize indexes
  VECTORIZE_INDEXES: {
    DOCUMENTS: 'documents-index',
    CONVERSATIONS: 'conversations-index',
    SKILLS_KNOWLEDGE: 'skills-knowledge-index',
  },
  
  // R2 buckets
  R2_BUCKETS: {
    DOCUMENTS: 'smart-ai-hub-documents',
    IMAGES: 'smart-ai-hub-images',
    VIDEOS: 'smart-ai-hub-videos',
  },
  
  // File limits
  FILE_LIMITS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_TYPES: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/markdown'],
  },
  
  // Embedding settings
  EMBEDDING: {
    DEFAULT_MODEL: 'bge-base-en-v1.5',
    DEFAULT_DIMENSIONS: 768,
    MAX_BATCH_SIZE: 100,
  },
  
  // Chunking settings
  CHUNKING: {
    DEFAULT_CHUNK_SIZE: 1000,
    DEFAULT_CHUNK_OVERLAP: 200,
  },
  
  // Query settings
  QUERY: {
    DEFAULT_TOP_K: 5,
    MAX_TOP_K: 20,
    MIN_SCORE_THRESHOLD: 0.7,
  },
} as const;