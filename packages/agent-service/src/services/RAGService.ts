import {
  Document,
  DocumentChunk,
  DocumentAccessLog,
  AccessLevel,
  DocumentStatus,
  UploadDocumentRequest,
  QueryRagRequest,
  QueryRagResponse,
  RAGResult,
  UpdateDocumentAccessRequest,
  VectorMetadata,
  DocumentProcessingResult,
  User,
  ApiResponse,
  ErrorCode,
  HttpStatus
} from '@/types';
import { CloudflareR2Service } from './CloudflareR2Service';
import { CloudflareVectorizeService } from './CloudflareVectorizeService';
import { DocumentProcessorService } from './DocumentProcessorService';
import { AccessControlService } from './AccessControlService';
import { logger } from '@/utils/logger';

export class RAGService {
  constructor(
    private r2Service: CloudflareR2Service,
    private vectorizeService: CloudflareVectorizeService,
    private documentProcessor: DocumentProcessorService,
    private accessControl: AccessControlService
  ) {}

  /**
   * Upload and process a document
   */
  async uploadDocument(
    userId: string,
    request: UploadDocumentRequest
  ): Promise<ApiResponse<Document>> {
    try {
      logger.info(`Uploading document for user ${userId}: ${request.title}`);

      // Validate file size (max 10MB)
      if (request.file.size > 10 * 1024 * 1024) {
        return {
          success: false,
          error: {
            code: ErrorCode.FILE_TOO_LARGE,
            message: 'File size exceeds 10MB limit'
          }
        };
      }

      // Validate file type
      const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/markdown'];
      if (!supportedTypes.includes(request.file.mimetype)) {
        return {
          success: false,
          error: {
            code: ErrorCode.INVALID_FILE_TYPE,
            message: 'Unsupported file type'
          }
        };
      }

      // Create document record
      const document: Document = {
        id: this.generateId(),
        userId,
        organizationId: await this.getUserOrganizationId(userId),
        agencyId: await this.getUserAgencyId(userId),
        agentId: request.agentId,
        title: request.title,
        filename: request.file.originalname,
        fileType: request.file.mimetype,
        fileSize: request.file.size,
        r2Bucket: process.env.R2_DOCUMENTS_BUCKET!,
        r2Key: this.generateR2Key(userId, request.file.originalname),
        vectorizeIndex: process.env.VECTORIZE_DOCUMENTS_INDEX!,
        vectorizeNamespace: this.generateId(),
        totalChunks: 0,
        accessLevel: request.accessLevel,
        sharedWithAgentIds: request.sharedWithAgentIds || [],
        allowDownload: true,
        allowCopy: true,
        status: DocumentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Upload file to R2
      const uploadResult = await this.r2Service.uploadFile(
        document.r2Bucket,
        document.r2Key,
        request.file.buffer
      );

      if (!uploadResult.success) {
        return {
          success: false,
          error: uploadResult.error
        };
      }

      // Save document to database
      await this.saveDocument(document);

      // Process document asynchronously
      this.processDocumentAsync(document);

      logger.info(`Document uploaded successfully: ${document.id}`);

      return {
        success: true,
        data: document
      };
    } catch (error) {
      logger.error('Error uploading document:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to upload document'
        }
      };
    }
  }

