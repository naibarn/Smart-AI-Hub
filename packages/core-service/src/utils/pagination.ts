/**
 * Pagination utility functions for standardized API responses
 * Follows FR-6 API Standards specification
 */

export interface PaginationOptions {
  page?: number;
  per_page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationResult;
}

/**
 * Parse and validate pagination parameters from query
 * @param query - Request query object
 * @returns Validated pagination options
 */
export const parsePaginationParams = (query: any): PaginationOptions => {
  // Default values
  const options: PaginationOptions = {
    page: 1,
    per_page: 20,
  };

  // Parse page parameter
  if (query.page !== undefined) {
    const page = parseInt(query.page, 10);
    if (!isNaN(page) && page > 0) {
      options.page = page;
    }
  }

  // Parse per_page/limit parameter
  const perPageParam = query.per_page || query.limit;
  if (perPageParam !== undefined) {
    const perPage = parseInt(perPageParam, 10);
    if (!isNaN(perPage) && perPage > 0 && perPage <= 100) {
      options.per_page = perPage;
    }
  }

  return options;
};

/**
 * Calculate pagination metadata
 * @param page - Current page number
 * @param perPage - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata
 */
export const calculatePagination = (
  page: number,
  perPage: number,
  total: number
): PaginationResult => {
  return {
    page,
    per_page: perPage,
    total,
    total_pages: Math.ceil(total / perPage) || 0,
  };
};

/**
 * Create paginated response data
 * @param items - All items array
 * @param options - Pagination options
 * @returns Paginated data with metadata
 */
export const createPaginatedResponse = <T>(
  items: T[],
  options: PaginationOptions
): PaginatedData<T> => {
  const page = options.page || 1;
  const perPage = options.per_page || 20;
  const total = items.length;
  const totalPages = Math.ceil(total / perPage);

  // Calculate start and end indices
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;

  // Get items for current page
  const data = items.slice(startIndex, endIndex);

  return {
    data,
    pagination: calculatePagination(page, perPage, total),
  };
};

/**
 * Apply pagination to a database query (for Prisma)
 * @param options - Pagination options
 * @returns Prisma query parameters
 */
export const getPrismaPaginationParams = (options: PaginationOptions) => {
  const page = options.page || 1;
  const perPage = options.per_page || 20;

  return {
    skip: (page - 1) * perPage,
    take: perPage,
  };
};

/**
 * Validate pagination parameters
 * @param options - Pagination options
 * @returns Error message if invalid, null if valid
 */
export const validatePaginationParams = (options: PaginationOptions): string | null => {
  if (options.page !== undefined && (options.page < 1 || !Number.isInteger(options.page))) {
    return 'Page must be a positive integer';
  }

  if (options.per_page !== undefined) {
    if (options.per_page < 1 || !Number.isInteger(options.per_page)) {
      return 'Per page must be a positive integer';
    }
    if (options.per_page > 100) {
      return 'Per page cannot exceed 100 items';
    }
  }

  if (options.limit !== undefined) {
    if (options.limit < 1 || !Number.isInteger(options.limit)) {
      return 'Limit must be a positive integer';
    }
    if (options.limit > 100) {
      return 'Limit cannot exceed 100 items';
    }
  }

  return null;
};

/**
 * Get pagination links for API responses (HATEOAS)
 * @param baseUrl - Base URL for the endpoint
 * @param options - Current pagination options
 * @param total - Total number of items
 * @returns Pagination links object
 */
export const getPaginationLinks = (
  baseUrl: string,
  options: PaginationOptions,
  total: number
): {
  first: string;
  prev: string | null;
  next: string | null;
  last: string;
} => {
  const page = options.page || 1;
  const perPage = options.per_page || 20;
  const totalPages = Math.ceil(total / perPage);

  const buildUrl = (p: number): string => {
    const url = new URL(baseUrl);
    url.searchParams.set('page', p.toString());
    url.searchParams.set('per_page', perPage.toString());
    return url.toString();
  };

  return {
    first: buildUrl(1),
    prev: page > 1 ? buildUrl(page - 1) : null,
    next: page < totalPages ? buildUrl(page + 1) : null,
    last: buildUrl(totalPages),
  };
};
