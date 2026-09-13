// Centralized error handling and diagnostic logging.
class ErrorHandler {
  static init() {
    this.setupGlobalErrorHandler();
    this.setupConsoleOverride();
    this.logInitialization();
  }

  static setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      this.logError('Window Error', event.error || event.message);
      return true;
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', event.reason);
    });
  }

  static setupConsoleOverride() {
    const originalError = console.error;
    console.error = (...args) => {
      this.logError('Console Error', args[0]);
      originalError.apply(console, args);
    };
  }

  static logError(type, error) {
    try {
      const timestamp = new Date().toISOString();
      const log = {
        type,
        message: error?.message || String(error),
        timestamp,
        userAgent: navigator.userAgent
      };

      const logs = JSON.parse(localStorage.getItem('app_errors') || '[]');
      logs.push(log);
      if (logs.length > 50) logs.shift();
      localStorage.setItem('app_errors', JSON.stringify(logs));
    } catch (storageError) {
      console.warn('Unable to persist application error logs:', storageError);
    }
  }

  static logInitialization() {
    console.info('✅ App initialized', {
      event: 'App Initialized',
      timestamp: new Date().toISOString(),
      appVersion: '2.1.0',
      environment: 'production'
    });
  }

  static getErrorLogs() {
    try {
      return JSON.parse(localStorage.getItem('app_errors') || '[]');
    } catch {
      return [];
    }
  }

  static clearLogs() {
    localStorage.removeItem('app_errors');
  }
}

ErrorHandler.init();

window.DEBUG = {
  errors: () => ErrorHandler.getErrorLogs(),
  clearLogs: () => ErrorHandler.clearLogs(),
  appState: () => window.appState || 'Not initialized',
  router: () => window.router || 'Not initialized'
};
