// RAG System Types

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
  accessLevel: AccessLevel;
  sharedWithAgentIds: string[];
  allowDownload: boolean;
  allowCopy: boolean;
  status: DocumentStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
}

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

export enum AccessLevel {
  PRIVATE = 'PRIVATE',
  AGENT = 'AGENT',
  AGENCY = 'AGENCY',
  ORGANIZATION = 'ORGANIZATION',
  PUBLIC = 'PUBLIC',
}

export enum DocumentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface UploadDocumentRequest {
  file: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  };
  title: string;
  accessLevel: AccessLevel;
  sharedWithAgentIds?: string[];
  agentId?: string;
}

export interface QueryRagRequest {
  query: string;
  agentId?: string;
  topK?: number;
}

export interface QueryRagResponse {
  results: RAGResult[];
  totalResults: number;
  queryTime: number;
}

export interface RAGResult {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  chunkText: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface UpdateDocumentAccessRequest {
  accessLevel: AccessLevel;
  sharedWithAgentIds?: string[];
}

// Cloudflare Vectorize Configuration
export interface VectorizeConfig {
  dimensions: number;
  metric: 'cosine' | 'euclidean' | 'dotproduct';
  metadataIndexed: string[];
}

export interface VectorMetadata {
  documentId: string;
  userId: string;
  organizationId?: string;
  agencyId?: string;
  agentId?: string;
  accessLevel: AccessLevel;
  chunkIndex: number;
}

// R2 Storage Configuration
export interface R2Config {
  bucket: string;
  key: string;
}

export interface DocumentProcessingResult {
  success: boolean;
  documentId: string;
  chunksCreated: number;
  vectorsCreated: number;
  error?: string;
}
