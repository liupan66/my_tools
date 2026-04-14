const Storage = require('../utils/storage');
const config = require('../config');
const logger = require('../utils/logger');

const userStorage = new Storage(config.data.usersPath);

class UserController {
  static getAllUsers(req, res) {
    try {
      const users = userStorage.read();
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        password: user.password,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt
      }));

      res.json({
        success: true,
        data: sanitizedUsers
      });
    } catch (error) {
      logger.error('Get all users error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users'
      });
    }
  }

  static getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = userStorage.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          password: user.password,
          role: user.role,
          permissions: user.permissions,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      logger.error('Get user error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user'
      });
    }
  }

  static async createUser(req, res) {
    try {
      const { username, password, role, permissions } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      const existingUsers = userStorage.read();
      const existingUser = existingUsers.find(u => u.username === username);

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }

      const newUser = userStorage.create({
        username,
        password: password,
        role: role || config.roles.user,
        permissions: permissions || [config.permissions.read]
      });

      logger.info('User created', { adminId: req.user.id, newUserId: newUser.id });

      res.json({
        success: true,
        message: 'User created successfully',
        data: {
          id: newUser.id,
          username: newUser.username,
          password: newUser.password,
          role: newUser.role,
          permissions: newUser.permissions,
          createdAt: newUser.createdAt
        }
      });
    } catch (error) {
      logger.error('Create user error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { role, permissions, password } = req.body;

      const updates = {};

      if (role !== undefined) updates.role = role;
      if (permissions !== undefined) updates.permissions = permissions;
      if (password) {
        updates.password = password;
      }

      const updatedUser = userStorage.update(id, updates);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      logger.info('User updated', { adminId: req.user.id, userId: id });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          password: updatedUser.password,
          role: updatedUser.role,
          permissions: updatedUser.permissions
        }
      });
    } catch (error) {
      logger.error('Update user error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  }

  static deleteUser(req, res) {
    try {
      const { id } = req.params;

      if (id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const success = userStorage.delete(id);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      logger.info('User deleted', { adminId: req.user.id, deletedUserId: id });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Delete user error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }
}

module.exports = UserController;
