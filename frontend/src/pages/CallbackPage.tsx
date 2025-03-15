import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CallbackPage: React.FC = () => {
  const { handleAuthCallback } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    handleAuthCallback(params);
    navigate('/dashboard');
  }, [handleAuthCallback, navigate, location]);
  
  return (
    <div className="callback-page">
      <p>驗證中，請稍候...</p>
    </div>
  );
};

export default CallbackPage;
