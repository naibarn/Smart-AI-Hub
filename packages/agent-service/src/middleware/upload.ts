import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ErrorCode, HttpStatus } from '@/types';
import { logger } from '@/utils/logger';

// Mock upload middleware for now
// In a real implementation, this would use multer or another file upload library
export const uploadMiddleware = {
  single: (fieldName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Mock file upload - in a real implementation, this would handle file uploads
      // For now, we'll just set a mock file object
      req.file = {
        fieldname: fieldName,
        originalname: 'mock-document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('mock file content'),
        destination: '/tmp',
        filename: 'mock-file.pdf',
        path: '/tmp/mock-file.pdf'
      } as any;
      
      next();
    };
  },
  
  array: (fieldName: string, maxCount?: number) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Mock multiple file upload
      (req as any).files = [
        {
          fieldname: fieldName,
          originalname: 'mock-document.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 1024,
          buffer: Buffer.from('mock file content'),
          destination: '/tmp',
          filename: 'mock-file.pdf',
          path: '/tmp/mock-file.pdf'
        }
      ];
      
      next();
    };
  }
};

// Error handling middleware for file uploads
export const handleUploadError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'File size too large. Maximum size is 10MB.'
      },
      timestamp: new Date()
    } as ApiResponse);
    return;
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Too many files. Maximum is 5 files at once.'
      },
      timestamp: new Date()
    } as ApiResponse);
    return;
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Unexpected file field.'
      },
      timestamp: new Date()
    } as ApiResponse);
    return;
  }
  
  // Handle file type errors
  if (error.message && error.message.includes('File type')) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: error.message
      },
      timestamp: new Date()
    } as ApiResponse);
    return;
  }
  
  // Pass other errors to the next middleware
  next(error);
};

// Export convenience functions
export const uploadSingle = uploadMiddleware.single('file');
export const uploadMultiple = uploadMiddleware.array('files', 5);