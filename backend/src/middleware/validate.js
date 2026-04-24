import { body, query, param, validationResult } from 'express-validator';

// Generic validation error handler
export function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
}

// Common validation chains
export const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID'),
  handleValidation,
];

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('sort').optional().trim(),
  query('order').optional().isIn(['asc', 'desc']),
  handleValidation,
];

export const validateDataSource = [
  body('name').trim().notEmpty().isLength({ max: 255 }),
  body('type').trim().notEmpty().isLength({ max: 50 }),
  body('connection_string').optional().trim(),
  body('description').optional().trim(),
  handleValidation,
];

export const validateDashboard = [
  body('name').trim().notEmpty().isLength({ max: 255 }),
  body('description').optional().trim(),
  body('is_public').optional().isBoolean(),
  handleValidation,
];

export const validateReport = [
  body('name').trim().notEmpty().isLength({ max: 255 }),
  body('type').trim().notEmpty().isLength({ max: 50 }),
  body('query').optional().trim(),
  body('description').optional().trim(),
  body('schedule').optional().trim(),
  handleValidation,
];

export const validateAlert = [
  body('name').trim().notEmpty().isLength({ max: 255 }),
  body('condition').trim().notEmpty(),
  body('threshold').isNumeric(),
  body('frequency').optional().trim(),
  handleValidation,
];

export const validateJob = [
  body('job_type').trim().notEmpty().isLength({ max: 100 }),
  body('job_name').trim().notEmpty().isLength({ max: 255 }),
  body('cron_expression').optional().trim(),
  handleValidation,
];

export const validateIntegration = [
  body('service_name').trim().notEmpty().isLength({ max: 100 }),
  body('service_type').trim().notEmpty().isLength({ max: 50 }),
  body('sync_frequency').optional().trim(),
  handleValidation,
];

// RBAC middleware
export function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role || 'viewer';
      if (!roles.includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions', required: roles, current: userRole });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}
