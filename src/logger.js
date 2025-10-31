class Logger {
  constructor(service = "App") {
    this.service = service;
    this.colors = {
      reset: "\x1b[0m",
      bright: "\x1b[1m",
      dim: "\x1b[2m",
      red: "\x1b[31m",
      green: "\x1b[32m",
      yellow: "\x1b[33m",
      blue: "\x1b[34m",
      magenta: "\x1b[35m",
      cyan: "\x1b[36m",
      white: "\x1b[37m"
    };
  }
  getTimestamp() {
    return new Date().toLocaleString("en-EN", {
      timeZone: "Africa/Accra",
      hour12: false
    });
  }

  formatMessage(level, message, color) {
    const timestamp = this.getTimestamp();
    const serviceTag = `[${this.service}]`;
    
    return `${this.colors.dim}${timestamp}${this.colors.reset} ${color}${level}${this.colors.reset} ${this.colors.cyan}${serviceTag}${this.colors.reset} ${message}`;
  }

  info(message) {
    console.log(this.formatMessage("INFO", message, this.colors.blue));
  }

  success(message) {
    console.log(this.formatMessage("SUCCESS", message, this.colors.green));
  }

  warn(message) {
    console.log(this.formatMessage("WARN", message, this.colors.yellow));
  }

  error(message, error = null) {
    console.error(this.formatMessage("ERROR", message, this.colors.red));
    if (error) {
      console.error(this.colors.red, "Error Details:", error, this.colors.reset);
    }
  }

  debug(message) {
    if (process.env.DEBUG === "true") {
      console.log(this.formatMessage("DEBUG", message, this.colors.magenta));
    }
  }

  // For HTTP request logging
  request(method, url, statusCode = null, responseTime = null) {
    let color = this.colors.blue;
    if (statusCode >= 400) color = this.colors.yellow;
    if (statusCode >= 500) color = this.colors.red;

    let message = `${method} ${url}`;
    if (statusCode) message += ` â†’ ${statusCode}`;
    if (responseTime) message += ` (${responseTime}ms)`;

    console.log(this.formatMessage("REQUEST", message, color));
  }
}


module.exports = { Logger };

