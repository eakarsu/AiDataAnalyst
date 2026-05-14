import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import uploadRoutes from './routes/upload.js';
import publicRoutes from './routes/public.js';
import aiNewRoutes from './routes/aiNew.js';
import { aiRateLimiter } from './middleware/rateLimiter.js';
import { initializeDatabase } from './models/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Helmet security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Middleware
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());

// Static file serving for exports
app.use('/exports', express.static(join(__dirname, '../exports')));

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/api', apiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRateLimiter, aiNewRoutes);





app.use('/api/ai', (await import('./routes/dashboardFromIntent.js')).default);
app.use('/api/ai', (await import('./routes/dataQuality.js')).default);
app.use('/api/ai', (await import('./routes/predictiveModels.js')).default);
app.use('/api/ai', (await import('./routes/autoInsights.js')).default);
app.use('/api/ai', (await import('./routes/sqlGeneration.js')).default);
app.use('/public', publicRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    await initializeDatabase();
// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-missing-query-builder-generate-dashboard-analyze-data-predic', require('./routes/gap_missing_query_builder_generate_dashboard_analyze_data_predic'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-database-connectors-sql-nosql-cloud-data-warehouses-only', require('./routes/gap_no_database_connectors_sql_nosql_cloud_data_warehouses_only'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-real-time-data-streaming', require('./routes/gap_no_real_time_data_streaming'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-data-quality-monitoring-engine', require('./routes/gap_no_data_quality_monitoring_engine'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-advanced-visualization-library-plotly-d3-deck-gl-on-backe', require('./routes/gap_no_advanced_visualization_library_plotly_d3_deck_gl_on_backe'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-sms-notification', require('./routes/gap_no_sms_notification'));

    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
