const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const compression = require('compression');
const fs = require('fs');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: true }));
app.use(compression());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend static assets with caching for production
const staticOptions = { maxAge: '1d', etag: true };
app.use('/frontend', express.static(path.join(__dirname, '../frontend'), staticOptions));
app.use(express.static(path.join(__dirname, '../frontend'), staticOptions));

// Setup request logging
try {
  const logStream = fs.createWriteStream(path.join(__dirname, 'server.log'), { flags: 'a' });
  app.use(morgan('combined', { stream: logStream }));
} catch (e) {
  app.use(morgan('dev'));
}

const routes = require('./routes');
app.use('/api', routes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route nicht gefunden' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
    console.log('SAAS-Backend bereit für Anfragen.');
  });
}

module.exports = app;