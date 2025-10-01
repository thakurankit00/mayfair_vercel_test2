/**
 * Vercel Entry Point for Mayfair v2
 * Serverless-friendly Express app (no app.listen) that mounts API routes and serves frontend
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const fs = require('fs');

// Knex instance
const db = require('./src/config/database');

const app = express();

// Trust proxy in serverless
app.set('trust proxy', 1);

// Security middleware (CSP disabled to avoid SSR/serverless issues)
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS
app.use(cors({
  origin: [
    'http://localhost:3001',
    'http://localhost:3002',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true
}));

// Core middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      version: process.env.APP_VERSION || '1.0.0'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      version: process.env.APP_VERSION || '1.0.0'
    }
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({ success: true, message: 'API is working!', timestamp: new Date().toISOString() });
});

// DB health
app.get('/api/db-health', async (req, res) => {
  try {
    const result = await db.raw('SELECT 1 as ok');
    const ok = result?.rows ? result.rows[0]?.ok : (Array.isArray(result) ? (result[0]?.ok ?? result[0]?.[0]?.ok) : 1);
    res.status(200).json({ success: true, data: { db: 'up', ok } });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'DB_UNAVAILABLE', message: error.message } });
  }
});

// Auto-mount all route files under /api/v1
try {
  const routesDir = path.join(__dirname, 'src', 'routes');
  const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  files.forEach((file) => {
    const base = file.replace(/\.js$/i, '');
    try {
      const router = require(path.join(routesDir, file));
      if (router && typeof router === 'function') {
        app.use(`/api/v1/${base}`, router);
        console.log(`Mounted /api/v1/${base}`);
      } else {
        console.warn(`Skipped ${file}: export is not an Express router`);
      }
    } catch (err) {
      console.log(`Route "${file}" not available: ${err.message}`);
    }
  });
} catch (error) {
  console.error('Error loading routes:', error);
  // Fallback for /api/* when routes fail to load
  app.use('/api/*', (req, res) => {
    res.status(503).json({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE', message: 'API routes are temporarily unavailable' }
    });
  });
}

// Serve React static files: look in multiple locations to be robust on Vercel
const candidateBuilds = [
  path.join(__dirname, 'public'), // copied build during postinstall
  path.join(__dirname, '../frontend/build'), // monorepo relative path
  path.join(process.cwd(), 'frontend', 'build') // cwd fallback
];
const staticRoot = candidateBuilds.find(p => {
  try { return fs.existsSync(p); } catch (_) { return false; }
});

if (staticRoot) {
  app.use(express.static(staticRoot));
  // Only handle non-API routes here
  app.get(/^\/(?!api\/).*/, (req, res) => {
    try {
      res.sendFile(path.join(staticRoot, 'index.html'));
    } catch (error) {
      res.status(500).json({ success: false, error: { code: 'STATIC_FILE_ERROR', message: 'Unable to serve frontend files' } });
    }
  });
} else {
  // Fallback when no frontend build is present
  app.get('/', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Mayfair API is running (no frontend build found)',
      endpoints: {
        health: '/api/health',
        dbHealth: '/api/db-health',
        apiBase: '/api/v1'
      }
    });
  });
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found. See /api/health' } });
  });
}

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } });
});

// Export for Vercel
module.exports = app;

