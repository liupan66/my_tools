const logger = require('./logger');

class Metrics {
  constructor() {
    this.requests = {
      total: 0,
      success: 0,
      error: 0,
      byMethod: {},
      byPath: {}
    };
    this.responseTimes = [];
    this.activeConnections = 0;
    this.startTime = Date.now();
  }

  recordRequest(method, path) {
    this.requests.total++;
    this.requests.byMethod[method] = (this.requests.byMethod[method] || 0) + 1;
    this.requests.byPath[path] = (this.requests.byPath[path] || 0) + 1;
  }

  recordSuccess(method, path) {
    this.requests.success++;
  }

  recordError(method, path) {
    this.requests.error++;
  }

  recordResponseTime(duration) {
    this.responseTimes.push(duration);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  incrementConnections() {
    this.activeConnections++;
  }

  decrementConnections() {
    this.activeConnections--;
  }

  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.responseTimes.length > 0
      ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
      : 0;

    return {
      uptime,
      uptimeFormatted: this.formatUptime(uptime),
      requests: {
        ...this.requests,
        successRate: this.requests.total > 0 
          ? ((this.requests.success / this.requests.total) * 100).toFixed(2) + '%'
          : '0%'
      },
      responseTime: {
        average: avgResponseTime.toFixed(2) + 'ms',
        min: this.responseTimes.length > 0 ? Math.min(...this.responseTimes).toFixed(2) + 'ms' : '0ms',
        max: this.responseTimes.length > 0 ? Math.max(...this.responseTimes).toFixed(2) + 'ms' : '0ms'
      },
      activeConnections: this.activeConnections
    };
  }

  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  }

  reset() {
    this.requests = {
      total: 0,
      success: 0,
      error: 0,
      byMethod: {},
      byPath: {}
    };
    this.responseTimes = [];
  }
}

module.exports = new Metrics();
