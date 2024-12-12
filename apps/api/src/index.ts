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

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Account Management Routes
app.post('/api/account/register', accountController.register);
app.post('/api/account/login', accountController.login);
app.get('/api/account/profile', auth, accountController.getProfile);
app.patch('/api/account/profile', auth, accountController.updateProfile);
app.post('/api/account/change-password', auth, accountController.changePassword);

// User Data Route (for backward compatibility)
app.get('/api/user', auth, (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
