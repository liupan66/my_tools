const config = require('../config');
const logger = require('../utils/logger');

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        logger.warn('Permission denied', {
          userId: req.user.id,
          requiredRoles: allowedRoles,
          userRole
        });
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      logger.info('Permission granted', {
        userId: req.user.id,
        role: userRole,
        action: req.path
      });
      next();
    } catch (error) {
      logger.error('Permission check error', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check error'
      });
    }
  };
};

const checkPermission = (...permissions) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userPermissions = req.user.permissions || [];

      const hasPermission = permissions.some(perm => userPermissions.includes(perm));

      if (!hasPermission && req.user.role !== config.roles.admin) {
        logger.warn('Permission denied', {
          userId: req.user.id,
          requiredPermissions: permissions,
          userPermissions
        });
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
      }

      logger.info('Permission granted', {
        userId: req.user.id,
        permissions: permissions,
        action: req.path
      });
      next();
    } catch (error) {
      logger.error('Permission check error', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check error'
      });
    }
  };
};

module.exports = {
  checkRole,
  checkPermission
};
