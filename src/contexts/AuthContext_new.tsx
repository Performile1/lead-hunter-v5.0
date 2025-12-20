import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/api';

// API Configuration - inline to ensure it works
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL_INLINE = isProduction 
  ? '/api'
  : 'http://localhost:3001/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'terminal_manager' | 'fs' | 'ts' | 'kam' | 'dm';
  tenant_id: string | null;
  tenant_name?: string;
  tenant_domain?: string;
  subdomain?: string;
  terminal_name?: string;
  terminal_code?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Check session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('dhl_user');
    const storedLastActivity = localStorage.getItem('last_activity');
    
    if (storedUser && storedLastActivity) {
      const lastActivityTime = parseInt(storedLastActivity, 10);
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      
      if (timeSinceLastActivity < SESSION_TIMEOUT) {
        try {
          setUser(JSON.parse(storedUser));
          setLastActivity(lastActivityTime);
        } catch (e) {
          localStorage.removeItem('dhl_user');
          localStorage.removeItem('eurekai_token');
          localStorage.removeItem('last_activity');
        }
      } else {
        // Session expired
        console.log('🔒 Session expired due to inactivity');
        localStorage.removeItem('dhl_user');
        localStorage.removeItem('eurekai_token');
        localStorage.removeItem('last_activity');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Login attempt:', email);
      const response = await fetch(`${API_BASE_URL_INLINE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login misslyckades');
      }

      const data = await response.json();
      console.log('✅ Login response:', data);
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.fullName || data.user.full_name || data.user.name,
        role: data.user.role,
        tenant_id: data.user.tenant?.id || data.user.tenant_id || null,
        tenant_name: data.user.tenant?.name || data.user.tenant_name,
        tenant_domain: data.user.tenant?.domain || data.user.tenant_domain,
        subdomain: data.user.tenant?.subdomain || data.user.subdomain,
        terminal_name: data.user.terminalName || data.user.terminal_name,
        terminal_code: data.user.terminalCode || data.user.terminal_code,
        isSuperAdmin: data.user.isSuperAdmin || false,
      };

      console.log('💾 Saving user data:', userData);
      setUser(userData);
      localStorage.setItem('dhl_user', JSON.stringify(userData));
      localStorage.setItem('eurekai_token', data.token);
      localStorage.setItem('last_activity', Date.now().toString());
      console.log('✅ User data saved to localStorage');
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dhl_user');
    localStorage.removeItem('eurekai_user');
    localStorage.removeItem('eurekai_token');
    localStorage.removeItem('last_activity');
  };

  const updateActivity = () => {
    const now = Date.now();
    setLastActivity(now);
    localStorage.setItem('last_activity', now.toString());
  };

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initial activity update
    updateActivity();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user]);

  // Check for session timeout
  useEffect(() => {
    if (!user) return;

    const checkTimeout = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;
      
      if (timeSinceLastActivity >= SESSION_TIMEOUT) {
        console.log('🔒 Auto-logout due to 30 minutes of inactivity');
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkTimeout);
  }, [user, lastActivity]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
