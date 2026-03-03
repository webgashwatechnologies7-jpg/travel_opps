import React from 'react';
import { Search, CheckCheck, Users, User } from 'lucide-react';

// Format a WhatsApp JID into a readable name
const formatChatName = (chat) => {
    // Priority 1: Direct name from API (Lead name)
    const name = chat.chat_name;
    if (name && name !== chat.chat_id && !name.includes('@s.whatsapp.net')) {
        return name;
    }

    const jid = chat.chat_id || '';

    // Priority 2: Groups
    if (jid.includes('@g.us')) {
        return chat.chat_name || 'Group Chat';
    }

    // Priority 3: LID / Customer
    if (jid.includes('@lid')) {
        return 'Customer';
    }

    // Priority 4: Direct Number format
    if (jid.includes('@s.whatsapp.net')) {
        const num = jid.split('@')[0];
        if (num.length >= 10) {
            // Format as +91 XXXXX XXXXX or international
            if (num.startsWith('91') && num.length === 12) {
                return `+91 ${num.slice(2, 7)} ${num.slice(7)}`;
            }
            return `+${num}`;
        }
        return `+${num}`;
    }

    return chat.chat_name || (jid ? jid.split('@')[0] : 'Unknown');
};

// Get avatar initial
const getAvatarInitial = (chat) => {
    const name = formatChatName(chat);
    return name.charAt(0).toUpperCase();
};

// Is a group chat
const isGroup = (chatId) => chatId?.includes('@g.us');

// Format time relative
const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isYesterday = new Date(now - 86400000).toDateString() === d.toDateString();
        if (isYesterday) return 'Yesterday';
        return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    } catch { return ''; }
};

// Avatar colors based on name
const AVATAR_COLORS = [
    'from-pink-500 to-rose-600',
    'from-purple-500 to-indigo-600',
    'from-blue-500 to-cyan-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-amber-600',
    'from-teal-500 to-green-600',
    'from-red-500 to-pink-600',
];

const getAvatarColor = (chatId = '') => {
    const idx = chatId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[idx];
};

// Clean preview text (strip reply markers etc)
const cleanPreview = (text) => {
    if (!text) return 'Tap to chat...';

    // Filter out technical/protocol messages
    if (text.includes('[protocol message]') ||
        text.includes('[messageContextInfo message]') ||
        text.includes('[senderKeyDistributionMessage]')) {
        return 'System message';
    }

    const REPLY_MARKER = '[REPLY]';
    if (text.includes(REPLY_MARKER)) {
        const nl = text.indexOf('\n');
        return nl !== -1 ? text.substring(nl + 1).substring(0, 50) : text.replace(REPLY_MARKER, '').substring(0, 50);
    }
    return text.substring(0, 50);
};

const ChatSidebar = ({ chats, activeChat, onSelectChat, searchTerm, onSearchChange, typingStatus = {}, loading }) => {
    const [activeFilter, setActiveFilter] = React.useState('All');

    const filteredChats = chats.filter(chat => {
        if (activeFilter === 'Unread') return chat.unread_count > 0;
        if (activeFilter === 'Groups') return isGroup(chat.chat_id);
        if (activeFilter === 'Favourites') return false; // Not implemented in backend yet
        return true;
    });

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ background: '#111b21' }}>
            {/* Search Bar */}
            <div className="px-3 pt-2 pb-1 shrink-0" style={{ background: '#111b21' }}>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4" style={{ color: '#8696a0' }} />
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm rounded-lg outline-none"
                        style={{
                            background: '#202c33',
                            color: '#e9edef',
                            fontWeight: 300
                        }}
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0" style={{ background: '#111b21' }}>
                {['All', 'Unread', 'Favourites', 'Groups'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-3 py-1 text-[13px] rounded-full transition-colors whitespace-nowrap ${activeFilter === filter ? 'bg-[#005c4b] text-[#e9edef]' : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'}`}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto whatsapp-scroll">
                {loading ? (
                    <div className="flex flex-col gap-0">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="flex items-center gap-3 px-3 py-3 border-b border-[#1f2c33] animate-pulse">
                                <div className="w-12 h-12 rounded-full bg-[#202c33] flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="h-4 bg-[#202c33] rounded w-1/3 mb-2" />
                                    <div className="h-3 bg-[#202c33] rounded w-2/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center">
                        <User size={48} className="mb-3 opacity-20" style={{ color: '#8696a0' }} />
                        <p className="text-sm" style={{ color: '#8696a0', fontWeight: 300 }}>No conversations yet</p>
                    </div>
                ) : (
                    filteredChats.map((chat) => {
                        const isTyping = typingStatus[chat.chat_id];
                        const isActive = activeChat?.chat_id === chat.chat_id;
                        const name = formatChatName(chat);
                        const initial = getAvatarInitial(chat);
                        const avatarColor = getAvatarColor(chat.chat_id);
                        const group = isGroup(chat.chat_id);

                        return (
                            <div
                                key={chat.id}
                                onClick={() => onSelectChat(chat)}
                                className="flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors relative"
                                style={{
                                    backgroundColor: isActive ? '#2a3942' : 'transparent',
                                    borderBottom: '1px solid #1f2c33'
                                }}
                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#182229'; }}
                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                {/* Avatar */}
                                <div className="relative flex-shrink-0">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-semibold text-lg shadow-sm`}>
                                        {group ? <Users size={20} className="text-white" /> : initial}
                                    </div>
                                    {chat.unread_count > 0 && !isActive && (
                                        <span className="absolute -top-0.5 -right-0.5 bg-[#00a884] text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold">
                                            {chat.unread_count}
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h4 className="font-medium text-[15px] truncate" style={{ color: '#e9edef' }}>
                                            {name}
                                        </h4>
                                        <span className="text-[11px] ml-2 flex-shrink-0" style={{
                                            color: chat.unread_count > 0 ? '#00a884' : '#8696a0'
                                        }}>
                                            {formatTime(chat.last_message_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-1 overflow-hidden">
                                        <div className="flex items-center gap-1 min-w-0 flex-1">
                                            {chat.last_message_status === 'read' && (
                                                <CheckCheck size={14} className="text-[#53bdeb] flex-shrink-0" />
                                            )}
                                            {isTyping ? (
                                                <p className="text-[13px] font-medium animate-pulse" style={{ color: '#00a884' }}>typing...</p>
                                            ) : (
                                                <p className="text-[13px] truncate" style={{ color: '#8696a0', fontWeight: 300 }}>
                                                    {cleanPreview(chat.last_message_body)}
                                                </p>
                                            )}
                                        </div>
                                        {/* Show number if searching and result is a name */}
                                        {searchTerm && !name.includes(searchTerm) && chat.chat_id.includes(searchTerm) && (
                                            <span className="text-[10px] bg-[#202c33] px-1 rounded text-[#8696a0] flex-shrink-0">
                                                {chat.chat_id.split('@')[0]}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
