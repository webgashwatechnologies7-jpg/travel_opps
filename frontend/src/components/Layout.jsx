import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  CreditCard,
  MessageCircle,
  Mail,
  BarChart3,
  Megaphone,
  Receipt,
  Globe,
  Shield,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  List,
  Grid,
  Bell,
  Settings,
  ChevronDown as ChevronDownIcon,
  Plane,
  Hotel,
  Menu,
  ChevronLeft,
  Users,
  Phone,
  ClipboardList,
  Package
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { settingsAPI, menuAPI } from '../services/api';

// Icon name (from API) -> Lucide component for dynamic menu
const MENU_ICON_MAP = {
  LayoutDashboard,
  MessageSquare,
  FileText,
  CreditCard,
  MessageCircle,
  Mail,
  BarChart3,
  Megaphone,
  Receipt,
  Settings,
  Grid,
  Users,
  Phone,
  ClipboardList,
  Package,
};

const Layout = ({ children, Header,padding=0 }) => {
  const { user, logout } = useAuth();
  const { settings, isSidebarOpen, toggleSidebar } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({
    reports: false,
    masters: false,
    settings: false,
    marketing: false
  });

  // Dynamic sidebar menu (from API, fallback to default)
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
    { path: '/call-management', label: 'Call Management System', icon: 'Phone' },
    { path: '/followups', label: 'Followups', icon: 'ClipboardList' },
    staffManagementItem,
    { label: 'Reports', icon: 'BarChart3', submenu: [{ path: '/dashboard/employee-performance', label: 'Performance' }, { path: '/dashboard/source-roi', label: 'Source ROI' }, { path: '/dashboard/destination-performance', label: 'Destination' }] },
    { label: 'Marketing', icon: 'Megaphone', submenu: [{ path: '/marketing', label: 'Dashboard' }, { path: '/client-groups', label: 'Clients Group' }, { path: '/marketing/templates', label: 'Email Templates' }, { path: '/marketing/whatsapp-templates', label: 'WhatsApp Templates' }, { path: '/marketing/email-campaigns', label: 'Campaigns' }, { path: '/marketing/landing-pages', label: 'Landing Pages' }] },
    { label: 'Settings', icon: 'Settings', submenu: [{ path: '/settings', label: 'Settings' }, { path: '/settings/whatsapp', label: 'WhatsApp Integration' }, { path: '/settings/mail', label: 'Email Integration' }, { path: '/email-templates', label: 'Email Templates' }, { path: '/settings/terms-conditions', label: 'Terms & Conditions' }, { path: '/settings/policies', label: 'Policies' }, { path: '/settings/account-details', label: 'Account Details' }, { path: '/settings/logo', label: 'Logo' }] },
    { label: 'Masters', icon: 'Grid', submenu: [{ path: '/masters/suppliers', label: 'Suppliers' }, { path: '/masters/hotel', label: 'Hotel' }, { path: '/masters/activity', label: 'Activity' }, { path: '/masters/transfer', label: 'Transfer' }, { path: '/masters/day-itinerary', label: 'Day Itinerary' }, { path: '/masters/destinations', label: 'Destinations' }, { path: '/masters/room-type', label: 'Room Type' }, { path: '/masters/meal-plan', label: 'Meal Plan' }, { path: '/masters/lead-source', label: 'Lead Source' }, { path: '/masters/expense-type', label: 'Expense Type' }, { path: '/masters/package-theme', label: 'Package Theme' }, { path: '/masters/currency', label: 'Currency' }, { path: '/users', label: 'Users' }, { path: '/targets', label: 'Targets' }, { path: '/permissions', label: 'Permissions' }] },
  ];
  const [menuItems, setMenuItems] = useState(defaultMenuItems);

  // Ensure Settings submenu has WhatsApp & Email Integration (company admin flow)
  const ensureSettingsIntegrationItems = (menu) => {
    return menu.map((item) => {
      if (item.label === 'Settings' && item.submenu && Array.isArray(item.submenu)) {
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
        return { ...item, submenu: sub };
      }
      return item;
    });
  };

  useEffect(() => {
    menuAPI.get()
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          let apiMenu = [...res.data.data];
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
          setMenuItems(apiMenu);
        }
      })
      .catch(() => { /* keep default */ });
  }, []);

  // Check if user is Admin
  const isAdmin = user?.role === 'Admin' || user?.roles?.some(role => role.name === 'Admin') || false;

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserDropdownOpen && !event.target.closest('.user-dropdown')) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserDropdownOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isSubmenuActive = (paths) => paths.some(path => location.pathname === path);

  const toggleSubmenu = (submenu) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [submenu]: !prev[submenu]
    }));
  };

  // Fetch company logo (404 when no logo is set is expected)
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await settingsAPI.getByKey('company_logo');
        if (response.data?.success && response.data?.data?.value) {
          setCompanyLogo(response.data.data.value);
        }
      } catch {
        // Use default (no logo) on any error
      }
    };
    fetchLogo();
  }, []);

  // Refresh logo when navigating to logo settings page
  useEffect(() => {
    if (location.pathname === '/settings/logo') {
      const fetchLogo = async () => {
        try {
          const response = await settingsAPI.getByKey('company_logo');
          if (response.data?.success && response.data?.data?.value) {
            setCompanyLogo(response.data.data.value);
          }
        } catch (err) {
          if (err?.response?.status !== 404) {
            console.error('Failed to fetch company logo:', err);
          }
        }
      };
      fetchLogo();
    }
  }, [location.pathname]);

  // Auto-open submenus when their items are active (derived from dynamic menuItems)
  useEffect(() => {
    setOpenSubmenus(prev => {
      const next = { ...prev };
      menuItems.forEach((item) => {
        if (item.submenu && item.label) {
          const key = item.label.toLowerCase();
          const paths = item.submenu.map(sm => sm.path);
          if (paths.some(path => location.pathname === path)) {
            next[key] = true;
          }
        }
      });
      return next;
    });
  }, [location.pathname, menuItems]);

  if (!Header) {
    Header = () => {
      return (
        <div
  className={`header-bar fixed top-0 z-10 right-0 left-0
  px-3 sm:px-4 lg:px-6
  py-2 lg:py-3
  h-auto lg:h-16
  transition-all duration-300
  ${isSidebarOpen ? 'lg:left-64' : 'lg:left-20'}`}
  style={{ backgroundColor: settings?.header_background_color || '#D8DEF5' }}
>
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 h-full">

    {/* LEFT SECTION */}
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">

      {/* Search */}
      <div className="relative flex-1 max-w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 h-4 w-4" />
        <input
          type="text"
          placeholder="Q Search"
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Controls (scrollable on mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto sm:overflow-visible">
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-400 rounded-lg text-sm hover:bg-gray-100 text-gray-700 whitespace-nowrap">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>

        <button className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-400 rounded-lg text-sm hover:bg-gray-100 text-gray-700 whitespace-nowrap">
          Select
          <ChevronDownIcon className="h-4 w-4" />
        </button>

        <div className="flex items-center bg-white border border-gray-400 rounded-lg p-1">
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <List className="h-4 w-4 text-gray-700" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded">
            <Grid className="h-4 w-4 text-gray-700" />
          </button>
        </div>
      </div>
    </div>

    {/* RIGHT SECTION */}
    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">

      {/* Action buttons */}
      <div className="flex gap-2 w-full sm:w-auto">
        <button className="flex-1 sm:flex-none px-3 py-2 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-800 flex items-center justify-center gap-2 font-medium">
          <Plane className="h-4 w-4" />
          <span className="hidden sm:inline">Flight Search</span>
        </button>

        <button className="flex-1 sm:flex-none px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 flex items-center justify-center gap-2 font-medium">
          <Hotel className="h-4 w-4" />
          <span className="hidden sm:inline">Hotel Search</span>
        </button>
      </div>

      {/* Icons */}
      <button className="p-2 text-gray-700 hover:bg-gray-400 rounded-lg">
        <Bell className="h-5 w-5" />
      </button>

      {isAdmin && (
        <Link to="/settings" className="p-2 text-gray-700 hover:bg-gray-400 rounded-lg">
          <Settings className="h-5 w-5" />
        </Link>
      )}

      {/* User */}
      <div className="relative">
        <button
          onClick={toggleUserDropdown}
          className="flex items-center gap-2 pl-3 border-l border-gray-500 hover:bg-gray-200 rounded-lg px-2 py-1"
        >
          <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <span className="hidden sm:block text-sm font-medium text-gray-800">
            {user?.name || 'Admin User'}
          </span>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-700 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isUserDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex gap-2"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>

  </div>
</div>

      )
    }
  }
  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Sidebar Wrapper - Toggleable Desktop */}
      <div
        className={`sidebar-wrapper fixed inset-y-0 left-0 z-10 transition-all duration-300 hidden lg:block ${isSidebarOpen ? 'w-64' : 'w-20'}`}
        style={{
          boxShadow: '2px 0 20px rgba(0, 0, 0, 0.2)'
        }}>
        {/* Sidebar - Dynamic Color */}
        <div className="w-full h-full shadow-lg" style={{ background: `linear-gradient(${settings?.sidebar_color1} 20% , ${settings?.sidebar_color2})` }}>
          <div className="flex flex-col h-full">
            {/* Logo and Toggle Button */}
            <div className="p-4 border-b border-blue-800/50 flex items-center justify-between">
              <div className="flex items-center justify-start flex-1">
                {companyLogo ? (
                  <>
                    <img
                      src={companyLogo}
                      alt="Company Logo"
                      className={`h-8 object-contain transition-all duration-300 ${isSidebarOpen ? 'opacity-100 max-w-[180px]' : 'opacity-100 w-8'}`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.nextSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="hidden flex items-center">
                      <h1 className="text-xl font-bold text-white">T</h1>
                      <span className={`ml-3 text-white font-semibold whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>TravelOps</span>
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="text-xl font-bold text-white">T</h1>
                    <span className={`ml-3 text-white font-semibold whitespace-nowrap transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>TravelOps</span>
                  </>
                )}
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-blue-800/50 transition-colors text-white"
                title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
              >
                {isSidebarOpen ? (
                  <ChevronLeft className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
              {menuItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
                if (item.submenu) {
                  const Icon = MENU_ICON_MAP[item.icon] || FileText;
                  const submenuKey = item.label.toLowerCase();
                  const isSubmenuOpen = openSubmenus[submenuKey];
                  const hasActiveSubmenu = isSubmenuActive(item.submenu.map(sm => sm.path));
                  return (
                    <div key={item.label} className="relative">
                      <button
                        onClick={() => toggleSubmenu(submenuKey)}
                        className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors relative ${hasActiveSubmenu
                          ? 'bg-[#3b82f6] text-white'
                          : 'text-blue-100 hover:bg-blue-800/50'
                          }`}
                      >
                        <Icon className="h-6 w-6 flex-shrink-0 text-white" />
                        <span className={`ml-3 text-sm font-medium whitespace-nowrap text-white transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                          {item.label}
                        </span>
                        <ChevronDown className={`ml-auto h-4 w-4 text-white transition-all duration-200 ${isSubmenuOpen ? 'rotate-180' : ''} ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`} />
                      </button>
                      {isSubmenuOpen && isSidebarOpen && (
                        <div className="ml-2 mt-1 space-y-1">
                          {item.submenu.map((subItem) => {
                            const isSubActive = isActive(subItem.path);
                            return (
                              <div key={subItem.path} className="relative">
                                <Link
                                  to={subItem.path}
                                  className={`flex items-center px-2 py-2 rounded-lg transition-colors ${isSubActive
                                    ? 'bg-[#3b82f6] text-white'
                                    : 'text-blue-200 hover:bg-blue-800/50'
                                    }`}
                                >
                                  <span className="text-xs mr-2">•</span>
                                  <span className="text-sm">{subItem.label}</span>
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  const Icon = MENU_ICON_MAP[item.icon] || FileText;
                  const active = isActive(item.path);
                  return (
                    <div key={item.path} className="relative">
                      <Link
                        to={item.path}
                        className={`flex items-center px-3 py-3 rounded-lg transition-colors relative ${active
                          ? 'bg-[#3b82f6] text-white'
                          : 'text-blue-100 hover:bg-blue-800/50'
                          }`}
                      >
                        <Icon className="h-6 w-6 flex-shrink-0 text-white" />
                        <span className={`ml-3 text-sm font-medium whitespace-nowrap text-white transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                          {item.label}
                        </span>
                      </Link>
                    </div>
                  );
                }
              })}
            </nav>

          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileSidebarOpen(false)}>
          <div
            className={`absolute inset-y-0 left-0 w-64 shadow-2xl transform transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ background: `linear-gradient(${settings?.sidebar_color1 || '#1e3a8a'} 20% , ${settings?.sidebar_color2 || '#172554'})` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Mobile Sidebar Header */}
              <div className="p-4 border-b border-blue-800/50 flex items-center justify-between">
                <div className="flex items-center">
                  {companyLogo ? (
                    <img src={companyLogo} alt="Logo" className="h-8 object-contain max-w-[140px]" />
                  ) : (
                    <span className="text-white font-bold text-xl">TravelOps</span>
                  )}
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-2 text-white hover:bg-white/10 rounded-lg"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {menuItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
                  if (item.submenu) {
                    const Icon = MENU_ICON_MAP[item.icon] || FileText;
                    const submenuKey = item.label.toLowerCase();
                    const isSubmenuOpen = openSubmenus[submenuKey];

                    return (
                      <div key={item.label}>
                        <button
                          onClick={() => toggleSubmenu(submenuKey)}
                          className="w-full flex items-center px-3 py-3 rounded-lg text-blue-100 hover:bg-blue-800/50"
                        >
                          <Icon className="h-6 w-6 flex-shrink-0 text-white" />
                          <span className="ml-3 text-sm font-medium text-white flex-1 text-left">{item.label}</span>
                          <ChevronDown className={`h-4 w-4 text-white transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isSubmenuOpen && (
                          <div className="ml-4 mt-1 space-y-1 border-l border-blue-700/50 pl-2">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className={`flex items-center px-2 py-2 rounded-lg text-sm ${isActive(subItem.path) ? 'text-white bg-blue-600' : 'text-blue-200 hover:text-white'}`}
                              >
                                <span>{subItem.label}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    const Icon = MENU_ICON_MAP[item.icon] || FileText;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`flex items-center px-3 py-3 rounded-lg transition-colors ${isActive(item.path) ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-blue-800/50'}`}
                      >
                        <Icon className="h-6 w-6 flex-shrink-0 text-white" />
                        <span className="ml-3 text-sm font-medium text-white">{item.label}</span>
                      </Link>
                    );
                  }
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-40 flex items-center justify-around px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {[
          { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
          { icon: MessageSquare, label: 'Queries', path: '/leads' },
          { icon: FileText, label: 'Itinerary', path: '/itineraries' },
          { icon: CreditCard, label: 'Accounts', path: '/payments' },
          { icon: Menu, label: 'Menu', action: () => setIsMobileSidebarOpen(true) }
        ].map((tab, idx) => {
          const Icon = tab.icon;
          const isActiveTab = location.pathname === tab.path;
          return (
            <button
              key={idx}
              onClick={() => tab.action ? tab.action() : navigate(tab.path)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all w-16 ${isActiveTab ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActiveTab ? 'fill-blue-600/10' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Content */}
      <div
        className={`main-content transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} ml-0 pb-20 lg:pb-0`}
      >
        {/* Header Bar - Dynamic Background */}
        <div style={{padding:`${padding}px ${padding}px 0px ${padding}px`,backgroundColor: padding > 0 && settings?.dashboard_background_color}}>
          {Header && <Header />}
        </div>

        {/* Content Area */}
        <div className="pt-16" style={{ backgroundColor: settings?.dashboard_background_color || '#D8DEF5' }}>
          <div className="p-4 pb-0 md:p-6 md:pb-0 lg:p-8 lg:pb-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;