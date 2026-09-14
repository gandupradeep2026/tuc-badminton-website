import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeFetchJson } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('badminton_student_token') || sessionStorage.getItem('tuc_student_token') || '';
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('badminton_student_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [playerProfile, setPlayerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  // Sync token to api requests
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    // Verify token with backend
    safeFetchJson('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-student-token': token,
      }
    })
      .then(res => {
        if (res.ok && res.data?.authenticated) {
          setUser(res.data.user);
          setPlayerProfile(res.data.playerProfile || null);
          localStorage.setItem('badminton_student_user', JSON.stringify(res.data.user));
        } else {
          // Token invalid or expired
          setToken('');
          setUser(null);
          setPlayerProfile(null);
          localStorage.removeItem('badminton_student_token');
          localStorage.removeItem('badminton_student_user');
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const login = (loginData) => {
    const sessionToken = loginData.token;
    const userData = loginData.user;
    const profile = loginData.playerProfile || null;

    setToken(sessionToken);
    setUser(userData);
    setPlayerProfile(profile);

    localStorage.setItem('badminton_student_token', sessionToken);
    localStorage.setItem('badminton_student_user', JSON.stringify(userData));
    // Also keep legacy sessionStorage for backwards compatibility
    sessionStorage.setItem('tuc_student_token', sessionToken);
    sessionStorage.setItem('tuc_student_email', userData.email);

    setIsEntryModalOpen(false);
  };

  const logout = async () => {
    try {
      await safeFetchJson('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-student-token': token,
        }
      });
    } catch (e) {}

    setToken('');
    setUser(null);
    setPlayerProfile(null);
    localStorage.removeItem('badminton_student_token');
    localStorage.removeItem('badminton_student_user');
    sessionStorage.removeItem('tuc_student_token');
    sessionStorage.removeItem('tuc_student_email');
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await safeFetchJson('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-student-token': token,
        }
      });
      if (res.ok && res.data?.authenticated) {
        setUser(res.data.user);
        setPlayerProfile(res.data.playerProfile || null);
        localStorage.setItem('badminton_student_user', JSON.stringify(res.data.user));
      }
    } catch (e) {}
  };

  const openEntryModal = () => setIsEntryModalOpen(true);
  const closeEntryModal = () => setIsEntryModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        playerProfile,
        isAuthenticated: !!token && !!user,
        loading,
        isEntryModalOpen,
        openEntryModal,
        closeEntryModal,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
