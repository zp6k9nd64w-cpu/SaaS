// Performance Optimization
// Lazy Loading und Init-Optimierung

class PerformanceOptimizer {
  static init() {
    // Lazy Loading für nicht-kritische Features
    this.enableLazyLoading();
    // Prefetch kritische Ressourcen
    this.prefetchCriticalResources();
    // Compress & Minimize Layout Shift
    this.optimizeLayoutShift();
  }

  static enableLazyLoading() {
    const prefix = location.protocol === 'file:' ? 'frontend/' : '';
    // Lazy load non-critical script nach 2s
    setTimeout(() => {
      this.lazyLoadScript(`${prefix}pages/dashboard-widgets.js`);
      this.lazyLoadScript(`${prefix}pages/media-library.js`);
      this.lazyLoadScript(`${prefix}pages/weekly-summary.js`);
    }, 2000);
  }

  static lazyLoadScript(src) {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }

  static prefetchCriticalResources() {
    const prefix = location.protocol === 'file:' ? 'frontend/' : '';
    const criticalResources = [
      `${prefix}pages/dashboard.js`,
      `${prefix}pages/quiz.js`,
      `${prefix}pages/notes.js`,
      `${prefix}pages/aufgaben.js`
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  static optimizeLayoutShift() {
    // Prevent Cumulative Layout Shift
    document.querySelectorAll('[data-lazy]').forEach(el => {
      el.style.minHeight = el.dataset.minHeight || '100px';
    });

    // Optimize images
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.loading = 'lazy';
      }
    });
  }

  static cacheDB() {
    // Cache mockDB in localStorage für schnellere Zugriffe
    if (!localStorage.getItem('mockDB_cached')) {
      const cacheData = {
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem('mockDB_cached', JSON.stringify(cacheData));
    }
  }
}

// Starte nach DOM bereit
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    PerformanceOptimizer.init();
    PerformanceOptimizer.cacheDB();
  });
} else {
  PerformanceOptimizer.init();
  PerformanceOptimizer.cacheDB();
}
