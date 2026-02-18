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
  Link2,
  BarChart3,
  Megaphone,
  Receipt,
  Globe,
  Shield,
  ChevronDown,
  ChevronRight,
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
  Package,
  LogOut
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { settingsAPI, menuAPI } from '../services/api';
import { toast } from 'react-toastify';

// Icon name (from API) -> Lucide component for dynamic menu
const MENU_ICON_MAP = {
  LayoutDashboard,
  MessageSquare,
  FileText,
  CreditCard,
  MessageCircle,
  Mail,
  Link2,
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

const Layout = ({ children, Header, padding = 0 }) => {
  const { user, logout } = useAuth();
  const { settings, isSidebarOpen, toggleSidebar, menuItems, openSubmenus, setOpenSubmenus, toggleSubmenu } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const checkFeatureAccess = (feature) => {
    if (!feature || user?.is_super_admin) return true;

    const features = user?.plan_features || {};
    const isEnabled = features[feature]?.enabled === true;

    if (!isEnabled) {
      toast.info(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-lg">Plan Upgrade Required</span>
          <span className="text-sm">This feature is not included in your current plan. Please upgrade your plan to access this feature.</span>
        </div>,
        {
          position: "top-center",
          autoClose: 5000,
          theme: "colored",
          style: { backgroundColor: '#1e3a8a' },
          toastId: 'feature-restricted'
        }
      );
      return false;
    }
    return true;
  };

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

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isSubmenuActive = (paths) => paths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));



  // Auto-open submenus when their items are active (derived from dynamic menuItems)
  useEffect(() => {
    setOpenSubmenus(prev => {
      // Reset state to ensure only relevant submenus are open
      const next = {};
      menuItems.forEach((item) => {
        if (item.submenu && item.label) {
          const key = item.label.toLowerCase();
          const paths = item.submenu.map(sm => sm.path);
          if (paths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'))) {
            next[key] = true;
          }
        }
      });
      return next;
    });
  }, [location.pathname, menuItems]);

  // Global GlobalHeader Component
  const GlobalHeader = () => (
    <div
      className={`header-bar fixed top-0 z-10 right-0 left-0
px-3 sm:px-4 lg:px-6
py-2 lg:py-3
min-h-14 lg:min-h-16 lg:h-16
transition-all duration-300
${isSidebarOpen ? 'lg:left-64' : 'lg:left-20'}`}
      style={{ backgroundColor: settings?.header_background_color || settings?.dashboard_background_color || '#D8DEF5' }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-3 h-full">

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
              <div className="user-dropdown absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/settings/subscription"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Subscription Plan
                  </Link>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex gap-2 border-t"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
  const bgColor = settings?.dashboard_background_color || '#D8DEF5';
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: bgColor }}>
      {/* Sidebar Wrapper - Toggleable Desktop */}
      <div
        className={`sidebar-wrapper fixed inset-y-0 left-0 z-10 transition-all duration-300 hidden lg:block ${isSidebarOpen ? 'w-64' : 'w-20'}`}
        style={{
          boxShadow: '2px 0 20px rgba(0, 0, 0, 0.2)'
        }}>
        {/* Sidebar - Dynamic Color */}
        <div className="w-full h-full shadow-lg" style={{
          background: settings?.sidebar_color
            ? settings.sidebar_color
            : `linear-gradient(${settings?.sidebar_color1 || '#2765B0'} 20% , ${settings?.sidebar_color2 || '#629DE5'})`
        }}>
          <div className="flex flex-col h-full">
            {/* Logo and Toggle Button */}
            <div className="p-4 border-b border-blue-800/50 flex items-center justify-between">
              <div className="flex items-center justify-start flex-1">
                <Link to="/dashboard" className="flex items-center gap-2">
                  {settings?.company_logo ? (
                    <>
                      <img
                        src={settings.company_logo}
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
                </Link>
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
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden custom-scroll">
              {menuItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
                if (item.submenu) {
                  const Icon = MENU_ICON_MAP[item.icon] || FileText;
                  const submenuKey = item.label.toLowerCase();
                  const isSubmenuOpen = openSubmenus[submenuKey];
                  const hasActiveSubmenu = isSubmenuActive(item.submenu.map(sm => sm.path));
                  return (
                    <div key={item.label} className="relative">
                      <button
                        onClick={() => {
                          if (checkFeatureAccess(item.feature)) {
                            toggleSubmenu(submenuKey);
                          }
                        }}
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
                                  onClick={(e) => {
                                    if (!checkFeatureAccess(subItem.feature)) {
                                      e.preventDefault();
                                    }
                                  }}
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
                        onClick={(e) => {
                          if (!checkFeatureAccess(item.feature)) {
                            e.preventDefault();
                          }
                        }}
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
            style={{
              background: settings?.sidebar_color
                ? settings.sidebar_color
                : `linear-gradient(${settings?.sidebar_color1 || '#1e3a8a'} 20% , ${settings?.sidebar_color2 || '#172554'})`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Mobile Sidebar Header */}
              <div className="p-4 border-b border-blue-800/50 flex items-center justify-between">
                <div className="flex items-center">
                  {settings?.company_logo ? (
                    <img src={settings.company_logo} alt="Logo" className="h-8 object-contain max-w-[140px]" />
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
                          onClick={() => {
                            if (checkFeatureAccess(item.feature)) {
                              toggleSubmenu(submenuKey);
                            }
                          }}
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
                                onClick={(e) => {
                                  if (!checkFeatureAccess(subItem.feature)) {
                                    e.preventDefault();
                                  } else {
                                    setIsMobileSidebarOpen(false);
                                  }
                                }}
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
                        onClick={(e) => {
                          if (!checkFeatureAccess(item.feature)) {
                            e.preventDefault();
                          } else {
                            setIsMobileSidebarOpen(false);
                          }
                        }}
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
              onClick={() => {
                if (tab.action) {
                  tab.action();
                } else {
                  // Find feature key for this path if possible
                  const menuItem = menuItems.find(m => m.path === tab.path) ||
                    menuItems.flatMap(m => m.submenu || []).find(sm => sm.path === tab.path);

                  if (checkFeatureAccess(menuItem?.feature)) {
                    navigate(tab.path);
                  }
                }
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all w-16 ${isActiveTab ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon className={`h-5 w-5 mb-1 ${isActiveTab ? 'fill-blue-600/10' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Content - same background for full area */}
      <div
        className={`main-content transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} ml-0 pb-20 lg:pb-0 min-h-screen`}
        style={{ backgroundColor: bgColor }}
      >
        <GlobalHeader />

        {/* Content Area with Top Padding for GlobalHeader */}
        <div className="pt-14 lg:pt-16 custom-scroll" style={{ backgroundColor: bgColor }}>
          {/* Optional Page-Specific Header */}
          {Header && (
            <div style={{ padding: `${padding}px ${padding}px 0px ${padding}px` }}>
              <Header />
            </div>
          )}

          <div className="p-4 pb-6 md:p-6 md:pb-8 lg:p-8 lg:pb-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;