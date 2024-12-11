import React, { useState, useEffect } from 'react';
import './Account.css';

interface AccountProps {
  onBack: () => void;
}

interface UserData {
  name: string;
  email: string;
  joinDate: string;
  subscription: {
    plan: string;
    status: string;
    nextBilling: string;
  };
  preferences: {
    emailDigest: boolean;
    notifications: boolean;
    theme: string;
  };
}

export const Account: React.FC<AccountProps> = ({ onBack }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/user');
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        setUserData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!userData) {
    return <div>No user data available</div>;
  }

  return (
    <div className="account-page">
      <div className="account-header">
        <button onClick={onBack} className="back-button">
          ← Back
        </button>
        <h1>Account Settings</h1>
      </div>
      
      <div className="account-section">
        <h2>Profile</h2>
        <div className="profile-info">
          <div className="info-row">
            <label>Name</label>
            <div>{userData.name}</div>
          </div>
          <div className="info-row">
            <label>Email</label>
            <div>{userData.email}</div>
          </div>
          <div className="info-row">
            <label>Member Since</label>
            <div>{userData.joinDate}</div>
          </div>
        </div>
      </div>

      <div className="account-section">
        <h2>Subscription</h2>
        <div className="subscription-info">
          <div className="info-row">
            <label>Plan</label>
            <div>{userData.subscription.plan}</div>
          </div>
          <div className="info-row">
            <label>Status</label>
            <div>{userData.subscription.status}</div>
          </div>
          <div className="info-row">
            <label>Next Billing</label>
            <div>{userData.subscription.nextBilling}</div>
          </div>
        </div>
      </div>

      <div className="account-section">
        <h2>Preferences</h2>
        <div className="preferences-info">
          <div className="info-row">
            <label>Email Digest</label>
            <div>
              <input 
                type="checkbox" 
                checked={userData.preferences.emailDigest}
                onChange={() => {}} 
              />
            </div>
          </div>
          <div className="info-row">
            <label>Notifications</label>
            <div>
              <input 
                type="checkbox" 
                checked={userData.preferences.notifications}
                onChange={() => {}} 
              />
            </div>
          </div>
          <div className="info-row">
            <label>Theme</label>
            <select value={userData.preferences.theme} onChange={() => {}}>
              <option value="Light">Light</option>
              <option value="Dark">Dark</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
} 