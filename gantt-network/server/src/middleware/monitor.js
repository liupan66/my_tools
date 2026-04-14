const metrics = require('../utils/metrics');
const logger = require('../utils/logger');

const monitorMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, path } = req;

  metrics.recordRequest(method, path);
  metrics.incrementConnections();

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.recordResponseTime(duration);
    metrics.decrementConnections();

    if (res.statusCode >= 200 && res.statusCode < 400) {
      metrics.recordSuccess(method, path);
    } else {
      metrics.recordError(method, path);
    }

    logger.info('Request completed', {
      method,
      path,
      statusCode: res.statusCode,
      duration: duration + 'ms'
    });
  });

  next();
};

module.exports = monitorMiddleware;
