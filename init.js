// Professional app initialization and startup flow.
class AppInit {
  static async initialize() {
    try {
      console.info('🚀 Starting app initialization...');

      if (typeof loadAppState === 'function') {
        loadAppState();
      }
      window.appState = window.appState || (typeof appState !== 'undefined' ? appState : {});

      if (typeof registerPageRoutes === 'function') {
        registerPageRoutes();
      } else {
        console.warn('registerPageRoutes is not defined yet. Page routes were not registered.');
      }

      this.setupDOM();
      this.setupRouter();
      this.setupEventListeners();

      if (typeof router !== 'undefined') {
        router.handleRoute();
      }

      if (typeof initializeAppUI === 'function') {
        initializeAppUI();
      }

      this.checkThemePreference();
      window.appState.initialized = true;
      window.appState.startedAt = new Date().toISOString();

      console.info('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ Initialization error:', error);
      this.handleInitError(error);
    }
  }

  static restoreSession() {
    if (typeof loadAppState === 'function') {
      loadAppState();
    }
  }

  static setupDOM() {
    const app = document.getElementById('app');
    if (!app) {
      throw new Error('App container #app not found');
    }
    app.innerHTML = '';
  }

  static setupRouter() {
    if (typeof router === 'undefined') {
      throw new Error('Router not loaded');
    }
    console.info('📍 Router initialized');
  }

  static setupEventListeners() {
    window.addEventListener('hashchange', () => {
      if (typeof router !== 'undefined') {
        router.handleRoute();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && typeof router !== 'undefined') {
        router.handleRoute();
      }
    });

    console.info('👂 Event listeners set up');
  }

  static checkThemePreference() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode && typeof applyDarkMode === 'function') {
      applyDarkMode(true);
      window.appState = window.appState || {};
      window.appState.theme = 'dark';
    }
  }

  static handleInitError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'init-error';
    errorDiv.innerHTML = `
      <h2>⚠️ Initialisierungsfehler</h2>
      <p>${error.message}</p>
      <button onclick="location.reload()">App neu laden</button>
    `;
    document.body.appendChild(errorDiv);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AppInit.initialize();
  });
} else {
  AppInit.initialize();
}

window.AppInit = AppInit;
