import { PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDB } from '../config/dynamodb';
import bcrypt from 'bcryptjs';

export interface IUser {
  id: string;
  email: string;
  password: string;
  name: string;
  joinDate: string;
  inboxes: string[];
  subscription?: {
    plan: 'Free' | 'Premium';
    status: 'Active' | 'Inactive';
    nextBilling?: string;
  };
  preferences: {
    emailDigest: boolean;
    notifications: boolean;
    theme: 'Light' | 'Dark';
  };
}

export const User = {
  async findByEmail(email: string): Promise<IUser | null> {
    const command = new QueryCommand({
      TableName: 'Users',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    });

    const result = await dynamoDB.send(command);
    return result.Items?.[0] as IUser || null;
  },

  async findById(id: string): Promise<IUser | null> {
    const command = new GetCommand({
      TableName: 'Users',
      Key: { id },
    });

    const result = await dynamoDB.send(command);
    return result.Item as IUser || null;
  },

  async create(userData: Omit<IUser, 'id' | 'joinDate'>): Promise<IUser> {
    const id = Date.now().toString();
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user: IUser = {
      id,
      ...userData,
      inboxes: userData.inboxes || [],
      password: hashedPassword,
      joinDate: new Date().toISOString(),
      preferences: userData.preferences || {
        emailDigest: true,
        notifications: true,
        theme: 'Light',
      },
    };

    const command = new PutCommand({
      TableName: 'Users',
      Item: user,
    });

    await dynamoDB.send(command);
    return user;
  },

  async update(user: IUser): Promise<IUser> {
    const command = new PutCommand({
      TableName: 'Users',
      Item: user,
    });

    await dynamoDB.send(command);
    return user;
  },

  async comparePassword(user: IUser, candidatePassword: string): Promise<boolean> {
    console.log('Comparing passwords:', {
      hashedPassword: user.password,
      candidatePasswordLength: candidatePassword.length,
      candidatePassword: candidatePassword,
      hashed_password: bcrypt.hashSync(candidatePassword, 10)
    });
    const result = await bcrypt.compare(candidatePassword, user.password);
    console.log('Password comparison result:', result);
    return result;
  },
}; 