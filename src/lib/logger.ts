/**
 * Logger utility for development and production
 * Rules for this file:
 * - Structured logging with consistent format
 * - Different log levels (debug, info, warn, error)
 * - Environment-aware logging (verbose in dev, minimal in prod)
 * - Safe serialization of objects and errors
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;

    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext =
        error instanceof Error
          ? { error: error.message, stack: error.stack, ...context }
          : { error: String(error), ...context };

      console.error(this.formatMessage('error', message, errorContext));
    }
  }

  // Specialized methods for common scenarios
  apiError(endpoint: string, error: unknown, context?: LogContext): void {
    this.error(`API Error: ${endpoint}`, error, { endpoint, ...context });
  }

  authError(message: string, error?: unknown, context?: LogContext): void {
    this.error(`Auth Error: ${message}`, error, { type: 'auth', ...context });
  }

  spotifyError(operation: string, error: unknown, context?: LogContext): void {
    this.error(`Spotify API Error: ${operation}`, error, {
      service: 'spotify',
      operation,
      ...context,
    });
  }

  playbackError(message: string, error?: unknown, context?: LogContext): void {
    this.error(`Playback Error: ${message}`, error, {
      type: 'playback',
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export specific loggers for convenience
export const apiLogger = {
  request: (method: string, url: string, context?: LogContext) =>
    logger.debug(`API Request: ${method} ${url}`, context),
  response: (
    method: string,
    url: string,
    status: number,
    context?: LogContext,
  ) => logger.debug(`API Response: ${method} ${url} ${status}`, context),
  error: (endpoint: string, error: unknown, context?: LogContext) =>
    logger.apiError(endpoint, error, context),
};

export const authLogger = {
  signIn: (provider: string, userId?: string) =>
    logger.info('User signed in', { provider, userId }),
  signOut: (userId?: string) => logger.info('User signed out', { userId }),
  tokenRefresh: (success: boolean, error?: unknown) =>
    logger.info('Token refresh', {
      success,
      error: error ? String(error) : undefined,
    }),
  error: (message: string, error?: unknown, context?: LogContext) =>
    logger.authError(message, error, context),
};

export const spotifyLogger = {
  apiCall: (endpoint: string, context?: LogContext) =>
    logger.debug(`Spotify API call: ${endpoint}`, context),
  error: (operation: string, error: unknown, context?: LogContext) =>
    logger.spotifyError(operation, error, context),
};

export const playbackLogger = {
  playerReady: (deviceId: string) =>
    logger.info('Spotify player ready', { deviceId }),
  playerError: (error: unknown) =>
    logger.playbackError('Player initialization failed', error),
  stateChange: (state: 'playing' | 'paused' | 'stopped', trackId?: string) =>
    logger.debug('Playback state change', { state, trackId }),
  error: (message: string, error?: unknown, context?: LogContext) =>
    logger.playbackError(message, error, context),
};
