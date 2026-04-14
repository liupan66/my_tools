const express = require('express');
const HealthController = require('../controllers/healthController');
const authMiddleware = require('../middleware/auth');
const { checkRole } = require('../middleware/permission');
const config = require('../config');

const router = express.Router();

router.get('/health', HealthController.healthCheck);

router.get('/metrics', 
  authMiddleware, 
  checkRole(config.roles.admin, config.roles.manager),
  HealthController.getMetrics
);

router.post('/metrics/reset', 
  authMiddleware, 
  checkRole(config.roles.admin),
  HealthController.resetMetrics
);

module.exports = router;
