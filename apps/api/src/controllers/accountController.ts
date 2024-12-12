import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { generateToken } from '../middleware/auth';

// Define interface for authenticated request
interface AuthenticatedRequest extends Request {
  user: IUser;
}

export const accountController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create new user
      const user = await User.create({
        name,
        email,
        password,
        preferences: {
          emailDigest: true,
          notifications: true,
          theme: 'Light',
        },
      });

      const token = generateToken(user.id);

      res.status(201).json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json({ error: message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await User.findByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isMatch = await User.comparePassword(user, password);
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }

      const token = generateToken(user.id);

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ error: message });
    }
  },

  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        joinDate: user.joinDate,
        subscription: user.subscription,
        preferences: user.preferences,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get profile';
      res.status(400).json({ error: message });
    }
  },

  async updateProfile(req: AuthenticatedRequest, res: Response) {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'preferences'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    try {
      const user = req.user;
      const updatedUser = {
        ...user,
        ...updates.reduce((acc, update) => ({
          ...acc,
          [update]: req.body[update],
        }), {}),
      };

      await User.create(updatedUser); // DynamoDB PutItem will overwrite existing item

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        joinDate: updatedUser.joinDate,
        subscription: updatedUser.subscription,
        preferences: updatedUser.preferences,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      res.status(400).json({ error: message });
    }
  },

  async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user;

      const isMatch = await User.comparePassword(user, currentPassword);
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }

      const updatedUser = {
        ...user,
        password: newPassword, // Will be hashed by the create method
      };

      await User.create(updatedUser); // DynamoDB PutItem will overwrite existing item

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      res.status(400).json({ error: message });
    }
  },
}; 