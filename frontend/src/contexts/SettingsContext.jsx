import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { settingsAPI, menuAPI, currenciesAPI } from '../services/api';

const SettingsContext = createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();

  // Initialize settings from localStorage if available to prevent flash of default content
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    const defaultSettings = {
      sidebar_color1: '#2765B0',
      sidebar_color2: '#629DE5',
      dashboard_background_color: '#D8DEF5',
      header_background_color: '#D8DEF5',
    };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('primaryCurrency');
    return saved ? JSON.parse(saved) : { name: 'INR', symbol: '₹' };
  });

  const [loading, setLoading] = useState(true);

  // Sidebar Menu State
  const [openSubmenus, setOpenSubmenus] = useState({});

  const staffManagementItem = {
    label: 'Staff Management',
    icon: 'Users',
    submenu: [
      { path: '/staff-management/dashboard', label: 'Dashboard' },
      { path: '/staff-management/users', label: 'All Users' },
      { path: '/staff-management/teams', label: 'All Team' },
      { path: '/staff-management/roles', label: 'All Role' },
      { path: '/staff-management/branches', label: 'All Branch' },
    ],
  };

  const defaultMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    { path: '/leads', label: 'Queries', icon: 'MessageSquare' },
    { path: '/itineraries', label: 'Itineraries', icon: 'FileText' },
    { path: '/payments', label: 'Payments', icon: 'CreditCard' },
    { path: '/sales-reps', label: 'Sales Reps', icon: 'Users' },
    { label: 'Accounts', icon: 'CreditCard', submenu: [{ path: '/accounts/clients', label: 'Clients' }, { path: '/accounts/agents', label: 'Agents' }, { path: '/accounts/corporate', label: 'Corporate' }] },
    { path: '/whatsapp', label: 'WhatsApp', icon: 'MessageCircle' },
    { path: '/mail', label: 'Mail', icon: 'Mail' },
    { label: 'Integrate', icon: 'Link2', submenu: [{ path: '/settings/mail', label: 'Email Integration' }, { path: '/settings/whatsapp', label: 'WhatsApp Integration' }] },
    { path: '/call-management', label: 'Call Management System', icon: 'Phone' },
    { path: '/followups', label: 'Followups', icon: 'ClipboardList' },
    staffManagementItem,
    { label: 'Reports', icon: 'BarChart3', submenu: [{ path: '/dashboard/employee-performance', label: 'Performance' }, { path: '/dashboard/source-roi', label: 'Source ROI' }, { path: '/dashboard/destination-performance', label: 'Destination' }] },
    { label: 'Marketing', icon: 'Megaphone', submenu: [{ path: '/marketing', label: 'Dashboard' }, { path: '/client-groups', label: 'Clients Group' }, { path: '/marketing/templates', label: 'Email Templates' }, { path: '/marketing/whatsapp-templates', label: 'WhatsApp Templates' }, { path: '/marketing/email-campaigns', label: 'Campaigns' }, { path: '/marketing/landing-pages', label: 'Landing Pages' }] },
    { label: 'Company Settings', icon: 'Settings', submenu: [{ path: '/settings/company', label: 'Company Settings' }, { path: '/settings/whatsapp', label: 'WhatsApp Integration' }, { path: '/settings/mail', label: 'Email Integration' }, { path: '/email-templates', label: 'Email Templates' }, { path: '/settings/account-details', label: 'Account Details' }] },
    { label: 'Masters', icon: 'Grid', submenu: [{ path: '/masters/suppliers', label: 'Suppliers' }, { path: '/masters/hotel', label: 'Hotel' }, { path: '/masters/activity', label: 'Activity' }, { path: '/masters/transfer', label: 'Transfer' }, { path: '/masters/day-itinerary', label: 'Day Itinerary' }, { path: '/masters/destinations', label: 'Destinations' }, { path: '/masters/room-type', label: 'Room Type' }, { path: '/masters/meal-plan', label: 'Meal Plan' }, { path: '/masters/lead-source', label: 'Lead Source' }, { path: '/masters/expense-type', label: 'Expense Type' }, { path: '/masters/package-theme', label: 'Package Theme' }, { path: '/masters/currency', label: 'Currency' }, { path: '/masters/points', label: 'Inclusions & Exclusions' }, { path: '/users', label: 'Users' }, { path: '/targets', label: 'Targets' }, { path: '/permissions', label: 'Permissions' }] },
  ];

  const [rawMenuItems, setRawMenuItems] = useState(defaultMenuItems);
  const [menuItems, setMenuItems] = useState(defaultMenuItems);

  const toggleSubmenu = (key) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const ensureSettingsIntegrationItems = (menu) => {
    return menu.map((item) => {
      if (item.label === 'Company Settings' && item.submenu && Array.isArray(item.submenu)) {
        const sub = [...item.submenu];
        const hasWhatsApp = sub.some((s) => s.path === '/settings/whatsapp');
        const hasEmail = sub.some((s) => s.path === '/settings/mail');
        let insertAt = 1;
        if (!hasWhatsApp) {
          sub.splice(insertAt++, 0, { path: '/settings/whatsapp', label: 'WhatsApp Integration' });
        }
        if (!hasEmail) {
          sub.splice(insertAt++, 0, { path: '/settings/mail', label: 'Email Integration' });
        }

        // Remove 'Terms & Conditions' and 'Policies' as they are now in Masters
        return {
          ...item,
          submenu: sub.filter(s =>
            s.path !== '/settings/terms-conditions' &&
            s.path !== '/settings/policies'
          )
        };
      }
      return item;
    });
  };

  // Load Menu Structure from API
  useEffect(() => {
    menuAPI.get()
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          let apiMenu = [...res.data.data];

          // Rename 'Settings' to 'Company Settings' and clean/update its submenu
          apiMenu = apiMenu.map(item => {
            if (item.label === 'Settings' || item.label === 'Company Settings') {
              const newItem = { ...item, label: 'Company Settings' };
              if (newItem.submenu && Array.isArray(newItem.submenu)) {
                // Remove 'Logo' item if present
                newItem.submenu = newItem.submenu.filter(sub =>
                  sub.label !== 'Logo' && sub.path !== '/settings/logo'
                );
                // Rename 'Settings' child to 'Company Settings' to match parent
                newItem.submenu = newItem.submenu.map(sub =>
                  sub.label === 'Settings' ? { ...sub, label: 'Company Settings' } : sub
                );
              }
              return newItem;
            }
            return item;
          });

          const hasStaff = apiMenu.some(
            (item) => item.label === 'Staff Management' || item.path === '/staff-management'
          );
          if (!hasStaff) {
            const reportsIndex = apiMenu.findIndex((item) => item.label === 'Reports');
            if (reportsIndex >= 0) {
              apiMenu.splice(reportsIndex, 0, staffManagementItem);
            } else {
              apiMenu.push(staffManagementItem);
            }
          }
          apiMenu = ensureSettingsIntegrationItems(apiMenu);

          // Ensure 'Terms & Points' is in Masters
          apiMenu = apiMenu.map(item => {
            if (item.label === 'Masters' && item.submenu) {
              const hasPoints = item.submenu.some(s => s.path === '/masters/points');
              if (!hasPoints) {
                return {
                  ...item,
                  submenu: [...item.submenu, { path: '/masters/points', label: 'Inclusions & Exclusions' }]
                };
              }
            }
            return item;
          });

          setRawMenuItems(apiMenu);
        }
      })
      .catch(() => { /* keep default */ });
  }, []);

  // Filter Menu based on Permissions
  useEffect(() => {
    if (!user) {
      // If no user (e.g. login page), clear menu
      setMenuItems([]);
      return;
    }

    // Admins see everything
    const isAdmin = user.is_super_admin || user.roles?.some(r => r === 'Admin' || r === 'Company Admin' || r === 'Super Admin');
    if (isAdmin) {
      setMenuItems(rawMenuItems);
      return;
    }

    const userPermissions = (user.permissions || []).map(p => p.toLowerCase());

    // Helper to check if item is allowed
    const isAllowed = (item) => {
      // ALWAYS allow Dashboard
      if (item.label === 'Dashboard') return true;

      const label = item.label.toLowerCase();

      // Flexible matching: check if any permission string is contained in label or label in permission string.
      // This handles cases like "Activities" permission matching "Activity" menu item, or vice-versa.
      return userPermissions.some(p => p.includes(label) || label.includes(p));
    };

    const filterMenu = (items) => {
      return items.reduce((acc, item) => {
        const newItem = { ...item }; // Create a shallow copy to avoid direct mutation of rawMenuItems

        if (newItem.submenu) {
          const filteredSub = filterMenu(newItem.submenu);
          if (filteredSub.length > 0) {
            newItem.submenu = filteredSub;
            acc.push(newItem);
          } else {
            // If a parent has no permitted children, it should only be shown if it's a direct link AND allowed
            if (newItem.path && isAllowed(newItem)) {
              acc.push(newItem);
            }
            // If it's just a folder (no path) and no children are allowed, hide it.
          }
        } else {
          if (isAllowed(newItem)) {
            acc.push(newItem);
          }
        }
        return acc;
      }, []);
    };

    // Deep copy rawMenuItems to ensure no mutation side effects on the original state
    const deepCopiedMenu = JSON.parse(JSON.stringify(rawMenuItems));
    const filtered = filterMenu(deepCopiedMenu);
    setMenuItems(filtered);

  }, [user, rawMenuItems]);

  /* Sidebar Toggle State */
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarOpen', JSON.stringify(newState));
      return newState;
    });
  };

  useEffect(() => {
    // Apply favicon from localStorage/initial state immediately to prevent flicker
    if (settings?.company_favicon) {
      const faviconEl = document.getElementById('favicon');
      if (faviconEl) {
        faviconEl.href = settings.company_favicon;
      }
    }
    loadSettings();
    loadPrimaryCurrency();
  }, []);

  const loadPrimaryCurrency = async () => {
    try {
      const res = await currenciesAPI.list();
      if (res.data?.success && Array.isArray(res.data.data)) {
        const primary = res.data.data.find(c => c.is_primary);
        if (primary) {
          setCurrency(primary);
          localStorage.setItem('primaryCurrency', JSON.stringify(primary));
        }
      }
    } catch (err) {
      console.error('Failed to load primary currency:', err);
    }
  };

  const loadSettings = async () => {
    try {
      // Fetch settings from settings table
      const response = await settingsAPI.getAll();

      // Fetch company details from companies table
      const companyResponse = await settingsAPI.getCompany();

      if (response.data?.success && response.data?.data) {
        const raw = response.data.data;
        const obj = Array.isArray(raw)
          ? raw.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
          : raw;

        // Merge company logo and favicon from companies table
        if (companyResponse.data?.success && companyResponse.data?.data) {
          const company = companyResponse.data.data;
          obj.company_logo = company.logo; // Override with companies table logo
          obj.company_name = company.name;
          obj.company_favicon = company.favicon;

          // Apply favicon to browser tab
          if (company.favicon) {
            const faviconEl = document.getElementById('favicon');
            if (faviconEl) {
              faviconEl.href = company.favicon;
            }
          }
        }

        setSettings(prev => {
          const newSettings = { ...prev, ...obj };
          localStorage.setItem('appSettings', JSON.stringify(newSettings));
          return newSettings;
        });
      }
    } catch (error) {
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      // Optimistically update local state immediately
      setSettings(prev => {
        const next = { ...prev, ...newSettings };
        localStorage.setItem('appSettings', JSON.stringify(next));
        return next;
      });

      const response = await settingsAPI.update(newSettings);
      if (response.data?.success && response.data?.data) {
        // Confirm with server response
        // Note: The API response format might need to be handled if it returns array vs object
        // For now relying on optimistic update unless we want to re-fetch
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
      loadSettings,
      isSidebarOpen,
      toggleSidebar,
      menuItems,
      openSubmenus,
      setOpenSubmenus,
      toggleSubmenu,
      currency,
      loadPrimaryCurrency
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

