import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { initDatabase, db } from './src/server/db.ts';
import { authRouter } from './src/server/routes/authRoutes.ts';
import { ticketRouter } from './src/server/routes/ticketRoutes.ts';
import { locationRouter } from './src/server/routes/locationRoutes.ts';
import { adminRouter } from './src/server/routes/adminRoutes.ts';
import { categoryRouter } from './src/server/routes/categoryRoutes.ts';
import { notificationRouter } from './src/server/routes/notificationRoutes.ts';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

async function bootstrap() {
  // Initialize database schema and initial institutional data
  initDatabase();

  const app = express();

  // Basic security and parsing middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    try {
      const dbCheck = db.prepare('SELECT 1 as healthy').get() as { healthy: number };
      const usersCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
      const ticketsCount = (db.prepare('SELECT COUNT(*) as c FROM tickets').get() as { c: number }).c;

      res.json({
        status: 'UP',
        system: 'Merishaw Cube Maintenance System',
        database: dbCheck.healthy === 1 ? 'CONNECTED' : 'DEGRADED',
        engine: 'SQLite WAL Mode (node:sqlite)',
        uptime_seconds: Math.floor(process.uptime()),
        records: {
          users: usersCount,
          tickets: ticketsCount
        },
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ status: 'DOWN', error: err.message });
    }
  });

  // Register REST API routers
  app.use('/api/auth', authRouter);
  app.use('/api/tickets', ticketRouter);
  app.use('/api/locations', locationRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/categories', categoryRouter);
  app.use('/api/notifications', notificationRouter);

  // Serve Frontend
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Merishaw Cube Maintenance System running on port ${PORT}`);
    console.log(`🏛️ Institutional API: http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal application startup error:', err);
  process.exit(1);
});
