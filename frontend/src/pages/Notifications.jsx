import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Check, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

export default function Notifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Check if user is Admin
    const roleNames = (user?.roles || []).map(r => typeof r === 'object' ? r.name : r);
    const isAdmin = user?.is_super_admin || roleNames.some(r => ['Admin', 'Company Admin', 'Super Admin'].includes(r));

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await notificationsAPI.getInApp();
            if (res.data?.success) {
                setNotifications(res.data.data.notifications);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id, url, event) => {
        if (event) event.stopPropagation();
        try {
            await notificationsAPI.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            if (url) navigate(url);
        } catch (e) { }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            toast.success("All notifications marked as read", { position: "top-center" });
        } catch (e) { }
    };

    const handleDelete = async (id, event) => {
        if (event) event.stopPropagation();
        if (!isAdmin) return;

        try {
            const res = await notificationsAPI.delete(id);
            if (res.data?.success) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                toast.success("Notification deleted", { position: "bottom-right", autoClose: 2000 });
            }
        } catch (e) {
            toast.error("Failed to delete notification");
            console.error("Failed to delete notification", e);
        }
    };

    // Group notifications by date (e.g., "Today", "Yesterday", or "Feb 20, 2026")
    const groupedNotifications = {};

    notifications.forEach(n => {
        const d = new Date(n.created_at);
        // Remove time portion for grouping
        const dateKey = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        if (!groupedNotifications[dateKey]) {
            groupedNotifications[dateKey] = [];
        }
        groupedNotifications[dateKey].push(n);
    });

    const FinalHeader = () => {
        return (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    Notifications
                </h1>
                {notifications.length > 0 && notifications.some(n => !n.is_read) && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-200"
                    >
                        <Check size={18} />
                        Mark all as read
                    </button>
                )}
            </div>
        )
    }

    return (
        <Layout Header={FinalHeader}>
            <div className="p-4 md:p-6 mt-2 rounded-md h-full min-h-screen">
                {/* Content Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">

                    {/* Top Accent Gradient Border */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-600 to-indigo-600"></div>

                    {loading ? (
                        <div className="p-16 flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-500 font-medium tracking-wide animate-pulse">Fetching your notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-16 text-center flex flex-col items-center justify-center">
                            <div className="bg-gray-50 p-6 rounded-full mb-5 border border-gray-100 shadow-inner">
                                <Bell className="h-12 w-12 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No notifications yet</h3>
                            <p className="text-gray-500 text-sm max-w-sm">
                                You're all caught up! When there's new activity or a lead assigned to you, it will appear right here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 pt-1">
                            {Object.entries(groupedNotifications).map(([date, notifs]) => (
                                <div key={date}>
                                    {/* Date Header */}
                                    <div className="bg-gray-50/90 px-6 py-2.5 flex items-center justify-between border-y border-gray-100 sticky top-0 z-10 backdrop-blur-md">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{date}</span>
                                        </div>
                                    </div>

                                    {/* Notifications List */}
                                    <div className="divide-y divide-gray-50">
                                        {notifs.map(n => (
                                            <div
                                                key={n.id}
                                                onClick={(e) => handleMarkAsRead(n.id, n.action_url, e)}
                                                className={`p-5 hover:bg-gray-50 transition-all duration-200 cursor-pointer flex gap-4 xl:gap-5 group
                                                    ${!n.is_read ? 'bg-blue-50/40 relative' : 'bg-white'}
                                                `}
                                            >
                                                {/* Unread Accent Line */}
                                                {!n.is_read && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                                )}

                                                {/* Left Icon / Indicator */}
                                                <div className="flex-shrink-0 mt-1 pl-1">
                                                    {n.is_read ? (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300 ring-4 ring-gray-100"></div>
                                                    ) : (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100 animate-pulse"></div>
                                                    )}
                                                </div>

                                                {/* Content block */}
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <p className={`text-[15px] ${!n.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                        {n.title}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{n.message}</p>

                                                    <p className="text-xs text-gray-400 mt-2.5 flex items-center gap-1.5 font-medium">
                                                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>

                                                {/* Right Actions (Hidden on mobile mostly, show on hover) */}
                                                <div className="flex-shrink-0 flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!n.is_read && (
                                                        <button
                                                            onClick={(e) => handleMarkAsRead(n.id, null, e)}
                                                            className="p-2 text-blue-500 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </button>
                                                    )}

                                                    {isAdmin && (
                                                        <button
                                                            onClick={(e) => handleDelete(n.id, e)}
                                                            className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-200 ml-1"
                                                            title="Delete Notification"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
