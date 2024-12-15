import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './Account.module.css';
import api from '../../services/api';
import axios from 'axios';
import { ArrowLeft, Moon, Sun, Mail, User, Calendar, Package, Settings, X } from 'lucide-react';

interface AccountProps {
  onBack: () => void;
}

export function Account({ onBack }: AccountProps) {
  const { user: userData, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [newEmailPrefix, setNewEmailPrefix] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleThemeChange = async () => {
    if (!userData) return;
    
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    try {
      await setTheme(newTheme);
    } catch (err) {
      console.error('Error updating theme:', err);
      setTheme(theme);
    }
  };

  const handleAddEmail = async () => {
    if (!newEmailPrefix) {
      setEmailError('Please enter an email prefix');
      return;
    }

    const cleanPrefix = newEmailPrefix.trim().toLowerCase();
    
    if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/.test(cleanPrefix)) {
      setEmailError('Invalid prefix format. Use only letters, numbers, and single dots, hyphens, or underscores.');
      return;
    }

    const newEmail = `${cleanPrefix}@oneletterbox.com`;
    try {
      setLoading(true);
      await api.post('/user/inbox', { email: newEmail });
      await refreshProfile();
      setNewEmailPrefix('');
      setEmailError(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setEmailError(err.response.data.error);
      } else {
        setEmailError('Failed to add inbox');
      }
      console.error('Error adding inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmail = async (index: number) => {
    try {
      setLoading(true);
      await api.delete(`/user/inbox/${index}`);
      await refreshProfile();
    } catch (err) {
      console.error('Error deleting inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className={styles.accountContainer}>
        <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
          <div className="text-red-500">No user data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.accountContainer}>
      <div className="max-w-4xl mx-auto">
        <div className={styles.header}>
          <button 
            onClick={onBack}
            className={styles.backButton}
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </button>
          <button 
            onClick={logout}
            className={styles.signOutButton}
          >
            Sign Out
          </button>
        </div>

        <div className={styles.card}>
          <div className="p-6">
            <h2 className={styles.cardTitle}>
              <User size={20} />
              Profile
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Name</span>
                <span className={styles.value}>{userData.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{userData.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Join Date</span>
                <span className={styles.value}>
                  {new Date(userData.joinDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className="p-6">
            <h2 className={styles.cardTitle}>
              <Mail size={20} />
              Inboxes
            </h2>
            <div className="space-y-4">
              {(userData.inboxes || []).map((inbox, index) => (
                <div key={index} className={styles.infoRow}>
                  <span className={styles.value}>{inbox}</span>
                  <button
                    onClick={() => handleDeleteEmail(index)}
                    className={styles.deleteButton}
                    disabled={loading}
                    aria-label="Delete inbox"
                  >
                    <X size={18} className={styles.deleteIcon} />
                    <span className={styles.deleteText}>Delete</span>
                  </button>
                </div>
              ))}
              <div className={styles.inputGroup}>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    placeholder="Enter prefix"
                    className={styles.input}
                    value={newEmailPrefix}
                    onChange={(e) => setNewEmailPrefix(e.target.value)}
                    disabled={loading}
                  />
                  <span className={styles.inputSuffix}>@oneletterbox.com</span>
                </div>
                <button
                  onClick={handleAddEmail}
                  className={styles.addButton}
                  disabled={loading}
                >
                  Add Inbox
                </button>
              </div>
              {emailError && (
                <div className={styles.errorText}>{emailError}</div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className="p-6">
            <h2 className={styles.cardTitle}>
              <Package size={20} />
              Subscription
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Plan</span>
                <span className={styles.value}>{userData.subscription?.plan || 'Free'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Status</span>
                <span className={styles.value}>{userData.subscription?.status || 'Active'}</span>
              </div>
              {userData.subscription?.nextBilling && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Next Billing</span>
                  <span className={styles.value}>
                    {new Date(userData.subscription.nextBilling).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className="p-6">
            <h2 className={styles.cardTitle}>
              <Settings size={20} />
              Preferences
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Email Digest</span>
                <input
                  type="checkbox"
                  checked={userData.preferences.emailDigest}
                  readOnly
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded transition-colors"
                />
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Notifications</span>
                <input
                  type="checkbox"
                  checked={userData.preferences.notifications}
                  readOnly
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded transition-colors"
                />
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Theme</span>
                <button
                  onClick={handleThemeChange}
                  className={styles.themeButton}
                >
                  {theme === 'light' ? (
                    <>
                      <Moon size={16} />
                      Switch to Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun size={16} />
                      Switch to Light Mode
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 