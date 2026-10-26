import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
const app = express();
const configuredClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const localDevelopmentOrigin = /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+):\d+$/;

app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === configuredClientUrl || (process.env.NODE_ENV !== 'production' && localDevelopmentOrigin.test(origin))) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== 'production') return callback(null, false);
    return callback(null, false);
  },
}));
app.use(express.json({ limit: '20kb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use((req, res) => res.status(404).json({ message: 'Route not found.' }));
const port = process.env.PORT || 5000;
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('Startup failed: set MONGODB_URI and JWT_SECRET in backend/.env'); process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGODB_URI);
  const server = app.listen(port, '0.0.0.0', () => console.log(`API running at http://localhost:${port}`));
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the existing VyayaNova API process or set a different PORT in backend/.env.`);
      process.exit(1);
    }
    console.error('API server failed to start:', error.message);
    process.exit(1);
  });
} catch (error) { console.error('MongoDB connection failed:', error.message); process.exit(1); }
