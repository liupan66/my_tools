const bcrypt = require('bcryptjs');
const Storage = require('./utils/storage');
const config = require('./config');
const logger = require('./utils/logger');

const userStorage = new Storage(config.data.usersPath);

async function init() {
  try {
    const users = userStorage.read();

    if (users.length > 0) {
      logger.info('用户数据已存在，跳过初始化');
      return;
    }

    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const adminUser = userStorage.create({
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      role: config.roles.admin,
      permissions: [
        config.permissions.read,
        config.permissions.write,
        config.permissions.delete,
        config.permissions.admin
      ]
    });

    logger.info('默认管理员用户创建成功', {
      username: 'admin',
      password: defaultPassword,
      userId: adminUser.id
    });

    console.log('\n========================================');
    console.log('初始化完成！');
    console.log('默认管理员账号：');
    console.log('  用户名: admin');
    console.log('  密码: admin123');
    console.log('========================================\n');

  } catch (error) {
    logger.error('初始化失败', error);
    console.error('初始化失败:', error);
  }
}

init();
