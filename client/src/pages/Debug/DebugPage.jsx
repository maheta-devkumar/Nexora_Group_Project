// src/pages/Debug/DebugPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DebugPage = () => {
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const info = {
      localStorage: {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user'),
      },
      parsedUser: null,
      tokenPayload: null,
      isAdmin: false,
    };

    // Parse user
    try {
      if (info.localStorage.user) {
        info.parsedUser = JSON.parse(info.localStorage.user);
        info.isAdmin = info.parsedUser?.roles?.includes('admin') || false;
      }
    } catch (e) {
      info.userParseError = e.message;
    }

    // Parse token payload
    try {
      if (info.localStorage.token) {
        const payload = JSON.parse(atob(info.localStorage.token.split('.')[1]));
        info.tokenPayload = payload;
      }
    } catch (e) {
      info.tokenParseError = e.message;
    }

    setDebugInfo(info);
    console.log('🔍 DEBUG INFO:', info);
  }, []);

  const handleManualRedirect = (path) => {
    console.log(`🔄 Manual redirect to: ${path}`);
    navigate(path, { replace: true });
  };

  const clearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    console.log('🧹 Storage cleared');
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Debug Page</h1>
      
      <div style={{ margin: '20px 0' }}>
        <button onClick={() => handleManualRedirect('/admin/dashboard')} style={{ marginRight: '10px' }}>
          Try Admin Dashboard
        </button>
        <button onClick={() => handleManualRedirect('/')} style={{ marginRight: '10px' }}>
          Try Home Page
        </button>
        <button onClick={() => handleManualRedirect('/login')} style={{ marginRight: '10px' }}>
          Back to Login
        </button>
        <button onClick={clearStorage} style={{ backgroundColor: 'red', color: 'white' }}>
          Clear Storage
        </button>
      </div>

      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '5px' }}>
        <h3>LocalStorage Data:</h3>
        <pre>{JSON.stringify(debugInfo.localStorage, null, 2)}</pre>

        <h3>Parsed User:</h3>
        <pre>{JSON.stringify(debugInfo.parsedUser, null, 2)}</pre>

        <h3>Token Payload:</h3>
        <pre>{JSON.stringify(debugInfo.tokenPayload, null, 2)}</pre>

        <h3>Is Admin?: {debugInfo.isAdmin ? '✅ YES' : '❌ NO'}</h3>
      </div>
    </div>
  );
};

export default DebugPage;