import { Request, Response } from 'express';
import { RAGService } from '@/services/RAGService';
import { ApiResponse, ErrorCode, HttpStatus } from '@/types';
import { logger } from '@/utils/logger';

export class RAGController {
  constructor(private ragService: RAGService) {}

  /**
   * Upload document
   */
  async uploadDocument(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const { title, accessLevel, sharedWithAgentIds, agentId } = req.body;
      const file = req.file;

      if (!file) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'File is required',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const result = await this.ragService.uploadDocument(userId, {
        file,
        title,
        accessLevel,
        sharedWithAgentIds,
        agentId,
      });

      if (result.success) {
        res.status(HttpStatus.CREATED).json({
          ...result,
          timestamp: new Date(),
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          ...result,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error in uploadDocument controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to upload document',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }

  /**
   * Query documents
   */
  async queryDocuments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const { query, agentId, topK } = req.body;

      if (!query) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Query is required',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const result = await this.ragService.queryDocuments(userId, {
        query,
        agentId,
        topK,
      });

      if (result.success) {
        res.status(HttpStatus.OK).json({
          ...result,
          timestamp: new Date(),
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          ...result,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error in queryDocuments controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to query documents',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }

  /**
   * Get user documents
   */
  async getUserDocuments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const { agentId, accessLevel } = req.query;

      const result = await this.ragService.getUserDocuments(
        userId,
        agentId as string,
        accessLevel as any
      );

      if (result.success) {
        res.status(HttpStatus.OK).json({
          ...result,
          timestamp: new Date(),
        });
      } else {
        res.status(HttpStatus.BAD_REQUEST).json({
          ...result,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error in getUserDocuments controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get user documents',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const { documentId } = req.params;

      if (!documentId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Document ID is required',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const result = await this.ragService.getDocument(userId, documentId);

      if (result.success) {
        res.status(HttpStatus.OK).json({
          ...result,
          timestamp: new Date(),
        });
      } else {
        const statusCode =
          result.error?.code === ErrorCode.DOCUMENT_NOT_FOUND
            ? HttpStatus.NOT_FOUND
            : HttpStatus.FORBIDDEN;
        res.status(statusCode).json({
          ...result,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error in getDocument controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get document',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }

  /**
   * Update document access
   */
  async updateDocumentAccess(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const { documentId } = req.params;
      const { accessLevel, sharedWithAgentIds } = req.body;

      if (!documentId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Document ID is required',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const result = await this.ragService.updateDocumentAccess(userId, documentId, {
        accessLevel,
        sharedWithAgentIds,
      });

      if (result.success) {
        res.status(HttpStatus.OK).json({
          ...result,
          timestamp: new Date(),
        });
      } else {
        const statusCode =
          result.error?.code === ErrorCode.DOCUMENT_NOT_FOUND
            ? HttpStatus.NOT_FOUND
            : HttpStatus.FORBIDDEN;
        res.status(statusCode).json({
          ...result,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error in updateDocumentAccess controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to update document access',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const { documentId } = req.params;

      if (!documentId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Document ID is required',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const result = await this.ragService.deleteDocument(userId, documentId);

      if (result.success) {
        res.status(HttpStatus.OK).json({
          ...result,
          timestamp: new Date(),
        });
      } else {
        const statusCode =
          result.error?.code === ErrorCode.DOCUMENT_NOT_FOUND
            ? HttpStatus.NOT_FOUND
            : HttpStatus.FORBIDDEN;
        res.status(statusCode).json({
          ...result,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error in deleteDocument controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to delete document',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }

  /**
   * Download document
   */
  async downloadDocument(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const { documentId } = req.params;

      if (!documentId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Document ID is required',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const result = await this.ragService.downloadDocument(userId, documentId);

      if (result.success) {
        const { stream, filename } = result.data!;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        stream.pipe(res);
      } else {
        const statusCode =
          result.error?.code === ErrorCode.DOCUMENT_NOT_FOUND
            ? HttpStatus.NOT_FOUND
            : HttpStatus.FORBIDDEN;
        res.status(statusCode).json({
          ...result,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      logger.error('Error in downloadDocument controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to download document',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }

  /**
   * Get documents (alias for getUserDocuments)
   */
  async getDocuments(req: Request, res: Response): Promise<void> {
    return this.getUserDocuments(req, res);
  }

  /**
   * Get document details (alias for getDocument)
   */
  async getDocumentDetails(req: Request, res: Response): Promise<void> {
    return this.getDocument(req, res);
  }

  /**
   * Share document (alias for updateDocumentAccess)
   */
  async shareDocument(req: Request, res: Response): Promise<void> {
    return this.updateDocumentAccess(req, res);
  }

  /**
   * Query RAG (alias for queryDocuments)
   */
  async queryRAG(req: Request, res: Response): Promise<void> {
    return this.queryDocuments(req, res);
  }

  /**
   * Get query details
   */
  async getQueryDetails(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const { queryId } = req.params;

      if (!queryId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Query ID is required',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      // Mock implementation - would get query details from database
      const mockQueryDetails = {
        id: queryId,
        userId,
        query: 'Sample query',
        results: [],
        createdAt: new Date(),
        status: 'completed',
      };

      res.status(HttpStatus.OK).json({
        success: true,
        data: mockQueryDetails,
        timestamp: new Date(),
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getQueryDetails controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get query details',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }

  /**
   * Get knowledge bases
   */
  async getKnowledgeBases(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      // Mock implementation - would get knowledge bases from database
      const mockKnowledgeBases = [
        {
          id: 'kb-1',
          name: 'Default Knowledge Base',
          description: 'Default knowledge base for user',
          userId,
          createdAt: new Date(),
        },
      ];

      res.status(HttpStatus.OK).json({
        success: true,
        data: mockKnowledgeBases,
        timestamp: new Date(),
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getKnowledgeBases controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get knowledge bases',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }

  /**
   * Create knowledge base
   */
  async createKnowledgeBase(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const { name, description } = req.body;

      if (!name) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Knowledge base name is required',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      // Mock implementation - would create knowledge base in database
      const mockKnowledgeBase = {
        id: 'kb-' + Date.now(),
        name,
        description: description || '',
        userId,
        createdAt: new Date(),
      };

      res.status(HttpStatus.CREATED).json({
        success: true,
        data: mockKnowledgeBase,
        timestamp: new Date(),
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in createKnowledgeBase controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to create knowledge base',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }

  /**
   * Get knowledge base documents
   */
  async getKnowledgeBaseDocuments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const { knowledgeBaseId } = req.params;

      if (!knowledgeBaseId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Knowledge base ID is required',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      // Mock implementation - would get documents from database
      const mockDocuments: any[] = [];

      res.status(HttpStatus.OK).json({
        success: true,
        data: mockDocuments,
        timestamp: new Date(),
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getKnowledgeBaseDocuments controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get knowledge base documents',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }

  /**
   * Add document to knowledge base
   */
  async addDocumentToKnowledgeBase(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const { knowledgeBaseId, documentId } = req.params;

      if (!knowledgeBaseId || !documentId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Knowledge base ID and document ID are required',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      // Mock implementation - would add document to knowledge base in database
      res.status(HttpStatus.OK).json({
        success: true,
        data: { message: 'Document added to knowledge base successfully' },
        timestamp: new Date(),
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in addDocumentToKnowledgeBase controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to add document to knowledge base',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }

  /**
   * Remove document from knowledge base
   */
  async removeDocumentFromKnowledgeBase(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      const { knowledgeBaseId, documentId } = req.params;

      if (!knowledgeBaseId || !documentId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Knowledge base ID and document ID are required',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      // Mock implementation - would remove document from knowledge base in database
      res.status(HttpStatus.OK).json({
        success: true,
        data: { message: 'Document removed from knowledge base successfully' },
        timestamp: new Date(),
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in removeDocumentFromKnowledgeBase controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to remove document from knowledge base',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }

  /**
   * Get RAG analytics
   */
  async getRAGAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'User not authenticated',
          },
          timestamp: new Date(),
        } as ApiResponse);
        return;
      }

      // Mock implementation - would get analytics from database
      const mockAnalytics = {
        totalDocuments: 0,
        totalQueries: 0,
        totalChunks: 0,
        storageUsed: 0,
        queryCount: 0,
        averageResponseTime: 0,
      };

      res.status(HttpStatus.OK).json({
        success: true,
        data: mockAnalytics,
        timestamp: new Date(),
      } as ApiResponse);
    } catch (error) {
      logger.error('Error in getRAGAnalytics controller:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to get RAG analytics',
        },
        timestamp: new Date(),
      } as ApiResponse);
    }
  }
}
