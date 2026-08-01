import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        try {
          // Verify session validity with active profile endpoint
          const profile = await authService.getProfile();
          setUser({
            ...currentUser,
            ...profile,
          });
        } catch (error) {
          console.error("Session token validation failed", error);
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      setUser(data);
      return data;
    } catch (error) {
      authService.logout();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authService.register(userData);
      setUser(data);
      return data;
    } catch (error) {
      authService.logout();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isFarmer: user?.role === 'ROLE_FARMER' || user?.role === 'FARMER'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
