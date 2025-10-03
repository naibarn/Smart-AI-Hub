import express, { Application, Request, Response } from 'express';
import cors from 'cors';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// Placeholder auth routes
app.post('/register', (req: Request, res: Response) => {
  const { email, password } = req.body;
  // Placeholder for registration logic
  res.json({ message: 'User registered', email });
});

app.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  // Placeholder for login logic
  res.json({ message: 'User logged in', token: 'jwt_token_placeholder' });
});

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});

export default app;