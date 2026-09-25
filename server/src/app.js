import express from 'express';
import cors from 'cors';
import projectRoutes from './modules/projects/project.routes.js';
import assetRoutes from './modules/assets/asset.routes.js';
import searchRoutes from './modules/search/search.routes.js';
import evidenceRoutes from './modules/evidence/evidence.routes.js';
import comparisonRoutes from './modules/comparisons/comparison.routes.js';
import reportRoutes from './modules/reports/report.routes.js';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arranged Console Logging for End-to-End Debugging
app.use((req, res, next) => {
  const start = Date.now();
  
  // Don't log spammy static or health check routes too loudly if not needed, but we'll log all for now
  console.log(`\n╭───────────────────────────────────────────────────`);
  console.log(`│ ➡️  [REQUEST]  ${req.method} ${req.originalUrl}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`│ 📦 [BODY]`, req.body);
  }
  
  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`│ 🔍 [QUERY]`, req.query);
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    const statusColor = isError ? '\x1b[31m' : '\x1b[32m'; // Red or Green
    const resetColor = '\x1b[0m';
    
    console.log(`│ ⬅️  [RESPONSE] ${req.method} ${req.originalUrl} - Status: ${statusColor}${res.statusCode}${resetColor} (${duration}ms)`);
    console.log(`╰───────────────────────────────────────────────────\n`);
  });
  
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Canopi API is running' });
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/comparisons', comparisonRoutes);
app.use('/api/reports', reportRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.log(`\n╭───────────────── [💥 ERROR] ───────────────────`);
  console.error(`│ [Path]: ${req.method} ${req.originalUrl}`);
  console.error(`│ [Message]: ${err.message}`);
  console.error(`│ [Stack]:\n${err.stack}`);
  console.log(`╰───────────────────────────────────────────────────\n`);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

export default app;
