import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface AccountProps {
  onBack: () => void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  inboxes: string[];
  joinDate: string;
  subscription?: {
    plan: string;
    status: string;
    nextBilling: string | null;
  };
  preferences: {
    emailDigest: boolean;
    notifications: boolean;
    theme: 'Light' | 'Dark';
  };
}

export function Account({ onBack }: AccountProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();
  const [newEmailPrefix, setNewEmailPrefix] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/user', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setUserData(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch user data');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleAddEmail = async () => {
    if (!newEmailPrefix) {
      setEmailError('Please enter an email prefix');
      return;
    }

    // Trim whitespace and convert to lowercase
    const cleanPrefix = newEmailPrefix.trim().toLowerCase();
    
    // Basic validation for the prefix
    if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(cleanPrefix)) {
      setEmailError('Invalid prefix format. Use only letters, numbers, and single dots, hyphens, or underscores.');
      return;
    }

    const newEmail = `${cleanPrefix}@oneletterbox.com`;
    try {
      const response = await axios.post(
        'http://localhost:3001/api/user/inbox',
        { email: newEmail },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setUserData(response.data);
      setNewEmailPrefix('');
      setEmailError(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setEmailError(err.response.data.error);
      } else {
        setEmailError('Failed to add inbox');
      }
      console.error('Error adding inbox:', err);
    }
  };

  const handleDeleteEmail = async (index: number) => {
    try {
      const response = await axios.delete(
        `http://localhost:3001/api/user/inbox/${index}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      setUserData(response.data);
    } catch (err) {
      console.error('Error deleting inbox:', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">
      <div className="text-gray-600">Loading...</div>
    </div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-full">
      <div className="text-red-600">Error: {error}</div>
    </div>;
  }

  if (!userData) {
    return <div className="flex justify-center items-center h-full">
      <div className="text-gray-600">No user data available</div>
    </div>;
  }

  const subscription = userData.subscription || {
    plan: 'Free',
    status: 'Active',
    nextBilling: null,
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <span className="mr-2">←</span> Back
        </button>
        <button 
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium">{userData.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{userData.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Join Date:</span>
            <span className="font-medium">
              {new Date(userData.joinDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Inboxes</h2>
        <div className="space-y-4">
          {userData.inboxes.map((inbox, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="font-medium">{inbox}</span>
              <button
                onClick={() => handleDeleteEmail(index)}
                className="text-red-500 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          ))}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="prefix"
              className="border rounded p-2 flex-grow"
              value={newEmailPrefix}
              onChange={(e) => setNewEmailPrefix(e.target.value)}
            />
            <span className="text-gray-600">@oneletterbox.com</span>
            <button
              onClick={handleAddEmail}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          {emailError && (
            <div className="text-red-500 text-sm">{emailError}</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Subscription</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Plan:</span>
            <span className="font-medium">{subscription.plan}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Status:</span>
            <span className="font-medium">{subscription.status}</span>
          </div>
          {subscription.nextBilling && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Next Billing:</span>
              <span className="font-medium">
                {new Date(subscription.nextBilling).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={userData.preferences.emailDigest}
              readOnly
              className="mr-3"
            />
            <span className="text-gray-600">Email Digest</span>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={userData.preferences.notifications}
              readOnly
              className="mr-3"
            />
            <span className="text-gray-600">Notifications</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Theme:</span>
            <span className="font-medium">{userData.preferences.theme}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 