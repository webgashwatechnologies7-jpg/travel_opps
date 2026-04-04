import { Suspense } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  LayoutDashboard, MessageSquare, FileText, CreditCard, MessageCircle, Mail, Link2, BarChart3, Megaphone, Receipt, Settings, Grid, Users, Phone, ClipboardList, Package, Bell, Menu, Clock
} from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';
import HeaderComponent from './Header';
import MobileSidebar from './MobileSidebar';

const MENU_ICON_MAP = {
  LayoutDashboard, MessageSquare, FileText, CreditCard, MessageCircle, Mail, Link2, BarChart3, Megaphone, Receipt, Settings, Grid, Users, Phone, ClipboardList, Package, Bell, Clock
};

// A minimal loader for lazy-loaded chunks that doesn't block the sidebar
const ChunkLoader = () => (
  <div className="absolute top-0 left-0 right-0 h-1 z-[1000] side-progress-bar" />
);

const Layout = ({ Header, padding = 0 }) => {
  const { user, logout } = useAuth();
  const { settings, isSidebarOpen, toggleSidebar, menuItems, openSubmenus, setOpenSubmenus, toggleSubmenu } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const checkFeatureAccess = useCallback((feature) => {
    if (!feature || user?.is_super_admin) return true;
    const features = user?.plan_features || {};
    if (!features[feature]?.enabled) {
      toast.info("To use this feature, you need to upgrade your current plan.", { toastId: 'feature-restricted' });
      return false;
    }
    return true;
  }, [user]);

  const isAdmin = useMemo(() => {
    const roleNames = (user?.roles || []).map(r => typeof r === 'object' ? r.name : r);
    return user?.is_super_admin || roleNames.some(r => ['Admin', 'Company Admin', 'Super Admin'].includes(r));
  }, [user]);

  useEffect(() => {
    setOpenSubmenus((prev) => {
      const next = { ...prev };
      menuItems.forEach((item) => {
        if (item.submenu) {
          const key = item.label.toLowerCase();
          if (item.submenu.some(sm => {
            if (location.pathname.startsWith(sm.path)) return true;
            if (location.pathname === '/company-settings/team-management' && sm.path.startsWith('/staff-management/')) return true;
            return false;
          })) {
            next[key] = true;
          }
        }
      });
      return next;
    });
  }, [location.pathname, location.search, menuItems, setOpenSubmenus]);

  const isActive = useCallback((path) => {
    if (location.pathname === path || location.pathname.startsWith(path + '/')) return true;

    // Special mapping for staff management
    if (location.pathname === '/company-settings/team-management') {
      const tab = new URLSearchParams(location.search).get('tab');
      // Tab names correspond to these paths (users -> /staff-management/users, etc)
      if (tab && path === `/staff-management/${tab}`) return true;
      if (!tab && path === '/staff-management/users') return true; // Default tab is users
    }
    return false;
  }, [location.pathname, location.search]);

  const isSubmenuActive = useCallback((paths) => paths.some(path => isActive(path)), [isActive]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const bgColor = settings?.dashboard_background_color || '#D8DEF5';

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: bgColor }}>
      <Sidebar
        settings={settings}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        menuItems={menuItems}
        openSubmenus={openSubmenus}
        toggleSubmenu={toggleSubmenu}
        isAdmin={isAdmin}
        isActive={isActive}
        isSubmenuActive={isSubmenuActive}
        checkFeatureAccess={checkFeatureAccess}
        MENU_ICON_MAP={MENU_ICON_MAP}
      />

      <div className={`main-content transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} ml-0 pb-20 lg:pb-0 min-h-screen`} style={{ backgroundColor: bgColor }}>
        <HeaderComponent user={user} settings={settings} isAdmin={isAdmin} handleLogout={handleLogout} />
        <div className="custom-scroll">
          {Header && <div className="sticky top-[56px] lg:top-[64px] z-40 bg-white" style={{ padding: `${padding}px` }}><Header /></div>}
          <div className="relative">
            <Suspense fallback={<ChunkLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>

      <MobileSidebar
        settings={settings}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        menuItems={menuItems}
        openSubmenus={openSubmenus}
        toggleSubmenu={toggleSubmenu}
        isAdmin={isAdmin}
        isActive={isActive}
        checkFeatureAccess={checkFeatureAccess}
        MENU_ICON_MAP={MENU_ICON_MAP}
      />

      {/* Mobile Bottom Tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-40 flex items-center justify-around px-2 shadow-lg">
        {[
          { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
          { icon: MessageSquare, label: 'Queries', path: '/leads' },
          { icon: FileText, label: 'Itinerary', path: '/itineraries' },
          { icon: CreditCard, label: 'Accounts', path: '/payments' },
          { icon: Menu, label: 'Menu', action: () => setIsMobileSidebarOpen(true) }
        ].map((tab, idx) => (
          <button
            key={idx}
            onClick={() => tab.action ? tab.action() : navigate(tab.path)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl w-16 ${location.pathname === tab.path ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
          >
            <tab.icon className="h-5 w-5 mb-1" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Layout;