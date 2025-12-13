import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const DebugUser: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 10, 
      right: 10, 
      background: 'white', 
      padding: '10px', 
      border: '2px solid red',
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <h3 style={{ margin: 0, marginBottom: '5px' }}>Debug User Info:</h3>
      <pre style={{ margin: 0, fontSize: '10px' }}>
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  );
};
