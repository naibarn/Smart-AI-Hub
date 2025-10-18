import { apiService } from './api.service';
import {
  Document,
  DocumentChunk,
  DocumentAccessLevel,
  RAGQueryRequest,
  RAGQueryResponse,
  UploadDocumentRequest,
  UpdateDocumentAccessRequest,
  DocumentAccessLog,
  RAGQueryResult,
} from '@shared/types/rag';

/**
 * Service for RAG (Retrieval-Augmented Generation) system operations
 */
class RAGService {
  /**
   * Upload a document to the RAG system
   * @param request - Upload document request
   * @returns Uploaded document information
   */
  async uploadDocument(request: UploadDocumentRequest): Promise<Document> {
    const formData = new FormData();

    if (request.file instanceof File) {
      formData.append('file', request.file);
    } else {
      // If it's a Buffer, convert to Blob
      const blob = new Blob([request.file as any]);
      formData.append('file', blob);
    }

    formData.append('title', request.title);
    formData.append('accessLevel', request.accessLevel);

    if (request.sharedWithAgentIds) {
      formData.append('sharedWithAgentIds', JSON.stringify(request.sharedWithAgentIds));
    }

    if (request.agentId) {
      formData.append('agentId', request.agentId);
    }

    const response = await fetch(`${apiService['baseURL']}/api/rag/documents/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get list of documents
   * @param params - Query parameters
   * @returns List of documents
   */
  async getDocuments(params?: {
    page?: number;
    limit?: number;
    accessLevel?: DocumentAccessLevel;
    search?: string;
  }): Promise<{ data: Document[]; total: number }> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return apiService.get<{ data: Document[]; total: number }>(
      `/api/rag/documents?${queryParams.toString()}`
    );
  }

  /**
   * Get document by ID
   * @param id - Document ID
   * @returns Document information
   */
  async getDocument(id: string): Promise<Document> {
    return apiService.get<Document>(`/api/rag/documents/${id}`);
  }

  /**
   * Update document access
   * @param id - Document ID
   * @param request - Update access request
   * @returns Updated document
   */
  async updateDocumentAccess(id: string, request: UpdateDocumentAccessRequest): Promise<Document> {
    return apiService.patch<Document>(`/api/rag/documents/${id}/access`, request);
  }

  /**
   * Delete a document
   * @param id - Document ID
   * @returns Success response
   */
  async deleteDocument(id: string): Promise<{ success: boolean }> {
    return apiService.delete<{ success: boolean }>(`/api/rag/documents/${id}`);
  }

  /**
   * Get document chunks
   * @param documentId - Document ID
   * @param params - Query parameters
   * @returns List of document chunks
   */
  async getDocumentChunks(
    documentId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ data: DocumentChunk[]; total: number }> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return apiService.get<{ data: DocumentChunk[]; total: number }>(
      `/api/rag/documents/${documentId}/chunks?${queryParams.toString()}`
    );
  }

  /**
   * Query the RAG system
   * @param request - Query request
   * @returns Query response with relevant chunks
   */
  async query(request: RAGQueryRequest): Promise<RAGQueryResponse> {
    return apiService.post<RAGQueryResponse>('/api/rag/query', request);
  }

  /**
   * Get document access logs
   * @param documentId - Document ID
   * @param params - Query parameters
   * @returns List of access logs
   */
  async getDocumentAccessLogs(
    documentId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ data: DocumentAccessLog[]; total: number }> {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return apiService.get<{ data: DocumentAccessLog[]; total: number }>(
      `/api/rag/documents/${documentId}/access-logs?${queryParams.toString()}`
    );
  }

  /**
   * Get RAG system statistics
   * @returns RAG system statistics
   */
  async getStats(): Promise<{
    totalDocuments: number;
    totalChunks: number;
    totalQueries: number;
    averageQueryTime: number;
  }> {
    return apiService.get<{
      totalDocuments: number;
      totalChunks: number;
      totalQueries: number;
      averageQueryTime: number;
    }>('/api/rag/stats');
  }
}

export const ragService = new RAGService();
export default ragService;
