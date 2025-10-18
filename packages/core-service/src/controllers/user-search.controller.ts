import { Request, Response } from 'express';
import {
  searchUsersAdvanced,
  getUserSearchSuggestions,
  getPopularSearchFilters,
  clearSearchCache,
} from '../services/user-search.service';
import { UserSearchOptions } from '@smart-ai-hub/shared';

/**
 * Search users with advanced filters
 */
export const searchUsersController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract search options from query parameters
    const {
      query,
      tier,
      isBlocked,
      isVerified,
      roleId,
      parentAgencyId,
      parentOrganizationId,
      page,
      limit,
      sortBy,
      sortOrder,
      createdAfter,
      createdBefore,
      lastActiveAfter,
      minCredits,
      maxCredits,
      minPoints,
      maxPoints,
    } = req.query;

    // Parse and validate query parameters
    const searchOptions: UserSearchOptions = {
      query: query as string,
      tier: tier as any,
      isBlocked: isBlocked === 'true' ? true : isBlocked === 'false' ? false : undefined,
      isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
      roleId: roleId as string,
      parentAgencyId: parentAgencyId as string,
      parentOrganizationId: parentOrganizationId as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      createdAfter: createdAfter ? new Date(createdAfter as string) : undefined,
      createdBefore: createdBefore ? new Date(createdBefore as string) : undefined,
      lastActiveAfter: lastActiveAfter ? new Date(lastActiveAfter as string) : undefined,
      minCredits: minCredits ? parseInt(minCredits as string, 10) : undefined,
      maxCredits: maxCredits ? parseInt(maxCredits as string, 10) : undefined,
      minPoints: minPoints ? parseInt(minPoints as string, 10) : undefined,
      maxPoints: maxPoints ? parseInt(maxPoints as string, 10) : undefined,
    };

    const result = await searchUsersAdvanced(searchOptions);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        validationErrors: result.validationErrors,
      });
    }
  } catch (error) {
    console.error('Error in searchUsersController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get user search suggestions
 */
export const getUserSearchSuggestionsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { query } = req.query;
    const { limit } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Query parameter is required',
      });
      return;
    }

    const result = await getUserSearchSuggestions(
      query,
      limit ? parseInt(limit as string, 10) : undefined
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error in getUserSearchSuggestionsController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get popular search filters
 */
export const getPopularSearchFiltersController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await getPopularSearchFilters();

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error in getPopularSearchFiltersController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Clear search cache (admin only)
 */
export const clearSearchCacheController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pattern } = req.query;

    const result = await clearSearchCache(pattern as string);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Search cache cleared successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error in clearSearchCacheController:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
