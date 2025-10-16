import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  checkUserVisibility, 
  UserTier, 
  HierarchyRequest 
} from '../middleware/visibilityCheckRaw';
import { 
  authenticateJWT, 
  AuthenticatedRequest 
} from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

/**
 * Check if sender can transfer to receiver based on hierarchy rules
 */
async function canTransfer(
  senderId: string, 
  receiverId: string
): Promise<{ canTransfer: boolean; reason?: string }> {
  try {
    // First check visibility - sender must be able to see receiver
    const canSee = await checkUserVisibility(senderId, receiverId);
    if (!canSee) {
      return { canTransfer: false, reason: 'Cannot see target user' };
    }

    // Get user tiers
    const senderResult = await prisma.$queryRaw`
      SELECT tier FROM users WHERE id = ${senderId}
    ` as any[];
    
    const receiverResult = await prisma.$queryRaw`
      SELECT tier, is_blocked FROM users WHERE id = ${receiverId}
    ` as any[];

    const sender = senderResult[0];
    const receiver = receiverResult[0];

    if (!sender || !receiver) {
      return { canTransfer: false, reason: 'User not found' };
    }

    // Check if receiver is blocked
    if (receiver.is_blocked) {
      return { canTransfer: false, reason: 'Receiver is blocked' };
    }

    // Check authorization based on hierarchy
    switch (sender.tier) {
      case UserTier.administrator:
        return { canTransfer: true }; // Can transfer to anyone
        
      case UserTier.agency:
        // Can transfer to Organizations under this Agency or General users
        if (receiver.tier === UserTier.organization || receiver.tier === UserTier.general) {
          // Check if receiver belongs to this agency
          const receiverCheck = await prisma.$queryRaw`
            SELECT parent_agency_id FROM users WHERE id = ${receiverId}
          ` as any[];
          
          return { 
            canTransfer: receiverCheck[0]?.parent_agency_id === senderId 
          };
        }
        return { canTransfer: false, reason: 'Agency can only transfer to Organizations and General users under them' };
        
      case UserTier.organization:
        // Can transfer to Admin/General in same Organization
        if (receiver.tier === UserTier.admin || receiver.tier === UserTier.general) {
          const receiverCheck = await prisma.$queryRaw`
            SELECT parent_organization_id FROM users WHERE id = ${receiverId}
          ` as any[];
          
          return { 
            canTransfer: receiverCheck[0]?.parent_organization_id === senderId 
          };
        }
        return { canTransfer: false, reason: 'Organization can only transfer to Admins and Generals in their organization' };
        
      case UserTier.admin:
        // Can transfer to General in same Organization only
        if (receiver.tier === UserTier.general) {
          const [senderOrg, receiverOrg] = await Promise.all([
            prisma.$queryRaw`SELECT parent_organization_id FROM users WHERE id = ${senderId}` as unknown as any[],
            prisma.$queryRaw`SELECT parent_organization_id FROM users WHERE id = ${receiverId}` as unknown as any[]
          ]);
          
          return { 
            canTransfer: senderOrg[0]?.parent_organization_id === receiverOrg[0]?.parent_organization_id 
          };
        }
        return { canTransfer: false, reason: 'Admin can only transfer to General users in the same organization' };
        
      case UserTier.general:
        return { canTransfer: false, reason: 'General users cannot transfer' };
        
      default:
        return { canTransfer: false, reason: 'Invalid user tier' };
    }
  } catch (error) {
    console.error('Error in canTransfer:', error);
    return { canTransfer: false, reason: 'Internal error' };
  }
}

/**
 * Transfer points to another user
 */
