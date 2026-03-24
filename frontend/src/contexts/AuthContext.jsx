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
    // Check for saved auth data (sessionStorage = session ends when browser/tab closes)
    try {
      const token = sessionStorage.getItem('auth_token');
      const savedUser = sessionStorage.getItem('user');
      
      if (token && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading saved user:', error);
      // Clear invalid data
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
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

    registerPush().then((result) => {
      if (result?.reason === 'missing_config' || result?.reason === 'missing_vapid_key') {
        console.warn('Push notifications disabled:', result.reason, '- Add Firebase env vars (VITE_FIREBASE_*) and VITE_FIREBASE_VAPID_KEY in frontend .env');
      }
    }).catch((error) => {
      console.error('Push notification setup failed:', error);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?.id]);

  // Handle auto-logout on 5-minute inactivity
  useEffect(() => {
    if (!user) return;

    let timeout;
    const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

    const resetTimer = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        console.warn('Inactivity detected (5m). Auto-logging out...');
        logout();
        // Optional: Notify user they were logged out due to inactivity
        if (typeof window !== 'undefined') {
          window.location.href = '/login?reason=inactivity';
        }
      }, INACTIVITY_LIMIT);
    };

    // Events to track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Setup event listeners
    const setupHandlers = () => {
      events.forEach((event) => {
        window.addEventListener(event, resetTimer);
      });
    };

    const removeHandlers = () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };

    // Initial start
    setupHandlers();
    resetTimer();

    // Pulse activity to backend on initial load if logged in 
    // to ensure last_seen_at is reasonably fresh
    if (user) {
      authAPI.profile().catch(() => {});
    }

    return () => {
      if (timeout) clearTimeout(timeout);
      removeHandlers();
    };
  }, [user?.id]);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);

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
      
      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { success: true, user };
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
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
      setUser(null);
    }
  };

  const updateUser = (userData) => {
    const newUser = { ...user, ...userData };
    sessionStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

