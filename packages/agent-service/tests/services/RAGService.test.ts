import { RAGService } from '../../src/services/RAGService';

describe('RAGService', () => {
  let ragService: RAGService;

  beforeEach(() => {
    ragService = new RAGService(
      {} as any, // CloudflareR2Service
      {} as any, // CloudflareVectorizeService
      {} as any, // DocumentProcessorService
      {} as any  // AccessControlService
    );
  });

  describe('uploadDocument', () => {
    it('should upload a document successfully', async () => {
      const userId = 'user-123';
      const documentData = {
        file: {
          buffer: Buffer.from('test content'),
          originalname: 'test.txt',
          mimetype: 'text/plain'
        } as any,
        title: 'Test Document',
        accessLevel: 'private' as any
      };

      const result = await ragService.uploadDocument(userId, documentData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle upload errors', async () => {
      const userId = 'user-123';
      const documentData = {
        file: null,
        title: 'Test Document',
        accessLevel: 'private' as any
      };

      const result = await ragService.uploadDocument(userId, documentData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('queryDocuments', () => {
    it('should query documents successfully', async () => {
      const userId = 'user-123';
      const queryData = {
        query: 'test query',
        topK: 5
      };

      const result = await ragService.queryDocuments(userId, queryData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle query errors', async () => {
      const userId = 'user-123';
      const queryData = {
        query: '',
        topK: 5
      };

      const result = await ragService.queryDocuments(userId, queryData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getUserDocuments', () => {
    it('should get user documents successfully', async () => {
      const userId = 'user-123';

      const result = await ragService.getUserDocuments(userId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('getDocument', () => {
    it('should get a document successfully', async () => {
      const userId = 'user-123';
      const documentId = 'doc-123';

      const result = await ragService.getDocument(userId, documentId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle document not found', async () => {
      const userId = 'user-123';
      const documentId = 'non-existent-doc';

      const result = await ragService.getDocument(userId, documentId);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DOCUMENT_NOT_FOUND');
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      const userId = 'user-123';
      const documentId = 'doc-123';

      const result = await ragService.deleteDocument(userId, documentId);

      expect(result.success).toBe(true);
    });

    it('should handle delete errors', async () => {
      const userId = 'user-123';
      const documentId = 'non-existent-doc';

      const result = await ragService.deleteDocument(userId, documentId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});