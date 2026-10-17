// frontend/src/components/AuthDebug.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthDebug = () => {
  const { user, token, isAuthenticated, isLoading, serverStatus } = useAuth();

  if (process.env.NODE_ENV === 'production') {
    return null; // Hide in production
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '350px',
      fontFamily: 'monospace',
      border: '2px solid #00ff00'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#00ff00' }}>🔐 AUTH DEBUG</h4>
      <div style={{ marginBottom: '5px' }}>
        <strong>Status:</strong> {isAuthenticated ? '✅ AUTHENTICATED' : '❌ NOT AUTHENTICATED'}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>Loading:</strong> {isLoading ? '⏳ YES' : '✅ NO'}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>Server:</strong> {serverStatus === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE'}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>User:</strong> {user ? user.email : 'None'}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>User ID:</strong> {user ? user.user_id : 'None'}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>Token:</strong> {token ? '✅ Present' : '❌ Missing'}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>LocalStorage Token:</strong> {localStorage.getItem('authToken') ? '✅ Yes' : '❌ No'}
      </div>
      <div style={{ marginBottom: '5px' }}>
        <strong>LocalStorage User:</strong> {localStorage.getItem('user') ? '✅ Yes' : '❌ No'}
      </div>
      <button 
        onClick={() => {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.reload();
        }}
        style={{
          background: '#ff4444',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px',
          fontSize: '10px'
        }}
      >
        Clear Storage & Reload
      </button>
    </div>
  );
};

export default AuthDebug;