import React from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { LoginPage } from './LoginPage';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4F46E5] to-[#FFD700] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#2563EB] mx-auto mb-4"></div>
          <p className="text-black font-bold">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
};
