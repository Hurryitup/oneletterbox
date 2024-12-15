import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { authService } from '../services/auth';
import { config } from '../config';
import { useAuth } from '../contexts/AuthContext';

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

// Create an axios instance with the same configuration as auth service
const api = axios.create({
  baseURL: config.baseApiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Cache for issues data
let issuesCache: {
  data: Issue[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 30000; // 30 seconds

export function useIssuesHook() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const activeRequest = useRef<AbortController | null>(null);
  const initialLoadRef = useRef(false);

  const fetchIssues = useCallback(async (force: boolean = false) => {
    if (!isAuthenticated) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    // Check cache first
    if (!force && issuesCache && Date.now() - issuesCache.timestamp < CACHE_DURATION) {
      setIssues(issuesCache.data);
      const sources = Array.from(new Set(issuesCache.data.map(issue => issue.sender)));
      setAvailableSources(sources);
      setLoading(false);
      initialLoadRef.current = true;
      return;
    }

    // Cancel any ongoing request
    if (activeRequest.current) {
      activeRequest.current.abort();
    }

    // Create new abort controller for this request
    activeRequest.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const response = await api.get<Issue[]>('/user/inboxes', {
        signal: activeRequest.current.signal
      });

      // Update cache
      issuesCache = {
        data: response.data,
        timestamp: Date.now()
      };

      setIssues(response.data);
      const sources = Array.from(new Set(response.data.map(issue => issue.sender)));
      setAvailableSources(sources);
      initialLoadRef.current = true;
    } catch (err) {
      // Only set error if request wasn't cancelled
      if (!axios.isAxiosError(err) || err.code !== 'ERR_CANCELED') {
        setError(axios.isAxiosError(err) 
          ? err.response?.data?.error || 'Failed to fetch inbox messages'
          : 'Failed to fetch inbox messages'
        );
        console.error('Error fetching inbox messages:', err);
      }
    } finally {
      setLoading(false);
      activeRequest.current = null;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Only fetch issues after auth loading is complete and we're authenticated
    if (!authLoading && isAuthenticated) {
      fetchIssues();
    }

    return () => {
      // Only abort if there's an active request during unmount
      if (activeRequest.current) {
        activeRequest.current.abort();
      }
    };
  }, [fetchIssues, authLoading, isAuthenticated]);

  const refresh = useCallback(() => {
    return fetchIssues(true);
  }, [fetchIssues]);

  // Return loading as true until both auth is complete and initial issues load is done
  const isLoading = authLoading || (loading && !initialLoadRef.current);

  return {
    issues,
    loading: isLoading,
    error,
    availableSources,
    refreshIssues: refresh,
  };
} 