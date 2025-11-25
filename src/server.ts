import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
// Routes
import authRoutes from './routes/auth.routes';
import workflowRoutes from './routes/workflow.routes';
import osintRoutes from './routes/osint.routes';
import reportsRoutes from './routes/reports.routes';
import totRoutes from './routes/tot.routes';
import prisma from './services/prisma.service';


// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});


app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workflow', workflowRoutes);
app.use('/api/v1/osint', osintRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/tot', totRoutes);

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, '../public')));

// Specific endpoint for TOT Bookkeeping PDF
app.get('/api/v1/resources/tot-bookkeeping-guide', (req, res) => {
  const pdfPath = path.join(__dirname, '../public/TOTBookkeeping.pdf');
  res.sendFile(pdfPath);
});


// Test endpoint
app.get('/test-db', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ success: true, userCount });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ error: 'Database connection failed', details: error });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware (optional but recommended)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});