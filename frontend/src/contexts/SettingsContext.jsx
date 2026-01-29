import { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

const SettingsContext = createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    sidebar_color1: '#2765B0',
    sidebar_color2: '#629DE5',
    dashboard_background_color: '#D8DEF5',
    header_background_color: '#D8DEF5',
  });
  const [loading, setLoading] = useState(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarOpen', JSON.stringify(newState));
      return newState;
    });
  };

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      if (response.data?.success && response.data?.data) {
        const raw = response.data.data;
        const obj = Array.isArray(raw)
          ? raw.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
          : raw;
        setSettings(prev => ({ ...prev, ...obj }));
      }
    } catch (error) {
      // Keep default values on error (/admin/settings may 500 with tenant error)
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await settingsAPI.update(newSettings);
      if (response.data?.success && response.data?.data) {
        setSettings(response.data.data);
        return { success: true };
      }
      return { success: false, message: response.data?.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update settings',
      };
    }
  };

  const resetSettings = async () => {
    try {
      const response = await settingsAPI.reset();
      if (response.data?.success && response.data?.data) {
        setSettings(response.data.data);
        return { success: true };
      }
      return { success: false, message: response.data?.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to reset settings',
      };
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      updateSettings,
      resetSettings,
      loadSettings,
      isSidebarOpen,
      toggleSidebar
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

