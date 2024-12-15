import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { accountController } from './controllers/accountController';
import { auth } from './middleware/auth';
import { newsletters } from './services/newsletterService';
import { IUser } from './models/User';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user: IUser;
    }
  }
}

// Load environment variables first
dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Additional headers for CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Body parser middleware
app.use(express.json());

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Account Management Routes
app.post('/api/account/register', accountController.register);
app.post('/api/account/login', accountController.login);
app.get('/api/account/profile', auth, accountController.getProfile);
app.patch('/api/account/profile', auth, accountController.updateProfile);
app.post('/api/account/change-password', auth, accountController.changePassword);

// Inbox Management Routes
app.post('/api/user/inbox', auth, accountController.addCustomEmail);
app.delete('/api/user/inbox/:index', auth, accountController.deleteCustomEmail);
app.get('/api/user/inboxes', auth, accountController.getIssues);
app.get('/api/inboxes/:issueId/content', auth, accountController.getIssueContent);

// User Data Route (for backward compatibility)
app.get('/api/user', auth, (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    inboxes: user.inboxes || [],
    joinDate: user.joinDate,
    subscription: user.subscription || {
      plan: 'Free',
      status: 'Active',
      nextBilling: null,
    },
    preferences: user.preferences,
  });
});

// Newsletter Routes
app.get('/api/newsletters', auth, (req, res) => {
  res.json(newsletters);
});

// Get single newsletter
app.get('/api/newsletters/:id', auth, (req, res) => {
  const newsletter = newsletters.find(n => n.id === req.params.id);
  if (!newsletter) {
    return res.status(404).json({ error: 'Newsletter not found' });
  }
  res.json(newsletter);
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = parseInt(process.env.PORT || '3001', 10);
// Always use 0.0.0.0 in development to allow external access
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  const localUrl = `http://localhost:${PORT}`;
  const networkUrl = `http://${HOST}:${PORT}`;
  console.log(`API server running on:`);
  console.log(`- Local:   ${localUrl}`);
  console.log(`- Network: ${networkUrl}`);
});
