import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routers.js';

const app = express();
const PORT = process.env.PORT;

// Enable CORS from Vite frontend
app.use(cors({
  origin: ['http://localhost:5173'],
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
  console.log(`  [server]: Server is running at http://localhost:${PORT}`);
});
