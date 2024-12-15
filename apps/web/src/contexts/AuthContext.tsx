import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService, AuthResponse, LoginData, RegisterData } from '../services/auth';

type Theme = 'light' | 'dark';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshProfile: () => Promise<AuthResponse['user']>;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const initializationRef = useRef(false);
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check local storage first
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    
    // Then check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Update document theme class whenever theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    try {
      // Update local state first for immediate feedback
      setThemeState(newTheme);
      localStorage.setItem('theme', newTheme);
      
      // If user is authenticated, sync theme preference to server
      if (user) {
        const updatedUser = await authService.updatePreferences({
          ...user.preferences,
          theme: newTheme === 'light' ? 'Light' : 'Dark'
        });
        // Update user state with server response
        setUser(updatedUser);
      }
    } catch (error) {
      // Revert theme if server update fails
      setThemeState(theme);
      localStorage.setItem('theme', theme);
      throw error; // Re-throw to let caller handle error
    }
  }, [user, theme]);

  const updateUserAndTheme = useCallback((userData: AuthResponse['user']) => {
    setUser(userData);
    setIsAuthenticated(true);
    const serverTheme = userData.preferences.theme.toLowerCase() as Theme;
    // Use setThemeState to avoid triggering another server update
    setThemeState(serverTheme);
    localStorage.setItem('theme', serverTheme);
  }, []);

  const fetchProfile = useCallback(async () => {
    const userData = await authService.getProfile();
    updateUserAndTheme(userData);
    return userData;
  }, [updateUserAndTheme]);

  useEffect(() => {
    const initAuth = async () => {
      // Skip if already initialized
      if (initializationRef.current) {
        return;
      }
      initializationRef.current = true;

      try {
        const token = authService.getToken();
        if (token) {
          await fetchProfile();
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [fetchProfile]);

  const login = async (data: LoginData) => {
    const response = await authService.login(data);
    updateUserAndTheme(response.user);
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    updateUserAndTheme(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      register, 
      logout, 
      loading,
      refreshProfile: fetchProfile,
      theme,
      setTheme
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 