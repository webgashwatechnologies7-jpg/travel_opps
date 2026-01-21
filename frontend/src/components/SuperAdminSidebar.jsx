import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, CreditCard, Users, LogOut, Shield, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SuperAdminSidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/super-admin',
    },
    {
      name: 'Mail Status',
      icon: Mail,
      path: '/super-admin/mail-status',
    },
    {
      name: 'Companies',
      icon: Building2,
      path: '/super-admin/companies',
    },
    {
      name: 'Subscriptions',
      icon: CreditCard,
      path: '/super-admin/subscriptions',
    },
    {
      name: 'Permissions',
      icon: Shield,
      path: '/super-admin/permissions',
    },
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">TravelOps</h1>
        <p className="text-sm text-gray-400 mt-1">Super Admin</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{user?.name || 'Super Admin'}</p>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default SuperAdminSidebar;

