import { Request } from 'express';
import { User } from './common';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      file?: {
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
    }
  }
}

export {};