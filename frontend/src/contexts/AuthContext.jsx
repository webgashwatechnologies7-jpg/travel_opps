import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { initPushNotifications, listenForForegroundMessages, removePushToken } from '../services/pushNotifications';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved auth data
    try {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading saved user:', error);
      // Clear invalid data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    } finally {
      // Always set loading to false after check
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribe = null;

    const registerPush = async () => {
      if (!user?.id) {
        return;
      }

      const prompted = localStorage.getItem('push_prompted');
      const result = await initPushNotifications({ prompt: !prompted });

      if (!prompted) {
        localStorage.setItem('push_prompted', 'true');
      }

      if (result?.permission === 'granted') {
        unsubscribe = listenForForegroundMessages();
      }
    };

    registerPush().catch((error) => {
      console.error('Push notification setup failed:', error);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?.id]);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      
      console.log('Login response:', response.data); // Debug log
      
      // Check if response structure is correct
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      // Backend returns: { success: true, data: { user: {...}, token: "..." } }
      const responseData = response.data.data;
      
      if (!responseData) {
        throw new Error('Invalid response data structure');
      }

      const token = responseData.token;
      const user = responseData.user;
      
      if (!token || !user) {
        console.error('Missing token or user:', { token: !!token, user: !!user });
        throw new Error('Invalid response data structure - missing token or user');
      }
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true };
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Login failed. Please check if backend server is running.';
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const logout = async () => {
    try {
      await removePushToken();
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

