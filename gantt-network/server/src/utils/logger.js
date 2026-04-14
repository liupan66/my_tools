const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

class Logger {
  constructor() {
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    this.currentLevel = process.env.LOG_LEVEL || 'info';
  }

  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.currentLevel];
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    return JSON.stringify(logEntry);
  }

  writeLog(level, message, data = null) {
    if (!this.shouldLog(level)) return;

    const logMessage = this.formatMessage(level, message, data);
    
    console.log(logMessage);

    const today = new Date().toISOString().slice(0, 10);
    const logFile = path.join(logDir, `${today}.log`);
    
    try {
      fs.appendFileSync(logFile, logMessage + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  error(message, data) {
    this.writeLog('error', message, data);
  }

  warn(message, data) {
    this.writeLog('warn', message, data);
  }

  info(message, data) {
    this.writeLog('info', message, data);
  }

  debug(message, data) {
    this.writeLog('debug', message, data);
  }
}

module.exports = new Logger();
