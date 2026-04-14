const express = require('express');
const ProjectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/auth');
const { checkRole, checkPermission } = require('../middleware/permission');
const config = require('../config');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.get('/gantt-data', 
  // authMiddleware, 
  // checkPermission(config.permissions.read),
  ProjectController.getGanttData
);

router.post('/gantt-data', 
  // authMiddleware, 
  // checkPermission(config.permissions.write),
  ProjectController.saveGanttData
);

router.get('/projects', 
  authMiddleware, 
  checkPermission(config.permissions.read),
  ProjectController.getAllProjects
);

router.post('/projects', 
  authMiddleware, 
  checkPermission(config.permissions.write),
  ProjectController.createProject
);

router.put('/projects/:oldName', 
  authMiddleware, 
  checkPermission(config.permissions.write),
  ProjectController.updateProject
);

router.delete('/projects/:name', 
  authMiddleware, 
  checkPermission(config.permissions.delete),
  ProjectController.deleteProject
);

module.exports = router;
