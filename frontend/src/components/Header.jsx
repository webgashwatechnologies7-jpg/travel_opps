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
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [user?.profile_picture]);

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
            const interval = setInterval(fetchNotifications, 10000); // Check every 10 seconds
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
            className="header-bar sticky top-0 z-[100] w-full px-3 sm:px-4 lg:px-6 py-2 min-h-[64px] transition-all duration-300 border-b border-gray-200/50 shadow-sm flex items-center"
            style={{ backgroundColor: settings?.header_background_color || settings?.dashboard_background_color || '#D8DEF5' }}
        >
            <div className="w-full flex items-center justify-between gap-4">
                {/* Left side spacer - can be used for breadcrumbs or mobile menu toggle if needed */}
                <div className="flex-1 hidden lg:block"></div>

                {/* Right side actions */}
                <div className="flex items-center gap-2 sm:gap-4 ml-auto">
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={() => navigate('/flight-search')}
                            style={{ backgroundColor: '#2D3192' }}
                            className="px-3 py-2 text-white rounded-lg text-sm flex items-center gap-2 font-medium transition-all hover:shadow-md active:scale-95 cursor-pointer hover:brightness-110"
                        >
                            <Plane className="h-4 w-4" /> <span>Flight Search</span>
                        </button>
                        <button
                            onClick={() => navigate('/hotel-search')}
                            style={{ backgroundColor: '#C42771' }}
                            className="px-3 py-2 text-white rounded-lg text-sm flex items-center gap-2 font-medium transition-all hover:shadow-md active:scale-95 cursor-pointer hover:brightness-110"
                        >
                            <Hotel className="h-4 w-4" /> <span>Hotel Search</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="relative notif-dropdown">
                            <button onClick={toggleNotif} className="p-2 text-gray-700 hover:bg-gray-200/50 rounded-full relative transition-colors">
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                                )}
                            </button>
                            {isNotifDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[110] overflow-hidden flex flex-col transform origin-top-right transition-all">
                                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
                                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto custom-scroll">
                                        {notifications.filter(n => !n.is_read).length === 0 ? (
                                            <div className="p-8 text-center">
                                                <Bell className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">No unread notifications</p>
                                            </div>
                                        ) : (
                                            notifications.filter(n => !n.is_read).map(n => (
                                                <div key={n.id} onClick={() => handleMarkAsRead(n.id, n.action_url)} className="p-4 border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className="text-sm font-bold text-gray-900">{n.title}</p>
                                                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                            {new Date(n.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{n.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="border-t bg-gray-50/50 p-3 text-center">
                                        <button onClick={() => { setIsNotifDropdownOpen(false); navigate('/notifications'); }} className="text-sm text-blue-600 font-semibold hover:text-blue-800">
                                            View all notifications
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {isAdmin && (
                            <Link to="/settings" className="p-2 text-gray-700 hover:bg-gray-200/50 rounded-full transition-colors">
                                <Settings className="h-5 w-5" />
                            </Link>
                        )}
                    </div>

                    <div className="relative user-dropdown">
                        <button
                            onClick={toggleUser}
                            className="flex items-center gap-2.5 pl-3 border-l border-gray-300 ml-2 hover:bg-gray-200/30 rounded-full pr-1.5 py-1 transition-all"
                        >
                            <div key={user?.profile_picture} className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm border-2 border-white overflow-hidden">
                                {user?.profile_picture && !imageError ? (
                                    <img
                                        src={`${user.profile_picture}${user.profile_picture.includes('?') ? '&' : '?'}t=${new Date().getTime()}`}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            setImageError(true);
                                        }}
                                    />
                                ) : (
                                    user?.name?.charAt(0) || 'A'
                                )}
                            </div>
                            <div className="hidden sm:flex flex-col items-start leading-tight">
                                <span className="text-sm font-bold text-gray-800 max-w-[120px] truncate">{user?.name || 'Admin User'}</span>
                                <span className="text-[10px] text-gray-500 font-medium">Online</span>
                            </div>
                            <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-300 ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isUserDropdownOpen && (
                            <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-[110] overflow-hidden transform origin-top-right transition-all">
                                <Link
                                    to="/profile"
                                    onClick={() => setIsUserDropdownOpen(false)}
                                    className="px-5 py-4 bg-gray-50/50 border-b block hover:bg-blue-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 mb-1">
                                        <div key={user?.profile_picture} className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-base font-bold uppercase overflow-hidden">
                                            {user?.profile_picture ? (
                                                <img
                                                    src={`${user.profile_picture}${user.profile_picture.includes('?') ? '&' : '?'}t=${new Date().getTime()}`}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                user?.name?.charAt(0) || 'A'
                                            )}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                                            <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                </Link>
                                <div className="p-1.5 font-medium">
                                    {isAdmin && (
                                        <Link
                                            to="/settings/subscription"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                            className="flex items-center px-3.5 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg gap-3 transition-colors group"
                                        >
                                            <Package className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                                            <span>Subscription Plan</span>
                                        </Link>
                                    )}
                                    <Link
                                        to="/profile"
                                        onClick={() => setIsUserDropdownOpen(false)}
                                        className="flex items-center px-3.5 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg gap-3 transition-colors group"
                                    >
                                        <Settings className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                                        <span>Profile Settings</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-3.5 py-2.5 text-sm text-left text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 mt-1 transition-colors group"
                                    >
                                        <LogOut className="h-4 w-4 text-red-400 group-hover:text-red-500" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
