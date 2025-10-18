import { Request, Response } from 'express';
import { creditReservationService } from '../services/credit-reservation.service';
import { createValidationError, createInternalServerError } from '@smart-ai-hub/shared';

/**
 * Reserve credits for a user
 */
export const reserveCredits = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const { amount, sessionId } = req.body;

    // Validate input
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw createValidationError('Amount must be a positive number');
    }

    const result = await creditReservationService.reserveCredits(userId, amount, sessionId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error reserving credits:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to reserve credits',
    });
  }
};

/**
 * Charge credits from a reservation
 */
export const chargeCredits = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const { reservationId, actualAmount, usageLogId } = req.body;

    // Validate input
    if (!reservationId || typeof reservationId !== 'string') {
      throw createValidationError('Reservation ID is required');
    }
    if (!actualAmount || typeof actualAmount !== 'number' || actualAmount <= 0) {
      throw createValidationError('Actual amount must be a positive number');
    }
    if (!usageLogId || typeof usageLogId !== 'string') {
      throw createValidationError('Usage log ID is required');
    }

    const result = await creditReservationService.chargeCredits(
      userId,
      reservationId,
      actualAmount,
      usageLogId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error charging credits:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to charge credits',
    });
  }
};

/**
 * Refund credits from a reservation
 */
export const refundCredits = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const { reservationId, reason } = req.body;

    // Validate input
    if (!reservationId || typeof reservationId !== 'string') {
      throw createValidationError('Reservation ID is required');
    }
    if (!reason || typeof reason !== 'string') {
      throw createValidationError('Refund reason is required');
    }

    const result = await creditReservationService.refundCredits(userId, reservationId, reason);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error refunding credits:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to refund credits',
    });
  }
};

/**
 * Get user's current balance
 */
export const getBalance = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;

    const balance = await creditReservationService.getUserBalance(userId);

    res.json({
      success: true,
      data: { balance },
    });
  } catch (error: any) {
    console.error('Error getting balance:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get balance',
    });
  }
};

/**
 * Get user's available balance (excluding active reservations)
 */
export const getAvailableBalance = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;

    const balance = await creditReservationService.getAvailableBalance(userId);

    res.json({
      success: true,
      data: { balance },
    });
  } catch (error: any) {
    console.error('Error getting available balance:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get available balance',
    });
  }
};

/**
 * Get user's active reservations
 */
export const getActiveReservations = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;

    const reservations = await creditReservationService.getActiveReservations(userId);

    res.json({
      success: true,
      data: { reservations },
    });
  } catch (error: any) {
    console.error('Error getting active reservations:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to get active reservations',
    });
  }
};

/**
 * Clean up expired reservations (admin only)
 */
export const cleanupExpiredReservations = async (req: Request, res: Response) => {
  try {
    const cleanedCount = await creditReservationService.cleanupExpiredReservations();

    res.json({
      success: true,
      data: { cleanedCount },
    });
  } catch (error: any) {
    console.error('Error cleaning up expired reservations:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to cleanup expired reservations',
    });
  }
};
