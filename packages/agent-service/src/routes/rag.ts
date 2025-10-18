import { Router } from 'express';
import { RAGController } from '@/controllers/RAGController';
import { uploadMiddleware } from '@/middleware';
import { validateRequest } from '@/middleware';
import { authenticate } from '@/middleware';
import { rateLimit } from '@/middleware';

const router = Router();
const ragController = new RAGController({} as any); // Mock service instance

/**
 * @route POST /api/rag/documents
 * @desc Upload a document for RAG processing
 * @access Private
 */
router.post(
  '/documents',
  authenticate,
  uploadMiddleware.single('file'),
  ragController.uploadDocument.bind(ragController)
);

/**
 * @route GET /api/rag/documents
 * @desc Get user's documents
 * @access Private
 */
router.get(
  '/documents',
  authenticate,
  ragController.getDocuments.bind(ragController)
);

/**
 * @route GET /api/rag/documents/:documentId
 * @desc Get document details
 * @access Private
 */
router.get(
  '/documents/:documentId',
  authenticate,
  ragController.getDocumentDetails.bind(ragController)
);

/**
 * @route DELETE /api/rag/documents/:documentId
 * @desc Delete a document
 * @access Private
 */
router.delete(
  '/documents/:documentId',
  authenticate,
  ragController.deleteDocument.bind(ragController)
);

/**
 * @route POST /api/rag/documents/:documentId/share
 * @desc Share a document with other users
 * @access Private
 */
router.post(
  '/documents/:documentId/share',
  authenticate,
  ragController.shareDocument.bind(ragController)
);

/**
 * @route POST /api/rag/query
 * @desc Query the RAG system
 * @access Private
 */
router.post(
  '/query',
  authenticate,
  rateLimit({ max: 100, windowMs: 60000 }), // 100 requests per minute
  ragController.queryRAG.bind(ragController)
);

/**
 * @route GET /api/rag/query/:queryId
 * @desc Get query details and results
 * @access Private
 */
router.get(
  '/query/:queryId',
  authenticate,
  ragController.getQueryDetails.bind(ragController)
);

/**
 * @route GET /apirag/knowledge-bases
 * @desc Get available knowledge bases
 * @access Private
 */
router.get(
  '/knowledge-bases',
  authenticate,
  ragController.getKnowledgeBases.bind(ragController)
);

/**
 * @route POST /api/rag/knowledge-bases
 * @desc Create a new knowledge base
 * @access Private
 */
router.post(
  '/knowledge-bases',
  authenticate,
  ragController.createKnowledgeBase.bind(ragController)
);

/**
 * @route GET /api/rag/knowledge-bases/:knowledgeBaseId/documents
 * @desc Get documents in a knowledge base
 * @access Private
 */
router.get(
  '/knowledge-bases/:knowledgeBaseId/documents',
  authenticate,
  ragController.getKnowledgeBaseDocuments.bind(ragController)
);

/**
 * @route POST /api/rag/knowledge-bases/:knowledgeBaseId/documents/:documentId
 * @desc Add a document to a knowledge base
 * @access Private
 */
router.post(
  '/knowledge-bases/:knowledgeBaseId/documents/:documentId',
  authenticate,
  ragController.addDocumentToKnowledgeBase.bind(ragController)
);

/**
 * @route DELETE /api/rag/knowledge-bases/:knowledgeBaseId/documents/:documentId
 * @desc Remove a document from a knowledge base
 * @access Private
 */
router.delete(
  '/knowledge-bases/:knowledgeBaseId/documents/:documentId',
  authenticate,
  ragController.removeDocumentFromKnowledgeBase.bind(ragController)
);

/**
 * @route GET /api/rag/analytics
 * @desc Get RAG usage analytics
 * @access Private
 */
router.get(
  '/analytics',
  authenticate,
  ragController.getRAGAnalytics.bind(ragController)
);

export default router;