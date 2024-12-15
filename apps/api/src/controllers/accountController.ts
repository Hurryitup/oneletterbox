import { Request, Response } from 'express';
import { User, IUser } from '../models/User';
import { generateToken } from '../middleware/auth';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDB } from '../config/dynamodb';
import { Readable } from 'stream';
import bcrypt from 'bcryptjs';

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

// Helper function to convert stream to string
async function streamToString(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

// Define interface for authenticated request
interface AuthenticatedRequest extends Request {
  user: IUser;
}

interface Issue {
  issueId: string;
  sender: string;
  subject: string;
  receivedAt: string;
  s3Location: string;
  status: string;
  archived: boolean;
  starred: boolean;
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
        inboxes: [],
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
      console.log('Login attempt:', { email });

      const user = await User.findByEmail(email);
      console.log('User found:', { found: !!user });
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isMatch = await User.comparePassword(user, password);
      console.log('Password match:', { isMatch });
      
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
      console.error('Login error:', error);
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
        inboxes: user.inboxes || [],
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

      await User.update(updatedUser);

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
        password: await bcrypt.hash(newPassword, 10),
      };

      await User.update(updatedUser);

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      res.status(400).json({ error: message });
    }
  },

  async addCustomEmail(req: AuthenticatedRequest, res: Response) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      
      // Validate email domain
      if (!email.endsWith('@oneletterbox.com')) {
        return res.status(400).json({ error: 'Email must be from oneletterbox.com domain' });
      }

      const user = req.user;
      
      // Check if email already exists
      if (user.inboxes?.includes(email)) {
        return res.status(400).json({ error: 'Inbox already exists' });
      }

      // Ensure inboxes array exists
      const currentInboxes = user.inboxes || [];

      const updatedUser = {
        ...user,
        inboxes: [...currentInboxes, email],
      };

      await User.update(updatedUser);

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        inboxes: updatedUser.inboxes,
        joinDate: updatedUser.joinDate,
        subscription: updatedUser.subscription,
        preferences: updatedUser.preferences,
      });
    } catch (error) {
      console.error('Error adding inbox:', error);
      const message = error instanceof Error ? error.message : 'Failed to add inbox';
      res.status(400).json({ error: message });
    }
  },

  async deleteCustomEmail(req: AuthenticatedRequest, res: Response) {
    try {
      const index = parseInt(req.params.index);
      const user = req.user;

      if (index < 0 || index >= user.inboxes.length) {
        return res.status(400).json({ error: 'Invalid inbox index' });
      }

      const updatedInboxes = [...user.inboxes];
      updatedInboxes.splice(index, 1);

      const updatedUser = {
        ...user,
        inboxes: updatedInboxes,
      };

      await User.update(updatedUser);

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        inboxes: updatedUser.inboxes,
        joinDate: updatedUser.joinDate,
        subscription: updatedUser.subscription,
        preferences: updatedUser.preferences,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete inbox';
      res.status(400).json({ error: message });
    }
  },

  async getIssues(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;
      
      if (!user || !user.inboxes) {
        return res.status(400).json({ error: 'User has no inboxes configured' });
      }

      const allMessages: Issue[] = [];

      // Query messages for each inbox
      for (const inbox of user.inboxes) {
        const command = new QueryCommand({
          TableName: process.env.INBOXES_TABLE || 'Inboxes',
          KeyConditionExpression: 'partitionKey = :pk',
          ExpressionAttributeValues: {
            ':pk': `INBOX#${inbox}`,
          },
        });

        const response = await dynamoDB.send(command);
        const messages = response.Items?.map(item => ({
          issueId: item.issueId,
          sender: item.sender,
          subject: item.subject,
          receivedAt: item.receivedAt,
          s3Location: item.s3Location,
          status: item.status,
          archived: item.archived,
          starred: item.starred,
        })) || [];

        console.log(`Found ${messages.length} messages for inbox: ${inbox}`);
        allMessages.push(...messages);
      }

      // Sort messages by receivedAt in descending order (newest first)
      allMessages.sort((a, b) => 
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      );

      res.json(allMessages);
    } catch (error) {
      console.error('Error in getIssues:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch messages';
      res.status(500).json({ error: message });
    }
  },

  async getIssueContent(req: AuthenticatedRequest, res: Response) {
    try {
      const { issueId } = req.params;
      const user = req.user;

      if (!user || !user.inboxes) {
        return res.status(400).json({ error: 'User has no inboxes configured' });
      }

      // First, find the message in any of the user's inboxes
      let messageData = null;
      for (const inbox of user.inboxes) {
        const command = new QueryCommand({
          TableName: process.env.INBOXES_TABLE || 'Inboxes',
          KeyConditionExpression: 'partitionKey = :pk',
          FilterExpression: 'issueId = :issueId',
          ExpressionAttributeValues: {
            ':pk': `INBOX#${inbox}`,
            ':issueId': issueId,
          },
        });

        const response = await dynamoDB.send(command);
        if (response.Items && response.Items.length > 0) {
          messageData = response.Items[0];
          break;
        }
      }

      if (!messageData) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Extract bucket and key from s3Location
      // s3Location format: s3://bucket-name/key
      const s3Location = messageData.s3Location;
      const [, , bucket, ...keyParts] = s3Location.split('/');
      const key = keyParts.join('/');

      console.log(`Fetching content from S3: ${bucket}/${key}`);

      // Get the object from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      try {
        const s3Response = await s3Client.send(getObjectCommand);
        
        if (!s3Response.Body) {
          throw new Error('No content received from S3');
        }

        // Convert the readable stream to a string
        const content = await streamToString(s3Response.Body as Readable);
        res.json({ content });
      } catch (error: any) {
        console.error('S3 error:', error.message);
        throw error;
      }
    } catch (error) {
      console.error('Error fetching message content:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch message content';
      res.status(500).json({ error: message });
    }
  },
}; 