const JWTUtil = require('../utils/jwt');
const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authentication failed: No token provided');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = JWTUtil.verifyToken(token);

    if (!decoded) {
      logger.warn('Authentication failed: Invalid token');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    req.user = decoded;
    logger.info('Authentication successful', { userId: decoded.id, username: decoded.username });
    next();
  } catch (error) {
    logger.error('Authentication error', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

module.exports = authMiddleware;
