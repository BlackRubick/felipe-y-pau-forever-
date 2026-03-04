import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database';
import authRoutes from './routes/auth';
import testRoutes from './routes/tests';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Base de datos inicializada correctamente');
    
    app.listen(PORT, () => {
      console.log(`\n🚀 API Server running at http://localhost:${PORT}`);
      console.log(`📝 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
      console.log(`\n✅ Available endpoints:`);
      console.log(`   POST   /api/auth/register      - Register new user`);
      console.log(`   POST   /api/auth/login         - Login`);
      console.log(`   POST   /api/auth/refresh       - Refresh token`);
      console.log(`   GET    /api/auth/me            - Get current user`);
      console.log(`   POST   /api/tests              - Create test`);
      console.log(`   GET    /api/tests              - List tests`);
      console.log(`   GET    /api/tests/:id          - Get test by ID`);
      console.log(`   POST   /api/tests/:id/readings - Add test reading`);
      console.log(`   POST   /api/tests/:id/alerts   - Add test alert`);
      console.log(`   PUT    /api/tests/:id          - Update test`);
      console.log(`   PUT    /api/tests/:id/finalize - Finalize test`);
      console.log(`   DELETE /api/tests/:id          - Cancel test\n`);
    });
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

startServer();
