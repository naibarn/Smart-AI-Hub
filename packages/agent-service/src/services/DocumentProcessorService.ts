import { Document, DocumentChunk, DocumentProcessingResult, ErrorCode } from '@/types';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export interface ProcessDocumentResult {
  success: boolean;
  chunksCreated?: number;
  vectorsCreated?: number;
  error?: {
    code: ErrorCode;
    message: string;
  };
}

export class DocumentProcessorService {
  private chunkSize: number = 1000; // characters per chunk
  private chunkOverlap: number = 200; // characters overlap between chunks

  /**
   * Process document and create chunks
   */
  async processDocument(document: Document, fileBuffer: Buffer): Promise<ProcessDocumentResult> {
    try {
      // Extract text from file
      const text = await this.extractText(fileBuffer, document.fileType!);
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: {
            code: ErrorCode.PROCESSING_FAILED,
            message: 'No text could be extracted from document',
          },
        };
      }

      // Split text into chunks
      const chunks = this.splitTextIntoChunks(text);

      // Create document chunk records
      const documentChunks: DocumentChunk[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk: DocumentChunk = {
          id: this.generateChunkId(document.id, i),
          documentId: document.id,
          chunkIndex: i,
          chunkText: chunks[i],
          chunkSize: chunks[i].length,
          vectorId: '', // Will be set after vector creation
          embeddingModel: 'bge-base-en-v1.5',
          createdAt: new Date(),
        };
        documentChunks.push(chunk);
      }

      // Save chunks to database
      await this.saveDocumentChunks(documentChunks);

      // Create vectors for each chunk
      let vectorsCreated = 0;
      for (const chunk of documentChunks) {
        const vectorResult = await this.createVectorForChunk(chunk, document);
        if (vectorResult.success) {
          vectorsCreated++;
          chunk.vectorId = vectorResult.data!;
          await this.updateDocumentChunk(chunk);
        }
      }

      return {
        success: true,
        chunksCreated: chunks.length,
        vectorsCreated,
      };
    } catch (error) {
      console.error('Error processing document:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.PROCESSING_FAILED,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Extract text from different file types
   */
  private async extractText(fileBuffer: Buffer, fileType: string): Promise<string> {
    try {
      switch (fileType) {
        case 'application/pdf':
          return await this.extractTextFromPDF(fileBuffer);

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractTextFromDocx(fileBuffer);

        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          return await this.extractTextFromXlsx(fileBuffer);

        case 'text/plain':
        case 'text/markdown':
          return fileBuffer.toString('utf-8');

        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error(`Error extracting text from ${fileType}:`, error);
      throw error;
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractTextFromPDF(fileBuffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(fileBuffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from DOCX
   */
  private async extractTextFromDocx(fileBuffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  }

  /**
   * Extract text from XLSX
   */
  private async extractTextFromXlsx(fileBuffer: Buffer): Promise<string> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      let text = '';

      workbook.SheetNames.forEach((sheetName: string) => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetText = XLSX.utils.sheet_to_txt(worksheet);
        text += `Sheet: ${sheetName}\n${sheetText}\n\n`;
      });

      return text;
    } catch (error) {
      console.error('Error extracting text from XLSX:', error);
      throw new Error('Failed to extract text from XLSX');
    }
  }

  /**
   * Split text into chunks with overlap
   */
  private splitTextIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + this.chunkSize;

      if (end >= text.length) {
        // Last chunk
        chunks.push(text.substring(start));
        break;
      }

      // Try to break at word boundary
      let breakPoint = end;
      while (breakPoint > start && text[breakPoint] !== ' ' && text[breakPoint] !== '\n') {
        breakPoint--;
      }

      if (breakPoint === start) {
        // No word boundary found, force break
        breakPoint = end;
      }

      chunks.push(text.substring(start, breakPoint).trim());
      start = breakPoint + 1 - this.chunkOverlap;
    }

    return chunks.filter((chunk) => chunk.length > 0);
  }

  /**
   * Create vector for a chunk
   */
  private async createVectorForChunk(
    chunk: DocumentChunk,
    document: Document
  ): Promise<{ success: boolean; data?: string; error?: any }> {
    try {
      // This would call the VectorizeService
      // For now, return a mock vector ID
      const vectorId = this.generateVectorId();

      return {
        success: true,
        data: vectorId,
      };
    } catch (error) {
      console.error('Error creating vector for chunk:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.EMBEDDING_FAILED,
          message: 'Failed to create vector for chunk',
        },
      };
    }
  }

  /**
   * Re-process document (update chunks and vectors)
   */
  async reprocessDocument(document: Document, fileBuffer: Buffer): Promise<ProcessDocumentResult> {
    try {
      // Delete existing chunks and vectors
      await this.deleteDocumentChunks(document.id);
      await this.deleteDocumentVectors(document.id);

      // Process document again
      return await this.processDocument(document, fileBuffer);
    } catch (error) {
      console.error('Error re-processing document:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.PROCESSING_FAILED,
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get document chunks
   */
  async getDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
    try {
      // Implementation would query from database

      return [];
    } catch (error) {
      console.error('Error getting document chunks:', error);
      return [];
    }
  }

  /**
   * Get chunk by ID
   */
  async getChunkById(chunkId: string): Promise<DocumentChunk | null> {
    try {
      // Implementation would query from database

      return null;
    } catch (error) {
      console.error('Error getting chunk:', error);
      return null;
    }
  }

  /**
   * Update chunk text
   */
  async updateChunkText(
    chunkId: string,
    newText: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      // Get existing chunk
      const chunk = await this.getChunkById(chunkId);
      if (!chunk) {
        return {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Chunk not found',
          },
        };
      }

      // Update chunk
      chunk.chunkText = newText;
      chunk.chunkSize = newText.length;
      await this.updateDocumentChunk(chunk);

      // Recreate vector
      const vectorResult = await this.createVectorForChunk(chunk, {} as Document);
      if (vectorResult.success) {
        chunk.vectorId = vectorResult.data!;
        await this.updateDocumentChunk(chunk);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error updating chunk text:', error);
      return {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to update chunk text',
        },
      };
    }
  }

  // Private helper methods

  private generateChunkId(documentId: string, index: number): string {
    return `${documentId}_chunk_${index}`;
  }

  private generateVectorId(): string {
    return `vec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveDocumentChunks(chunks: DocumentChunk[]): Promise<void> {
    // Implementation would save to database
  }

  private async updateDocumentChunk(chunk: DocumentChunk): Promise<void> {
    // Implementation would update in database
  }

  private async deleteDocumentChunks(documentId: string): Promise<void> {
    // Implementation would delete from database
  }

  private async deleteDocumentVectors(documentId: string): Promise<void> {
    // Implementation would delete vectors
  }
}