  /**
   * Query documents using RAG
   */
  async queryDocuments(
    userId: string,
    request: QueryRagRequest
  ): Promise<ApiResponse<QueryRagResponse>> {
    try {
      logger.info(`Querying documents for user ${userId}: ${request.query}`);

      const startTime = Date.now();
      const topK = request.topK || 5;

      // Generate embedding for query
      const queryEmbedding = await this.vectorizeService.generateEmbedding(request.query);
      if (!queryEmbedding.success) {
        return {
          success: false,
          error: queryEmbedding.error
        };
      }

      // Build access filter
      const accessFilter = await this.accessControl.buildAccessFilter(userId, request.agentId);

      // Search vectors
      const searchResult = await this.vectorizeService.searchVectors(
        process.env.VECTORIZE_DOCUMENTS_INDEX!,
        queryEmbedding.data!,
        topK,
        accessFilter
      );

      if (!searchResult.success) {
        return {
          success: false,
          error: searchResult.error
        };
      }

      // Process results and check access permissions
      const results: RAGResult[] = [];
      for (const match of searchResult.data!) {
        const document = await this.getDocumentById(match.metadata.documentId);
        if (!document) continue;

        const hasAccess = await this.accessControl.checkDocumentAccess(userId, document);
        if (!hasAccess) continue;

        // Log access
        await this.logDocumentAccess(document.id, userId, request.agentId, 'query', true);

        results.push({
          documentId: document.id,
          documentTitle: document.title,
          chunkId: match.id,
          chunkText: match.text,
          score: match.score,
          metadata: match.metadata
        });
      }

      const queryTime = Date.now() - startTime;

      logger.info(`Query completed in ${queryTime}ms, found ${results.length} results`);

      return {
        success: true,
        data: {
          results,
          totalResults: results.length,
          queryTime
        }
      };
    } catch (error) {
      logger.error('Error querying documents:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to query documents'
        }
      };
    }
  }

  /**
   * Get documents for a user
   */
  async getUserDocuments(
    userId: string,
    agentId?: string,
    accessLevel?: AccessLevel
  ): Promise<ApiResponse<Document[]>> {
    try {
      const documents = await this.getDocumentsByUserId(userId, agentId, accessLevel);
      return {
        success: true,
        data: documents
      };
    } catch (error) {
      logger.error('Error getting user documents:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get documents'
        }
      };
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(
    userId: string,
    documentId: string
  ): Promise<ApiResponse<Document>> {
    try {
      const document = await this.getDocumentById(documentId);
      if (!document) {
        return {
          success: false,
          error: {
            code: ErrorCode.DOCUMENT_NOT_FOUND,
            message: 'Document not found'
          }
        };
      }

      const hasAccess = await this.accessControl.checkDocumentAccess(userId, document);
      if (!hasAccess) {
        await this.logDocumentAccess(documentId, userId, undefined, 'view', false, 'Access denied');
        return {
          success: false,
          error: {
            code: ErrorCode.ACCESS_DENIED,
            message: 'Access denied'
          }
        };
      }

      await this.logDocumentAccess(documentId, userId, undefined, 'view', true);

      return {
        success: true,
        data: document
      };
    } catch (error) {
      logger.error('Error getting document:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get document'
        }
      };
    }
  }

  /**
   * Update document access level
   */
  async updateDocumentAccess(
    userId: string,
    documentId: string,
    request: UpdateDocumentAccessRequest
  ): Promise<ApiResponse<Document>> {
    try {
      const document = await this.getDocumentById(documentId);
      if (!document) {
        return {
          success: false,
          error: {
            code: ErrorCode.DOCUMENT_NOT_FOUND,
            message: 'Document not found'
          }
        };
      }

      // Check if user is the owner
      if (document.userId !== userId) {
        return {
          success: false,
          error: {
            code: ErrorCode.ACCESS_DENIED,
            message: 'Only document owner can update access level'
          }
        };
      }

      // Update document
      document.accessLevel = request.accessLevel;
      document.sharedWithAgentIds = request.sharedWithAgentIds || [];
      document.updatedAt = new Date();

      await this.updateDocument(document);

      // Update vector metadata
      await this.updateVectorMetadata(document);

      logger.info(`Document access updated: ${documentId}`);

      return {
        success: true,
        data: document
      };
    } catch (error) {
      logger.error('Error updating document access:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to update document access'
        }
      };
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(
    userId: string,
    documentId: string
  ): Promise<ApiResponse<void>> {
    try {
      const document = await this.getDocumentById(documentId);
      if (!document) {
        return {
          success: false,
          error: {
            code: ErrorCode.DOCUMENT_NOT_FOUND,
            message: 'Document not found'
          }
        };
      }

      // Check if user is the owner
      if (document.userId !== userId) {
        return {
          success: false,
          error: {
            code: ErrorCode.ACCESS_DENIED,
            message: 'Only document owner can delete document'
          }
        };
      }

      // Delete from R2
      await this.r2Service.deleteFile(document.r2Bucket, document.r2Key);

      // Delete vectors
      await this.vectorizeService.deleteVectors(
        document.vectorizeIndex,
        document.vectorizeNamespace
      );

      // Delete from database
      await this.deleteDocumentById(documentId);

      logger.info(`Document deleted: ${documentId}`);

      return {
        success: true
      };
    } catch (error) {
      logger.error('Error deleting document:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to delete document'
        }
      };
    }
  }

  /**
   * Download document
   */
  async downloadDocument(
    userId: string,
    documentId: string
  ): Promise<ApiResponse<{ stream: NodeJS.ReadableStream; filename: string }>> {
    try {
      const document = await this.getDocumentById(documentId);
      if (!document) {
        return {
          success: false,
          error: {
            code: ErrorCode.DOCUMENT_NOT_FOUND,
            message: 'Document not found'
          }
        };
      }

      const hasAccess = await this.accessControl.checkDocumentAccess(userId, document);
      if (!hasAccess || !document.allowDownload) {
        await this.logDocumentAccess(documentId, userId, undefined, 'download', false, 'Access denied');
        return {
          success: false,
          error: {
            code: ErrorCode.ACCESS_DENIED,
            message: 'Download not allowed'
          }
        };
      }

      const downloadResult = await this.r2Service.downloadFile(
        document.r2Bucket,
        document.r2Key
      );

      if (!downloadResult.success) {
        return {
          success: false,
          error: downloadResult.error
        };
      }

      await this.logDocumentAccess(documentId, userId, undefined, 'download', true);

      return {
        success: true,
        data: {
          stream: downloadResult.data!,
          filename: document.filename || document.title
        }
      };
    } catch (error) {
      logger.error('Error downloading document:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to download document'
        }
      };
    }
  }

  // Private methods

  private async processDocumentAsync(document: Document): Promise<void> {
    try {
      logger.info(`Processing document: ${document.id}`);

      // Update status to processing
      document.status = DocumentStatus.PROCESSING;
      await this.updateDocument(document);

      // Download file from R2
      const downloadResult = await this.r2Service.downloadFile(
        document.r2Bucket,
        document.r2Key
      );

      if (!downloadResult.success) {
        throw new Error(`Failed to download file: ${downloadResult.error?.message}`);
      }

      // Process document
      const processResult = await this.documentProcessor.processDocument(
        document,
        downloadResult.data!
      );

      if (!processResult.success) {
        throw new Error(`Document processing failed: ${processResult.error}`);
      }

      // Update document with processing results
      document.status = DocumentStatus.COMPLETED;
      document.totalChunks = processResult.chunksCreated;
      document.processedAt = new Date();
      await this.updateDocument(document);

      logger.info(`Document processed successfully: ${document.id}`);
    } catch (error) {
      logger.error(`Error processing document ${document.id}:`, error);
      
      // Update status to failed
      document.status = DocumentStatus.FAILED;
      document.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateDocument(document);
    }
  }

  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateR2Key(userId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${userId}/${timestamp}/${sanitizedFilename}`;
  }

  private async getUserOrganizationId(userId: string): Promise<string | undefined> {
    // Implementation would query the database
    return undefined;
  }

  private async getUserAgencyId(userId: string): Promise<string | undefined> {
    // Implementation would query the database
    return undefined;
  }

  private async saveDocument(document: Document): Promise<void> {
    // Implementation would save to database
  }

  private async updateDocument(document: Document): Promise<void> {
    // Implementation would update in database
  }

  private async getDocumentById(documentId: string): Promise<Document | null> {
    // Implementation would query from database
    return null;
  }

  private async getDocumentsByUserId(
    userId: string,
    agentId?: string,
    accessLevel?: AccessLevel
  ): Promise<Document[]> {
    // Implementation would query from database
    return [];
  }

  private async deleteDocumentById(documentId: string): Promise<void> {
    // Implementation would delete from database
  }

  private async updateVectorMetadata(document: Document): Promise<void> {
    // Implementation would update vector metadata
  }

  private async logDocumentAccess(
    documentId: string,
    userId: string,
    agentId: string | undefined,
    action: string,
    granted: boolean,
    deniedReason?: string
  ): Promise<void> {
    // Implementation would log access
  }
}