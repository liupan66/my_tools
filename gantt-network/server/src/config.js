module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '24h'
  },
  server: {
    port: process.env.PORT || 8000,
    corsOrigin: process.env.CORS_ORIGIN || '*'
  },
  data: {
    ganttDataPath: 'data/gantt-data.json',
    usersPath: 'data/users.json',
    backupDir: 'data/backups'
  },
  roles: {
    admin: 'admin',
    user: 'user'
  },
  permissions: {
    read: 'read',
    write: 'write',
    delete: 'delete',
    admin: 'admin',
    settings: 'settings'
  }
};
