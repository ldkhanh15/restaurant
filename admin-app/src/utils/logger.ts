/**
 * Logger utility for production-safe logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMessage {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = __DEV__;

  private formatMessage(level: LogLevel, message: string, data?: any): LogMessage {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.isDevelopment && level === 'debug') {
      return false;
    }
    return true;
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logMessage = this.formatMessage(level, message, data);
    
    switch (level) {
      case 'error':
        console.error(`🔴 [${logMessage.timestamp}] ${message}`, data);
        break;
      case 'warn':
        console.warn(`🟡 [${logMessage.timestamp}] ${message}`, data);
        break;
      case 'info':
        console.info(`🔵 [${logMessage.timestamp}] ${message}`, data);
        break;
      case 'debug':
        console.log(`🔍 [${logMessage.timestamp}] ${message}`, data);
        break;
      default:
        console.log(`[${logMessage.timestamp}] ${message}`, data);
    }
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  // Auth specific logging
  auth = {
    login: (message: string, data?: any) => this.info(`[AUTH] Login: ${message}`, data),
    logout: (message: string, data?: any) => this.info(`[AUTH] Logout: ${message}`, data),
    error: (message: string, data?: any) => this.error(`[AUTH] Error: ${message}`, data),
  };

  // API specific logging
  api = {
    request: (message: string, data?: any) => this.debug(`[API] Request: ${message}`, data),
    response: (message: string, data?: any) => this.debug(`[API] Response: ${message}`, data),
    error: (message: string, data?: any) => this.error(`[API] Error: ${message}`, data),
  };

  // Navigation specific logging
  navigation = {
    navigate: (message: string, data?: any) => this.debug(`[NAV] Navigate: ${message}`, data),
    error: (message: string, data?: any) => this.error(`[NAV] Error: ${message}`, data),
  };
}

export const logger = new Logger();
export default logger;