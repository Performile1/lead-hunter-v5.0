import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startMonitoringScheduler } from './scheduler/monitoringScheduler.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import leadRoutes from './routes/leads.js';
import searchRoutes from './routes/search.js';
import adminRoutes from './routes/admin.js';
import statsRoutes from './routes/stats.js';
import exclusionRoutes from './routes/exclusions.js';
import assignmentRoutes from './routes/assignments.js';
import terminalRoutes from './routes/terminals.js';
import analysisRoutes from './routes/analysis.js';
import leadManagementRoutes from './routes/lead-management.js';
import monitoringRoutes from './routes/monitoring.js';
import batchJobsRoutes from './routes/batch-jobs.js';
import settingsRoutes from './routes/settings.js';
import leadActionsRoutes from './routes/lead-actions.js';
import customerRoutes from './routes/customers.js';
import scrapeRoutes from './routes/scrape.js';
import userSettingsRoutes from './routes/user-settings.js';
import tenantsRoutes from './routes/tenants.js';
import tenantAuthRoutes from './routes/tenant-auth.js';
import notificationsRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import errorReportsRoutes from './routes/errorReports.js';
import adminLeadsRoutes from './routes/adminLeads.js';
import batchAnalysisRoutes from './routes/batchAnalysis.js';
import quotasRoutes from './routes/quotas.js';

// Services
import { startScheduler as startBatchScheduler } from './services/batchSchedulerService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'För många requests från denna IP, försök igen senare.'
});
app.use('/api/', limiter);

// Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ============================================
// ROUTES
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Auth routes (public)
app.use('/api/auth', authRoutes);
app.use('/api/tenant-auth', tenantAuthRoutes);

// Protected routes
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/scrape', scrapeRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/exclusions', exclusionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/terminals', terminalRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/lead-management', leadManagementRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/batch-jobs', batchJobsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/lead-actions', leadActionsRoutes);
app.use('/api/user-settings', userSettingsRoutes);
app.use('/api/tenants', tenantsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/error-reports', errorReportsRoutes);
app.use('/api/admin', adminLeadsRoutes);
app.use('/api/batch-analysis', batchAnalysisRoutes);
app.use('/api/quotas', quotasRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  logger.info(`🚀 DHL Lead Hunter API running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔒 CORS enabled for: ${process.env.ALLOWED_ORIGINS}`);
  
  // Start customer monitoring scheduler
  startMonitoringScheduler();
  
  // Start batch analysis scheduler
  startBatchScheduler();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;
