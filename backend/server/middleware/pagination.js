// Pagination middleware for MongoDB queries
// Improves performance by limiting data returned

/**
 * Add pagination to MongoDB query
 * @param {Object} req - Express request
 * @param {Object} res - Express response  
 * @param {Function} next - Next middleware
 */
const paginate = (req, res, next) => {
  // Get page and limit from query params (with defaults)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  // Validate values
  if (page < 1) {
    return res.status(400).json({ message: 'Page number must be greater than 0' });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({ message: 'Limit must be between 1 and 100' });
  }
  
  // Calculate skip value
  const skip = (page - 1) * limit;
  
  // Attach pagination info to request
  req.pagination = {
    page,
    limit,
    skip
  };
  
  next();
};

/**
 * Build pagination response
 * @param {Array} data - Query results
 * @param {number} total - Total count
 * @param {Object} pagination - Pagination params
 * @returns {Object} Paginated response
 */
const buildPaginatedResponse = (data, total, pagination) => {
  const { page, limit } = pagination;
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      pageSize: limit,
      totalItems: total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

/**
 * Optimize MongoDB query with pagination and lean
 * @param {Object} query - Mongoose query
 * @param {Object} pagination - Pagination params
 * @returns {Object} Optimized query
 */
const optimizeQuery = (query, pagination) => {
  return query
    .skip(pagination.skip)
    .limit(pagination.limit)
    .lean() // Return plain JavaScript objects (faster)
    .select('-__v'); // Exclude version key
};

module.exports = {
  paginate,
  buildPaginatedResponse,
  optimizeQuery
};

