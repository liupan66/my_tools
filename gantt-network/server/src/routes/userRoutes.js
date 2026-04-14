const express = require('express');
const UserController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { checkRole, checkPermission } = require('../middleware/permission');
const config = require('../config');

const router = express.Router();

router.use(authMiddleware);

router.get('/', 
  checkRole(config.roles.admin),
  UserController.getAllUsers
);

router.get('/:id', 
  checkRole(config.roles.admin),
  UserController.getUserById
);

router.post('/', 
  checkRole(config.roles.admin),
  UserController.createUser
);

router.put('/:id', 
  checkRole(config.roles.admin),
  UserController.updateUser
);

router.delete('/:id', 
  checkRole(config.roles.admin),
  UserController.deleteUser
);

module.exports = router;
