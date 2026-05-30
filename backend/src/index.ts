import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routers.js';

const app = express();
const PORT = process.env.PORT || 5050;

// Enable CORS from Vite frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', system: 'nexus-core-backend' });
});

// Start Express server
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`  NEXUS CORE SYSTEM BACKEND ACTIVE      `);
  console.log(`  Listening on Port: ${PORT}            `);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`========================================`);
});
