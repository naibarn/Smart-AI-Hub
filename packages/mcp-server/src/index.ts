import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';

const app: Application = express();
const PORT = process.env.PORT || 3003;
const server = createServer(app);

// Middleware for HTTP
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// WebSocket setup
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected to MCP Server');

  ws.on('message', (message: Buffer) => {
    console.log('Received:', message.toString());
    // Echo back
    ws.send(`Echo: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  // Send welcome message
  ws.send('Welcome to MCP Server');
});

server.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});

export default app;