export async function transferPoints(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { receiverId, amount, description } = req.body;

    // Validate input
    if (!receiverId || !amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        message: 'Receiver ID and positive amount are required' 
      });
    }

    // Check transfer limits
    const maxTransferAmount = parseInt(process.env.MAX_TRANSFER_AMOUNT || '1000000');
    if (amount > maxTransferAmount) {
      return res.status(400).json({ 
        error: 'Amount exceeds limit', 
        message: `Maximum transfer amount is ${maxTransferAmount}` 
      });
    }

    // Check if sender can transfer to receiver
    const transferCheck = await canTransfer(req.user.id, receiverId);
    if (!transferCheck.canTransfer) {
      return res.status(403).json({ 
        error: 'Transfer not allowed', 
        reason: transferCheck.reason 
      });
    }

    // Use database transaction for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Get sender's current balance and lock the row
      const senderResult = await tx.$queryRaw`
        SELECT points FROM users WHERE id = ${req.user!.id} FOR UPDATE
      ` as any[];

      const sender = senderResult[0];
      if (!sender || sender.points < amount) {
        throw new Error('Insufficient balance');
      }

      // Get receiver's current balance and lock the row
      const receiverResult = await tx.$queryRaw`
        SELECT points FROM users WHERE id = ${receiverId} FOR UPDATE
      ` as any[];

      const receiver = receiverResult[0];
      if (!receiver) {
        throw new Error('Receiver not found');
      }

      // Update balances
      await tx.$executeRaw`
        UPDATE users SET points = points - ${amount} WHERE id = ${req.user!.id}
      `;

      await tx.$executeRaw`
        UPDATE users SET points = points + ${amount} WHERE id = ${receiverId}
      `;

      // Create transfer record
      const transferResult = await tx.$queryRaw`
        INSERT INTO transfers (sender_id, receiver_id, type, currency, amount, description, status)
        VALUES (${req.user!.id}, ${receiverId}, 'manual', 'points', ${amount}, ${description || null}, 'completed')
        RETURNING *
      ` as any[];

      return transferResult[0];
    });

    res.status(201).json({
      success: true,
      transfer: result,
      message: 'Points transferred successfully'
    });

  } catch (error: any) {
    console.error('Transfer points error:', error);
    
    if (error.message === 'Insufficient balance') {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    if (error.message === 'Receiver not found') {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Transfer credits to another user
 */
export async function transferCredits(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { receiverId, amount, description } = req.body;

    // Validate input
    if (!receiverId || !amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        message: 'Receiver ID and positive amount are required' 
      });
    }

    // Check transfer limits
    const maxTransferAmount = parseInt(process.env.MAX_TRANSFER_AMOUNT || '1000000');
    if (amount > maxTransferAmount) {
      return res.status(400).json({ 
        error: 'Amount exceeds limit', 
        message: `Maximum transfer amount is ${maxTransferAmount}` 
      });
    }

    // Check if sender can transfer to receiver
    const transferCheck = await canTransfer(req.user.id, receiverId);
    if (!transferCheck.canTransfer) {
      return res.status(403).json({ 
        error: 'Transfer not allowed', 
        reason: transferCheck.reason 
      });
    }

    // Use database transaction for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Get sender's current balance and lock the row
      const senderResult = await tx.$queryRaw`
        SELECT credits FROM users WHERE id = ${req.user!.id} FOR UPDATE
      ` as any[];

      const sender = senderResult[0];
      if (!sender || sender.credits < amount) {
        throw new Error('Insufficient balance');
      }

      // Get receiver's current balance and lock the row
      const receiverResult = await tx.$queryRaw`
        SELECT credits FROM users WHERE id = ${receiverId} FOR UPDATE
      ` as any[];

      const receiver = receiverResult[0];
      if (!receiver) {
        throw new Error('Receiver not found');
      }

      // Update balances
      await tx.$executeRaw`
        UPDATE users SET credits = credits - ${amount} WHERE id = ${req.user!.id}
      `;

      await tx.$executeRaw`
        UPDATE users SET credits = credits + ${amount} WHERE id = ${receiverId}
      `;

      // Create transfer record
      const transferResult = await tx.$queryRaw`
        INSERT INTO transfers (sender_id, receiver_id, type, currency, amount, description, status)
        VALUES (${req.user!.id}, ${receiverId}, 'manual', 'credits', ${amount}, ${description || null}, 'completed')
        RETURNING *
      ` as any[];

      return transferResult[0];
    });

    res.status(201).json({
      success: true,
      transfer: result,
      message: 'Credits transferred successfully'
    });

  } catch (error: any) {
    console.error('Transfer credits error:', error);
    
    if (error.message === 'Insufficient balance') {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    if (error.message === 'Receiver not found') {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get transfer history for the current user
 */
export async function getTransferHistory(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { limit = 50, offset = 0, type, currency } = req.query;

    // Build where clause
    let whereClause = 'WHERE (sender_id = $1 OR receiver_id = $1)';
    const params: any[] = [req.user.id];
    let paramIndex = 2;

    if (type) {
      whereClause += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (currency) {
      whereClause += ` AND currency = $${paramIndex}`;
      params.push(currency);
      paramIndex++;
    }

    const query = `
      SELECT * FROM transfers 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*) as total FROM transfers ${whereClause}
    `;

    params.push(parseInt(limit as string), parseInt(offset as string));

    const [transfers, countResult] = await Promise.all([
      prisma.$queryRawUnsafe(query, ...params) as unknown as any[],
      prisma.$queryRawUnsafe(countQuery, ...params.slice(0, -2)) as unknown as any[]
    ]);

    res.json({
      transfers,
      total: parseInt(countResult[0]?.total || '0'),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

  } catch (error) {
    console.error('Get transfer history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Check if transfer is allowed between users (validation endpoint)
 */
export async function validateTransfer(req: HierarchyRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { receiverId } = req.query;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    const transferCheck = await canTransfer(req.user.id, receiverId as string);

    res.json({
      canTransfer: transferCheck.canTransfer,
      reason: transferCheck.reason
    });

  } catch (error) {
    console.error('Validate transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default {
  transferPoints,
  transferCredits,
  getTransferHistory,
  validateTransfer
};