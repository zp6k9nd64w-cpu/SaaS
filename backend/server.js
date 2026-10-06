const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const contentSecurityPolicy = helmet.contentSecurityPolicy.getDefaultDirectives();
delete contentSecurityPolicy['script-src'];
delete contentSecurityPolicy['script-src-attr'];
delete contentSecurityPolicy['style-src'];
delete contentSecurityPolicy['upgrade-insecure-requests'];

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...contentSecurityPolicy,
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: ["'self'", 'https://www.youtube-nocookie.com'],
      upgradeInsecureRequests: null
    }
  }
}));
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !req.headers.origin) return next();
  const requestOrigin = req.headers.origin;
  const currentOrigin = `${req.protocol}://${req.get('host')}`;
  if (requestOrigin === currentOrigin) return next();
  return res.status(403).json({ success: false, message: 'Anfragequelle nicht zugelassen.' });
});
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve frontend static assets with caching for production
const staticOptions = { maxAge: '1d', etag: true };
app.use('/frontend', express.static(path.join(__dirname, '../frontend'), staticOptions));
app.use(express.static(path.join(__dirname, '../frontend'), staticOptions));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const routes = require('./routes');
app.use('/api', routes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route nicht gefunden' });
});

if (require.main === module) {
  const db = require('./database');
  db.ready.then(() => {
    app.listen(PORT, () => {
      console.log(`Server läuft auf Port ${PORT}`);
      console.log(`SAAS-Backend bereit (${db.dialect}).`);
    });
  }).catch((error) => {
    console.error('Backend konnte nicht gestartet werden:', error);
    process.exitCode = 1;
  });
}

module.exports = app;