import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes.ts';
import { getDb } from './server/db.ts';
import { startBackgroundSyllabusScheduler } from './server/syllabusSyncService.ts';
import {
  ensureMasterContentSeeded,
  startMasterContentScheduler,
} from './server/masterContentService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Seed database
  getDb();

  // Seed and verify master exam-wise content
  ensureMasterContentSeeded();

  // Start background official competitive exam syllabus synchronizer
  startBackgroundSyllabusScheduler(30);

  // Start master content daily scheduler (12:00 AM Asia/Kolkata daily 20 & vocab + 7-day mock rotations)
  startMasterContentScheduler();

  // Serve uploaded binary files statically
  const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    fs.mkdirSync(path.join(uploadsDir, 'images'), { recursive: true });
    fs.mkdirSync(path.join(uploadsDir, 'pdfs'), { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
      }
    }
  }));

  // Middleware for JSON & URL-encoded data
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API router
  app.use('/api', apiRouter);

  // 404 for unmatched /api routes
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'ABHISHEK ENGLISH CLASSES',
      mode: isProduction ? 'production' : 'development',
      timestamp: new Date().toISOString(),
    });
  });

  if (!isProduction) {
    // Vite middleware in dev
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ABHISHEK ENGLISH CLASSES] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
