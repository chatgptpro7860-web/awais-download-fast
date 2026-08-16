// Vercel Serverless Function Handler for AwaisX
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

let app;
try {
  app = require('../server');
} catch (err) {
  console.error('[Server Import Fallback]:', err);
  app = express();
  app.use(cors());
  app.use(express.json());
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'AwaisX', message: 'AwaisX Cloud API Active' });
  });

  app.all('*', (req, res) => {
    const indexPath = path.join(__dirname, '..', 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    res.send('<h1>⚡ AwaisX is Live!</h1>');
  });
}

module.exports = app;
