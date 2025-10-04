import express, { Application, Request, Response } from 'express';
import cors from 'cors';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// API Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Placeholder proxy routes
app.get('/api/auth/*', (req: Request, res: Response) => {
  res.json({ message: 'Proxy to auth service' });
});

app.get('/api/core/*', (req: Request, res: Response) => {
  res.json({ message: 'Proxy to core service' });
});

app.get('/api/mcp/*', (req: Request, res: Response) => {
  res.json({ message: 'Proxy to MCP server' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

export default app;
