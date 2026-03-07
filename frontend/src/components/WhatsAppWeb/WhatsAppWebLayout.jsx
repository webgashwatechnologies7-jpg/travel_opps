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
    const activeChatRef = useRef(activeChat);
    const sendQueue = useRef([]);
    const sendingRef = useRef(false);

    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    const fetchStatus = useCallback(async () => {
        try {
            const result = await whatsappWebAPI.getStatus();
            if (result?.data?.success) {
                const newStatus = result.data.status;
                setStatus(prev => {
                    if (prev !== newStatus) return newStatus;
                    return prev;
                });
                if (result.data.qr_code) {
                    setQrCode(prev => prev !== result.data.qr_code ? result.data.qr_code : prev);
                }
            }
        } catch (e) {
            console.error("fetchStatus failed:", e);
        }
    }, []);

    const fetchChats = useCallback(async () => {
        setLoading(true);
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
    }, []);

    const fetchMessages = useCallback(async (chatId, isPolling = false) => {
        // Only show spinner if we have NO messages for this chat yet (initial load)
        const currentMsgCount = messages.length;
        if (!isPolling && currentMsgCount === 0) setLoadingMessages(true);
        try {
            const result = await whatsappWebAPI.getMessages(chatId);
            if (result.data.success) {
                const fetchedMessages = result.data.data;

                setMessages(prev => {
                    // Smart Merge: Keep all messages, update statuses of existing ones
                    const merged = [...prev];

                    fetchedMessages.forEach(newMsg => {
                        const newId = newMsg.whatsapp_message_id || newMsg.id;
                        const existingIdx = merged.findIndex(m => (m.whatsapp_message_id || m.id) === newId);

                        if (existingIdx > -1) {
                            // Update status/media if changed
                            merged[existingIdx] = { ...merged[existingIdx], ...newMsg };
                        } else {
                            // It's a truly new message not in local state yet
                            merged.push(newMsg);
                        }
                    });

                    // Sort by date to ensure order is preserved after merge
                    return merged.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                });

                // Auto-mark as Read logic
                const hasUnread = fetchedMessages.some(m => m.direction === 'inbound' && m.status !== 'read');
                if (hasUnread) {
                    whatsappWebAPI.markAsRead(chatId);
                }
            }
        } catch (e) {
            console.error("Messages fetch failed", e);
        } finally {
            setLoadingMessages(false);
        }
    }, [messages.length]);

    // Polling Control
    const stopPolling = useCallback(() => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
        }
    }, []);

    const startPolling = useCallback(() => {
        if (pollingInterval.current) return;

        pollingInterval.current = setInterval(async () => {
            await fetchStatus();

            // Silent fetch for active chat as a real-time fallback
            if (activeChatRef.current) {
                fetchMessages(activeChatRef.current.chat_id, true);
            }

            // Periodically refresh list
            whatsappWebAPI.getChats().then(result => {
                if (result.data.success) {
                    const seen = new Set();
                    const uniqueChats = result.data.data.filter(chat => {
                        const id = chat.chat_id;
                        if (seen.has(id)) return false;
                        seen.add(id);
                        return true;
                    });
                    setChats(uniqueChats);
                }
            }).catch(() => { });
        }, 8000); // Increased to 8s for stability
    }, [fetchStatus, fetchMessages]);

    // 1. Initial Load Effect
    useEffect(() => {
        const init = async () => {
            try {
                await fetchStatus();
            } catch (e) {
                console.error("Initial status check failed:", e);
            } finally {
                setIsInitialCheck(false);
            }
        };
        init();
        return () => stopPolling();
    }, [fetchStatus, stopPolling]);

    // 2. Fetch Chats on connection
    useEffect(() => {
        if (status === 'Connected') {
            fetchChats();
        }
    }, [status, fetchChats]);

    // 3. Polling Lifecycle Effect
    useEffect(() => {
        if (status === 'Connected' || status === 'Disconnected' || status === 'Scanning') {
            startPolling();
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [status, startPolling, stopPolling]);

    // 4. Message Refresh Effect
    useEffect(() => {
        if (activeChat?.chat_id) {
            setMessages([]);
            fetchMessages(activeChat.chat_id);
        } else {
            setMessages([]);
        }
    }, [activeChat?.chat_id]); // Only refetch when chat ID actually changes

    // Real-time Listeners (Echo)
    useEffect(() => {
        if (user?.id) {
            const companyId = user.company_id || user.id; // Fallback for debugging
            const channel = echo.private(`whatsapp.${companyId}`);

            channel.listen('.WhatsAppUpdate', (e) => {
                const { type, data } = e;

                if (type === 'whatsapp.message') {
                    // Update chat list metadata locally
                    setChats(prev => {
                        const existing = prev.find(c => c.chat_id === data.chat_id);
                        if (!existing) {
                            fetchChats();
                            return prev;
                        }
                        return [
                            {
                                ...existing,
                                last_message_body: data.message || data.body,
                                last_message_at: data.created_at || new Date().toISOString(),
                                updated_at: data.created_at || new Date().toISOString(),
                                unread_count: (activeChatRef.current?.chat_id === data.chat_id) ? 0 : (existing.unread_count || 0) + 1
                            },
                            ...prev.filter(c => c.chat_id !== data.chat_id)
                        ];
                    });

                    // Append to active chat
                    const activeChatVal = activeChatRef.current;
                    const isForActiveChat = activeChatVal && (
                        data.chat_id === activeChatVal.chat_id ||
                        (data.lead_id && activeChatVal.lead_id && data.lead_id === activeChatVal.lead_id)
                    );

                    if (isForActiveChat) {
                        setMessages(prev => {
                            const merged = [...prev];
                            const newId = data.whatsapp_message_id || data.id;
                            const existingIdx = merged.findIndex(m => (m.whatsapp_message_id || m.id) === newId);

                            if (existingIdx > -1) {
                                merged[existingIdx] = { ...merged[existingIdx], ...data };
                            } else {
                                const tempIdx = merged.findIndex(m =>
                                    m.id?.toString().startsWith('temp_') && m.message === (data.message || data.body)
                                );

                                if (tempIdx > -1) {
                                    merged[tempIdx] = data;
                                } else {
                                    merged.push(data);
                                }
                            }
                            return merged.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                        });
                        whatsappWebAPI.markAsRead(activeChatVal.chat_id);
                    } else {
                        toast.info(`New message from ${data.sender_name || 'WhatsApp'}`);
                    }
                } else if (type === 'whatsapp.receipt') {
                    setMessages(prev => prev.map(m =>
                        m.whatsapp_message_id === data.message_id ? { ...m, status: data.status } : m
                    ));
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
                channel.stopListening('.WhatsAppUpdate');
                echo.leave(`whatsapp.${companyId}`);
            };
        }
    }, [user?.id, fetchChats, fetchMessages]);

    const markAsRead = async (chatId) => {
        whatsappWebAPI.markAsRead(chatId);
        // Clear chat list unread count
        setChats(prev => prev.map(c => c.chat_id === chatId ? { ...c, unread_count: 0 } : c));
        // Clear message window 'Unread' flags immediately
        setMessages(prev => prev.map(m =>
            (m.direction === 'inbound' && m.status !== 'read') ? { ...m, status: 'read' } : m
        ));
    };


    const processSendQueue = useCallback(async () => {
        if (sendingRef.current || sendQueue.current.length === 0) return;
        sendingRef.current = true;

        while (sendQueue.current.length > 0) {
            const { text, quotedMessageId, quotedText, tempId } = sendQueue.current.shift();
            const chat = activeChatRef.current;
            if (!chat) break;

            try {
                const result = await whatsappWebAPI.sendMessage({
                    chat_id: chat.chat_id,
                    message: text,
                    quoted_message_id: quotedMessageId,
                    quoted_text: quotedText
                });

                const realId = result?.data?.message_id || result?.data?.data?.message_id || tempId;
                setMessages(prev => prev.map(m =>
                    m.id === tempId ? { ...m, id: realId, whatsapp_message_id: realId, status: 'sent' } : m
                ));
                setChats(prev => prev.map(c =>
                    c.chat_id === chat.chat_id ? {
                        ...c, last_message_body: text, last_message_at: new Date().toISOString()
                    } : c
                ));
            } catch (error) {
                const status = error?.response?.status;
                let errMsg = error?.response?.data?.message || error?.message || 'Send failed';
                if (status === 503) errMsg = 'WhatsApp is reconnecting — message queued, will retry.';
                console.error('[SendQueue] Error:', errMsg);
                setMessages(prev => prev.map(m =>
                    m.id === tempId ? { ...m, status: 'failed' } : m
                ));
                // Only show one toast every 5 seconds, not one per failed message
                if (!sendingRef._shownError) {
                    toast.error(errMsg, { autoClose: 3000 });
                    sendingRef._shownError = true;
                    setTimeout(() => { sendingRef._shownError = false; }, 5000);
                }
            }
        }

        sendingRef.current = false;
        setIsSending(false);
    }, []);

    const handleSendMessage = (text, quotedMessageId = null, quotedText = null) => {
        if (!activeChat) return;

        // Optimistic UI update — add to screen immediately
        const tempId = 'temp_' + Date.now() + '_' + Math.random();
        const tempMsg = {
            id: tempId,
            message: text,
            quoted_message_id: quotedMessageId,
            quoted_text: quotedText,
            direction: 'outbound',
            status: 'sending',
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);
        setIsSending(true);

        // Enqueue the actual API send
        sendQueue.current.push({ text, quotedMessageId, quotedText, tempId });
        processSendQueue();
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

            if (result?.data?.success || result?.data?.data?.success) {
                const realId = result.data.message_id || result.data.data?.message_id;
                setMessages(prev => prev.map(m =>
                    m.id === tempMsg.id ? { ...m, id: realId, whatsapp_message_id: realId, status: 'sent', message: `📎 ${detectedType}` } : m
                ));

                // Update chat list metadata locally for smoother feel
                setChats(prev => prev.map(c =>
                    c.chat_id === activeChat.chat_id ? {
                        ...c,
                        last_message_body: `📎 ${detectedType}`,
                        last_message_at: new Date().toISOString()
                    } : c
                ));
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

        if (result?.data?.success) {
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
                    onRefresh={() => fetchMessages(activeChat.chat_id, true)}
                />
            </div>
        </div>
    );
};

export default WhatsAppWebLayout;
