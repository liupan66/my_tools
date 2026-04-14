const Storage = require('../utils/storage');
const JWTUtil = require('../utils/jwt');
const config = require('../config');
const logger = require('../utils/logger');

const userStorage = new Storage(config.data.usersPath);

class AuthController {
  static async register(req, res) {
    try {
      const { username, password, email } = req.body;

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

      const isFirstUser = existingUsers.length === 0;
      const newUser = userStorage.create({
        username,
        password: password,
        email: email || '',
        role: isFirstUser ? config.roles.admin : config.roles.user,
        permissions: isFirstUser 
          ? [config.permissions.read, config.permissions.write, config.permissions.delete, config.permissions.admin]
          : [config.permissions.read]
      });

      const token = JWTUtil.generateToken({
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        permissions: newUser.permissions
      });

      logger.info('User registered successfully', { userId: newUser.id, username });

      res.json({
        success: true,
        message: 'Registration successful',
        data: {
          token,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            permissions: newUser.permissions
          }
        }
      });
    } catch (error) {
      logger.error('Registration error', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }

  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      const users = userStorage.read();
      const user = users.find(u => u.username === username);

      if (!user) {
        logger.warn('Login failed: User not found', { username });
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const isPasswordValid = password === user.password;

      if (!isPasswordValid) {
        logger.warn('Login failed: Invalid password', { username });
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = JWTUtil.generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      });

      logger.info('User logged in successfully', { userId: user.id, username });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: user.permissions
          }
        }
      });
    } catch (error) {
      logger.error('Login error', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }

  static getProfile(req, res) {
    try {
      const users = userStorage.read();
      const user = users.find(u => u.id === req.user.id);

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
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      logger.error('Get profile error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  }
}

module.exports = AuthController;
