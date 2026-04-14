const metrics = require('../utils/metrics');
const os = require('os');
const logger = require('../utils/logger');

class HealthController {
  static healthCheck(req, res) {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'gantt-server'
    };

    res.json({
      success: true,
      data: health
    });
  }

  static getMetrics(req, res) {
    try {
      const metricsData = metrics.getMetrics();
      
      const systemInfo = {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        memory: {
          total: (os.totalmem() / 1024 / 1024).toFixed(2) + ' MB',
          free: (os.freemem() / 1024 / 1024).toFixed(2) + ' MB',
          usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%'
        },
        cpu: {
          cores: os.cpus().length,
          loadAverage: os.loadavg().map(avg => avg.toFixed(2))
        }
      };

      res.json({
        success: true,
        data: {
          ...metricsData,
          system: systemInfo
        }
      });
    } catch (error) {
      logger.error('Get metrics error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get metrics'
      });
    }
  }

  static resetMetrics(req, res) {
    try {
      metrics.reset();
      logger.info('Metrics reset', { userId: req.user?.id });

      res.json({
        success: true,
        message: 'Metrics reset successfully'
      });
    } catch (error) {
      logger.error('Reset metrics error', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset metrics'
      });
    }
  }
}

module.exports = HealthController;
