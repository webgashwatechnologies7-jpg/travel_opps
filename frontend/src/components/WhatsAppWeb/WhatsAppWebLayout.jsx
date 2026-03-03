import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import QrScanner from './QrScanner';
import { whatsappWebAPI } from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import echo from '../../utils/echo';
import { Users, RefreshCcw, MessageSquare, Plus, MoreVertical, ArrowLeft } from 'lucide-react';
import CommunitiesSidebar from './CommunitiesSidebar';
import NewChatSidebar from './NewChatSidebar';
import ChannelsSidebar from './ChannelsSidebar';

const WhatsAppWebLayout = () => {
    const { executeWithErrorHandling } = useErrorHandler();
    const { user } = useAuth();
    const [status, setStatus] = useState('Disconnected');
    const [qrCode, setQrCode] = useState(null);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isInitialCheck, setIsInitialCheck] = useState(true);
    const [typingStatus, setTypingStatus] = useState({}); // { jid: true/false }
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [sidebarView, setSidebarView] = useState('chats'); // 'chats', 'communities', 'new_chat', 'channels'

    const pollingInterval = useRef(null);
    const lastUpdateRef = useRef(Date.now());

    // Real-time Listeners (Echo)
    useEffect(() => {
        if (user?.company_id) {
            const channel = echo.private(`whatsapp.company.${user.company_id}`);

            channel.listen('.WhatsAppUpdate', (e) => {
                console.log('Real-time Update Received:', e);
                const { type, data } = e;

                if (type === 'whatsapp.message') {
                    // Update chat list last message
                    fetchChats();

                    // If it's for the active chat (either same chat_id or same lead_id), update message list
                    const isForActiveChat = activeChat && (
                        data.chat_id === activeChat.chat_id ||
                        (data.lead_id && activeChat.lead_id && data.lead_id === activeChat.lead_id)
                    );

                    if (isForActiveChat) {
                        fetchMessages(activeChat.chat_id, true);
                    } else {
                        // Optionally notify user
                        toast.info(`New message from ${data.sender_name || 'WhatsApp'}`);
                    }
                } else if (type === 'whatsapp.receipt') {
                    if (activeChat) {
                        setMessages(prev => prev.map(m =>
                            m.whatsapp_message_id === data.message_id ? { ...m, status: data.status } : m
                        ));
                    }
                } else if (type === 'whatsapp.presence') {
                    if (data.presence === 'composing') {
                        setTypingStatus(prev => ({ ...prev, [data.chat_id]: true }));
                        setTimeout(() => {
                            setTypingStatus(prev => ({ ...prev, [data.chat_id]: false }));
                        }, 5000);
                    } else {
                        setTypingStatus(prev => ({ ...prev, [data.chat_id]: false }));
                    }
                } else if (type === 'whatsapp.connection') {
                    setStatus(data.status);
                    if (data.qr) setQrCode(data.qr);
                }
            });

            return () => {
                echo.leave(`whatsapp.company.${user.company_id}`);
            };
        }
    }, [user?.company_id, activeChat]);

    // Fallback Polling (Fast & Reliable)
    const startPolling = useCallback(() => {
        if (pollingInterval.current) return;

        pollingInterval.current = setInterval(async () => {
            await fetchStatus();
            if (status === 'Connected') {
                await fetchChats();
            }
        }, 3000);
    }, [status, activeChat]);

    const stopPolling = useCallback(() => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            await fetchStatus();
            setIsInitialCheck(false);
        };
        init();

        // Restart polling whenever status OR activeChat changes
        stopPolling();
        startPolling();

        return () => stopPolling();
    }, [startPolling, stopPolling, activeChat, status]);

    const fetchStatus = async () => {
        const result = await executeWithErrorHandling(async () => {
            return await whatsappWebAPI.getStatus();
        });
        if (result?.data?.data?.success) {
            const newStatus = result.data.data.status;
            setStatus(newStatus);
            if (result.data.data.qr_code) {
                setQrCode(result.data.data.qr_code);
            }

            // IF CONNECTED and we have an active chat, pull messages too
            if (newStatus === 'Connected' && activeChat) {
                fetchMessages(activeChat.chat_id, true);
            }
        }
    };

    const initSession = async () => {
        const result = await executeWithErrorHandling(async () => {
            return await whatsappWebAPI.getQrCode();
        });

        if (result?.data?.data?.success) {
            setQrCode(result.data.data.qr_code);
            setStatus(result.data.data.status);
            toast.info('QR Code generated. Please scan to connect.');
        }
    };

    const fetchChats = async () => {
        try {
            const result = await whatsappWebAPI.getChats();
            if (result.data.success) {
                // Deduplicate chats by chat_id
                const seen = new Set();
                const uniqueChats = result.data.data.filter(chat => {
                    const id = chat.chat_id;
                    if (seen.has(id)) return false;
                    seen.add(id);
                    return true;
                });
                setChats(uniqueChats);
            }
        } catch (e) {
            console.error("Chats fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (chatId, isPolling = false) => {
        if (!isPolling) setLoadingMessages(true);
        try {
            const result = await whatsappWebAPI.getMessages(chatId);
            if (result.data.success) {
                setMessages(result.data.data);

                // Mark as Read if unread count > 0
                const currentChat = chats.find(c => c.chat_id === chatId);
                if (currentChat && currentChat.unread_count > 0) {
                    markAsRead(chatId);
                }
            }
        } catch (e) {
            console.error("Messages fetch failed", e);
        } finally {
            setLoadingMessages(false);
        }
    };

    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat.chat_id);
        }
    }, [activeChat]);

    const markAsRead = async (chatId) => {
        whatsappWebAPI.markAsRead(chatId);
        setChats(prev => prev.map(c => c.chat_id === chatId ? { ...c, unread_count: 0 } : c));
    };

    const handleSendMessage = async (text, quotedMessageId = null, quotedText = null) => {
        if (!activeChat) return;

        // Optimistic UI update
        const tempMsg = {
            id: 'temp_' + Date.now(),
            message: text,
            quoted_message_id: quotedMessageId,
            quoted_text: quotedText,
            direction: 'outbound',
            status: 'sending',
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);
        setIsSending(true);

        try {
            const result = await executeWithErrorHandling(async () => {
                return await whatsappWebAPI.sendMessage({
                    chat_id: activeChat.chat_id,
                    message: text,
                    quoted_message_id: quotedMessageId,
                    quoted_text: quotedText
                });
            });

            if (result?.data?.data?.success) {
                // Refresh messages immediately to replace temp message with real one
                fetchMessages(activeChat.chat_id);
            } else {
                toast.error('Failed to send message');
                setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleSendMedia = async (file) => {
        if (!activeChat || !file) return;

        // Auto-detect type
        const mime = file.type || '';
        let detectedType = 'document';
        if (mime.startsWith('image/') && !mime.includes('gif')) detectedType = 'image';
        else if (mime.startsWith('video/')) detectedType = 'video';
        else if (mime.startsWith('audio/')) detectedType = 'audio';

        const tempMsg = {
            id: 'temp_media_' + Date.now(),
            message: `📎 Sending ${detectedType}...`,
            direction: 'outbound',
            status: 'sending',
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);
        setIsSending(true);

        try {
            const result = await executeWithErrorHandling(async () => {
                return await whatsappWebAPI.sendMedia({
                    chat_id: activeChat.chat_id,
                    file: file,
                    type: detectedType
                });
            });

            if (result?.data?.data?.success) {
                setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
                fetchMessages(activeChat.chat_id);
                fetchChats();
            } else {
                toast.error('Failed to upload/send media');
                setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleLogout = async () => {
        if (!window.confirm('Are you sure you want to logout from WhatsApp?')) return;

        const result = await executeWithErrorHandling(async () => {
            return await whatsappWebAPI.logout();
        });

        if (result?.data?.data?.success) {
            setStatus('Disconnected');
            setQrCode(null);
            setActiveChat(null);
            setMessages([]);
            setChats([]);
            toast.success('Disconnected successfully');
        }
    };

    if (isInitialCheck) {
        return (
            <div className="flex-1 bg-[#111b21] flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#8696a0] text-sm font-medium">Loading WhatsApp...</p>
                </div>
            </div>
        );
    }

    if (status !== 'Connected') {
        return (
            <div className="flex-1 bg-[#F0F2F5] min-h-[calc(100vh-140px)] flex items-center justify-center p-4">
                <QrScanner
                    qrCode={qrCode}
                    status={status}
                    onRefresh={initSession}
                />
            </div>
        );
    }

    const filteredChats = chats.filter(chat => {
        const query = searchTerm.toLowerCase();
        return chat.chat_id.toLowerCase().includes(query) ||
            (chat.chat_name && chat.chat_name.toLowerCase().includes(query));
    });

    return (
        <div className="flex overflow-hidden h-full w-full" style={{ background: '#111b21' }}>
            {/* Left Sidebar */}
            <div className="flex flex-col border-r h-full overflow-hidden shrink-0" style={{ width: 360, minWidth: 320, borderColor: '#1f2c33', background: '#111b21' }}>
                {/* Header with Real Icons */}
                <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: '#202c33' }}>
                    <div className="w-10 h-10 rounded-full bg-[#111b21] flex items-center justify-center border border-[#2a3942] cursor-pointer">
                        <Users size={20} style={{ color: '#aebac1' }} />
                    </div>
                    <div className="flex items-center gap-3 text-[#aebac1]">
                        <button onClick={() => setSidebarView(v => v === 'communities' ? 'chats' : 'communities')} className={`p-2 rounded-full hover:bg-[#2a3942] transition-colors ${sidebarView === 'communities' ? 'bg-[#2a3942] text-[#00a884]' : ''}`} title="Communities"><Users size={20} /></button>
                        <button onClick={() => { fetchStatus(); fetchChats(); toast.success('Refreshing chats...'); }} className="p-2 rounded-full hover:bg-[#2a3942] transition-colors" title="Refresh"><RefreshCcw size={20} /></button>
                        <button onClick={() => setSidebarView(v => v === 'channels' ? 'chats' : 'channels')} className={`p-2 rounded-full hover:bg-[#2a3942] transition-colors ${sidebarView === 'channels' ? 'bg-[#2a3942] text-[#00a884]' : ''}`} title="Channels"><MessageSquare size={20} /></button>
                        <button onClick={() => setSidebarView(v => v === 'new_chat' ? 'chats' : 'new_chat')} className={`p-2 rounded-full hover:bg-[#2a3942] transition-colors ${sidebarView === 'new_chat' ? 'bg-[#2a3942] text-[#00a884]' : ''}`} title="New Chat"><Plus size={20} /></button>
                        <div className="relative group">
                            <button className="p-2 rounded-full hover:bg-[#2a3942] transition-colors" title="Menu"><MoreVertical size={20} /></button>
                            <div className="absolute right-0 top-full mt-1 w-48 bg-[#233138] border border-[#2a3942] rounded shadow-xl hidden group-hover:block z-50 py-1">
                                <button onClick={() => toast.info('Profile feature coming soon')} className="w-full text-left px-4 py-2 hover:bg-[#111b21] text-[#e9edef] text-sm">Profile</button>
                                <button onClick={() => { fetchStatus(); fetchChats(); }} className="w-full text-left px-4 py-2 hover:bg-[#111b21] text-[#e9edef] text-sm">Refresh</button>
                                <hr className="border-[#2a3942] my-1" />
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-[#111b21] text-[#e9edef] text-sm">Logout</button>
                            </div>
                        </div>
                    </div>
                </div>

                {sidebarView === 'chats' && (
                    <ChatSidebar
                        chats={filteredChats}
                        activeChat={activeChat}
                        onSelectChat={setActiveChat}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        typingStatus={typingStatus}
                        loading={loading}
                    />
                )}
                {sidebarView === 'communities' && (
                    <CommunitiesSidebar
                        onBack={() => setSidebarView('chats')}
                        loading={loading}
                    />
                )}
                {sidebarView === 'channels' && (
                    <ChannelsSidebar
                        onBack={() => setSidebarView('chats')}
                    />
                )}
                {sidebarView === 'new_chat' && (
                    <NewChatSidebar
                        onBack={() => setSidebarView('chats')}
                        onSelectUser={(item) => {
                            // If it's a direct chat (has chat_id already, e.g. from Group Creation)
                            if (item.chat_id) {
                                setActiveChat(item);
                                setSidebarView('chats');
                                return;
                            }

                            if (!item.phone) {
                                toast.warning('This member does not have a phone number linked.');
                                return;
                            }
                            // Try to find existing chat
                            const cleanPhone = item.phone.replace(/[^0-9]/g, '');
                            const jid = cleanPhone.length === 10 ? `91${cleanPhone}@s.whatsapp.net` : `${cleanPhone}@s.whatsapp.net`;

                            const existing = chats.find(c => c.chat_id.includes(cleanPhone));
                            if (existing) {
                                setActiveChat(existing);
                                setSidebarView('chats');
                            } else {
                                // Create temp chat object for opening chat window
                                setActiveChat({
                                    chat_id: jid,
                                    chat_name: item.name,
                                    last_message_body: '',
                                    last_message_at: null
                                });
                                setSidebarView('chats');
                            }
                        }}
                    />
                )}
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 h-full flex flex-col relative">
                <ChatWindow
                    chat={activeChat}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onSendMedia={handleSendMedia}
                    isTyping={activeChat ? typingStatus[activeChat.chat_id] : false}
                    isSending={isSending}
                    loadingMessages={loadingMessages}
                />
            </div>
        </div>
    );
};

export default WhatsAppWebLayout;
