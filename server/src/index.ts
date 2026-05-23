import express from 'express';
import cors from 'cors';
import searchRouter from './routes/search';
import pricesRouter from './routes/prices';
import gradedRouter from './routes/graded';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json());

app.use('/api/search', searchRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/graded', gradedRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Proxy currency rates to avoid client-side CORS issues
app.get('/api/rates', async (_req, res) => {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=GBP,AED');
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

app.listen(PORT, () => {
  console.log(`TCGapp server running on http://localhost:${PORT}`);
});
