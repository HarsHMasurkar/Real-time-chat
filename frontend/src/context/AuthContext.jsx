import { createContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socketService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        connectSocket(token);
      } catch (requestError) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      connectSocket(token);
      return;
    }

    disconnectSocket();
  }, [token]);

  const authenticate = async (endpoint, payload) => {
    setError('');
    const response = await api.post(`/auth/${endpoint}`, payload);
    const { user: authenticatedUser, accessToken, refreshToken } = response.data;

    localStorage.setItem('authToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setToken(accessToken);
    setUser(authenticatedUser);
    connectSocket(accessToken);

    return authenticatedUser;
  };

  const login = (payload) => authenticate('login', payload);

  const register = (payload) => authenticate('register', payload);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (requestError) {
      // Ignore logout failures and clear local state regardless.
    } finally {
      disconnectSocket();
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      setError,
      login,
      register,
      logout,
      setUser,
      refreshUser: async () => {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        return response.data.user;
      },
    }),
    [user, token, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
