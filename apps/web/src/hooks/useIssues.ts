import { useState, useEffect } from 'react';
import axios from 'axios';
import { authService } from '../services/auth';

export interface Issue {
  issueId: string;
  sender: string;
  subject: string;
  receivedAt: string;
  s3Location: string;
  status: string;
  archived: boolean;
  starred: boolean;
}

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableSources, setAvailableSources] = useState<string[]>([]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await axios.get<Issue[]>('http://localhost:3001/api/user/inboxes', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setIssues(response.data);
      
      // Extract unique sources (senders) with type safety
      const sources = Array.from(new Set(response.data.map(issue => issue.sender)));
      setAvailableSources(sources);
      
      setError(null);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Failed to fetch inbox messages');
        console.error('Error fetching inbox messages:', err.response?.data);
      } else {
        setError('Failed to fetch inbox messages');
        console.error('Error fetching inbox messages:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchIssues();
    }
  }, []);

  return {
    issues,
    loading,
    error,
    availableSources,
    refreshIssues: fetchIssues,
  };
} 