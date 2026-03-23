import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Plane, Hotel, Settings, Package, LogOut, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { notificationsAPI } from '../services/api';

const Header = ({ user, settings, isAdmin, handleLogout }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await notificationsAPI.getInApp();
                if (res.data?.success) {
                    setNotifications(res.data.data.notifications);
                    setUnreadCount(res.data.data.unread_count);
                }
            } catch (e) {
                console.error("Failed to fetch notifications", e);
            }
        };

        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const toggleNotif = () => setIsNotifDropdownOpen(!isNotifDropdownOpen);
    const toggleUser = () => setIsUserDropdownOpen(!isUserDropdownOpen);

    const handleMarkAsRead = async (id, url) => {
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (url) {
                navigate(url);
                setIsNotifDropdownOpen(false);
            }
        } catch (e) { }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (e) { }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isNotifDropdownOpen && !event.target.closest('.notif-dropdown')) setIsNotifDropdownOpen(false);
            if (isUserDropdownOpen && !event.target.closest('.user-dropdown')) setIsUserDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNotifDropdownOpen, isUserDropdownOpen]);

    return (
        <div
            className="header-bar sticky top-0 z-50 w-full px-3 sm:px-4 lg:px-6 py-2 lg:py-3 min-h-14 lg:min-h-16 lg:h-16 transition-all duration-300 border-b border-gray-200/50 shadow-sm"
            style={{ backgroundColor: settings?.header_background_color || settings?.dashboard_background_color || '#D8DEF5' }}
        >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-3 h-full">
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => navigate('/flight-search')}
                            className="flex-1 sm:flex-none px-3 py-2 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-800 flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer"
                        >
                            <Plane className="h-4 w-4" /> <span className="hidden sm:inline">Flight Search</span>
                        </button>
                        <button 
                            onClick={() => navigate('/hotel-search')}
                            className="flex-1 sm:flex-none px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer"
                        >
                            <Hotel className="h-4 w-4" /> <span className="hidden sm:inline">Hotel Search</span>
                        </button>
                    </div>

                    <div className="relative notif-dropdown">
                        <button onClick={toggleNotif} className="p-2 text-gray-700 hover:bg-gray-400 rounded-lg relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                        </button>
                        {isNotifDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                                    <h3 className="font-semibold text-gray-700">Notifications</h3>
                                    {unreadCount > 0 && <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Mark all read</button>}
                                </div>
                                <div className="max-h-80 overflow-y-auto custom-scroll">
                                    {notifications.filter(n => !n.is_read).length === 0 ? (
                                        <div className="p-4 text-center text-sm text-gray-500">No unread notifications.</div>
                                    ) : (
                                        notifications.filter(n => !n.is_read).map(n => (
                                            <div key={n.id} onClick={() => handleMarkAsRead(n.id, n.action_url)} className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors bg-blue-50/50">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{new Date(n.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="border-t bg-gray-50 p-2 text-center">
                                    <button onClick={() => { setIsNotifDropdownOpen(false); navigate('/notifications'); }} className="text-sm text-blue-600 font-medium hover:text-blue-800">View all notifications</button>
                                </div>
                            </div>
                        )}
                    </div>

                    {isAdmin && <Link to="/settings" className="p-2 text-gray-700 hover:bg-gray-400 rounded-lg"><Settings className="h-5 w-5" /></Link>}

                    <div className="relative user-dropdown">
                        <button onClick={toggleUser} className="flex items-center gap-2 pl-3 border-l border-gray-500 hover:bg-gray-200 rounded-lg px-2 py-1">
                            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">{user?.name?.charAt(0) || 'A'}</div>
                            <span className="hidden sm:block text-sm font-medium text-gray-800">{user?.name || 'Admin User'}</span>
                            <ChevronDownIcon className={`h-4 w-4 text-gray-700 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isUserDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <div className="px-4 py-2 border-b">
                                    <p className="text-sm font-medium">{user?.name}</p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                                {isAdmin && (
                                    <Link to="/settings/subscription" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 gap-2">
                                        <Package className="h-4 w-4" /> Subscription Plan
                                    </Link>
                                )}
                                <button onClick={handleLogout} className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 flex gap-2 border-t">
                                    <LogOut className="h-4 w-4" /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
