import jwt from 'jsonwebtoken';
// 1. Keep your standard config import
import { JWT_SECRET } from '../config/app.config.js'; 
import { errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(errorResponse('Unauthorized: No token provided'));
    }

    const token = authHeader.substring(7);
    
    try {
      // 💡 DUAL-CHECK: Use your imported configuration secret, or fallback to your process environment text string
      const finalSecret = JWT_SECRET || process.env.JWT_SECRET || 'your_fallback_secret_string';
      
      const decoded = jwt.verify(token, finalSecret);
      req.user = decoded;
      next();
    } catch (err) {
      // Log the exact internal verification error so you can scan it in your terminal
      logger.warn('Token validation arithmetic failed', { reason: err.message });
      return res.status(401).json(errorResponse('Unauthorized: Invalid token'));
    }
  } catch (error) {
    logger.error('Auth middleware error', { message: error.message });
    return res.status(401).json(errorResponse('Unauthorized'));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('Unauthorized'));
    }

    // 💡 SYSTEM SYNC: Convert everything to uppercase to ensure 'ADMIN' matches perfectly with your MySQL data fields
    const userRole = req.user.role ? req.user.role.toUpperCase() : '';
    const allowedRoles = roles.map(role => role.toUpperCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json(errorResponse('Forbidden: Insufficient permissions'));
    }

    next();
  };
};
