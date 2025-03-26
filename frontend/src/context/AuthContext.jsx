import { createContext, useState, useContext, useEffect } from 'react';
import { authApi } from '../services/utils/auth';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const user = authApi.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      const data = await authApi.login(credentials);
      setCurrentUser(data.user);
      
      // Redirect based on user role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/clientdashboard');
      }
      
      return data;
    } catch (err) {
      // Updated error handling to capture more specific error messages
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const data = await authApi.register(userData);
      // Don't set current user on registration - just redirect to login
      // setCurrentUser(data.user);
      navigate('/login');
      return data;
    } catch (err) {
      // Updated error handling to capture more specific error messages
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setCurrentUser(null);
      navigate('/login');
    } catch (err) {
      console.error("Logout error:", err);
      // Still clear the user from context even if the API call fails
      setCurrentUser(null);
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};