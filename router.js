// Professional SPA router with safe fallback handling.
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.defaultRoute = '/';

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  addRoute(path, component) {
    const normalizedPath = this.normalizePath(path);
    this.routes[normalizedPath] = component;
  }

  normalizePath(path) {
    if (!path || typeof path !== 'string') return this.defaultRoute;
    return path.startsWith('/') ? path : `/${path}`;
  }

  getCurrentPath() {
    const hash = window.location.hash.slice(1) || '/';
    return this.normalizePath(hash.split('?')[0] || '/');
  }

  getQueryParams() {
    const hash = window.location.hash.slice(1);
    const [, query] = hash.split('?');
    return new URLSearchParams(query || '');
  }

  handleRoute() {
    const path = this.getCurrentPath();
    const route = this.routes[path] || this.routes[this.defaultRoute];

    if (route && typeof route.render === 'function') {
      this.currentRoute = path;
      window.appState = window.appState || {};
      window.appState.currentRoute = path;

      try {
        route.render();
      } catch (error) {
        console.error('Route render failed:', error);
        this.renderErrorState(path);
      }
      return;
    }

    this.renderErrorState(path);
  }

  renderErrorState(path) {
    console.warn('Kein gültiger Route-Handler gefunden für Pfad:', path);
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <section class="error-message" role="alert">
          <h1>Seite nicht verfügbar</h1>
          <p>Die angeforderte Ansicht konnte nicht geladen werden. Bitte prüfe die Adresse oder lade die Seite neu.</p>
        </section>
      `;
    }
  }

  navigate(path, replace = false) {
    const normalizedPath = this.normalizePath(path);
    if (replace) {
      window.location.replace(`#${normalizedPath}`);
      return;
    }
    window.location.hash = normalizedPath;
  }
}

const router = new Router();
window.router = router;