import { useState, useEffect, useRef } from 'react';
// Layout removed - handled by nested routing
import { whatsappWebAPI } from '../services/api';
import { toast } from 'react-toastify';
import { Search, MoreVertical, Smile, Paperclip, Send, Check, CheckCheck, Loader2, Phone, Camera, X, MessageSquare, LogOut, RefreshCcw, Info } from 'lucide-react';
import LogoLoader from '../components/LogoLoader';

const WhatsAppWeb = () => {
    const [status, setStatus] = useState('Disconnected');
    const [qrCode, setQrCode] = useState(null);
    const [userPhone, setUserPhone] = useState(null);
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingChats, setLoadingChats] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [pollingQr, setPollingQr] = useState(false);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        checkStatus();
        loadChats();

        const chatInterval = setInterval(loadChats, 10000);
        return () => clearInterval(chatInterval);
    }, []);

    useEffect(() => {
        if (activeChat) {
            loadMessages(activeChat.chat_id);
            const msgInterval = setInterval(() => loadMessages(activeChat.chat_id), 3000);
            return () => clearInterval(msgInterval);
        }
    }, [activeChat]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const checkStatus = async () => {
        try {
            const res = await whatsappWebAPI.getStatus();
            setStatus(res.data.status);
            
            // Get user phone from localStorage or similar if needed, or from status response
            const localUser = JSON.parse(localStorage.getItem('user') || '{}');
            setUserPhone(localUser.phone || 'Register Number');

            if (res.data.status === 'Unauthorized_Phone') {
                toast.error("Account Mismatch: Please login with your registered number (" + localUser.phone + ")");
            }
        } catch (err) {
            console.error('Status check failed', err);
        }
    };

    const handleConnect = async () => {
        setPollingQr(true);
        try {
            const res = await whatsappWebAPI.getQrCode();
            if (res.data.success) {
                setQrCode(res.data.qr_code);
                setStatus('Scanning');

                // Poll status for connection
                const pollInterval = setInterval(async () => {
                    const statusRes = await whatsappWebAPI.getStatus();
                    if (statusRes.data.status === 'Connected') {
                        setStatus('Connected');
                        setQrCode(null);
                        setPollingQr(false);
                        clearInterval(pollInterval);
                        loadChats();
                        toast.success('WhatsApp Connected!');
                    } else if (statusRes.data.status === 'Unauthorized_Phone') {
                        setStatus('Unauthorized_Phone');
                        setQrCode(null);
                        setPollingQr(false);
                        clearInterval(pollInterval);
                        toast.error("Mismatch: Use your registered number only (" + userPhone + ")");
                    } else if (statusRes.data.status === 'Scanning') {
                        // Refresh QR if updated
                        const qrRes = await whatsappWebAPI.getQrCode();
                        setQrCode(qrRes.data.qr_code);
                    }
                }, 5000);
            }
        } catch (err) {
            toast.error('Failed to initiate connection');
            setPollingQr(false);
        }
    };

    const handleLogout = async () => {
        if (!confirm('Are you sure you want to logout from WhatsApp?')) return;
        try {
            await whatsappWebAPI.logout();
            setStatus('Disconnected');
            setQrCode(null);
            setChats([]);
            setActiveChat(null);
            toast.info('Logged out from WhatsApp');
        } catch (err) {
            toast.error('Logout failed');
        }
    };

    const loadChats = async () => {
        if (status !== 'Connected') return;
        try {
            const res = await whatsappWebAPI.getChats();
            if (res.data.success) {
                setChats(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load chats', err);
        }
    };

    const loadMessages = async (chatId) => {
        try {
            const res = await whatsappWebAPI.getMessages(chatId);
            if (res.data.success) {
                setMessages(res.data.data);
            }
        } catch (err) {
            console.error('Failed to load messages', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat || sending) return;

        setSending(true);
        try {
            await whatsappWebAPI.sendMessage({
                chat_id: activeChat.chat_id,
                message: newMessage.trim()
            });
            setNewMessage('');
            loadMessages(activeChat.chat_id);
        } catch (err) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (status !== 'Connected') {
        return (
            <div>
                <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gray-50 p-6">
                    <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-2xl w-full text-center border-t-8 border-[#25D366]">
                        <div className="flex justify-center mb-6">
                            <div className="bg-[#25D366] p-4 rounded-full text-white">
                                <MessageSquare size={48} />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">WhatsApp Web Clone</h1>
                        <p className="text-gray-600 mb-2 text-lg">Connect your WhatsApp to start chatting with your leads directly.</p>
                        
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-8 text-left inline-block w-full">
                            <h4 className="text-orange-800 font-bold text-sm flex items-center gap-2 mb-1">
                                <Info size={16} /> IMPORTANT NOTICE:
                            </h4>
                            <p className="text-orange-700 text-xs leading-relaxed">
                                Please login using your registered CRM phone number: <span className="font-black underline">{userPhone}</span>.
                                If you try to connect using any other WhatsApp account, it will be automatically disconnected for security reasons.
                            </p>
                        </div>

                        {status === 'Unauthorized_Phone' && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl mb-6 text-sm font-bold flex flex-col items-center gap-3">
                                <div className="flex items-center gap-2 text-lg">
                                    <X size={24} className="text-red-600" /> 
                                    <span>Account Mismatch!</span>
                                </div>
                                <p className="text-center font-normal text-red-600 uppercase tracking-tighter text-xs">
                                    Aap jis WhatsApp se login kar rahe hain wo aapke naam (CRM) ke sath register nahi hai. 
                                    Please sirf wahi phone scan karein jiska number <span className="underline font-black">{userPhone}</span> hai.
                                </p>
                            </div>
                        )}

                        {qrCode ? (
                            <div className="flex flex-col items-center">
                                <div className="bg-white p-4 rounded-xl border-4 border-[#25D366] shadow-inner mb-6 transition-all duration-300 transform hover:scale-105">
                                    <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                                </div>
                                <div className="flex flex-col items-center justify-center mb-4 min-h-[100px]">
                                    <LogoLoader text="Waiting for scan..." compact={true} />
                                </div>
                                <p className="text-xs text-gray-500 max-w-md bg-gray-100 p-3 rounded-lg border border-gray-200">
                                    1. Open WhatsApp on your phone<br />
                                    2. Tap Menu or Settings and select <b>Linked Devices</b><br />
                                    3. Point your phone to this screen to capture the code
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={handleConnect}
                                disabled={pollingQr}
                                className="bg-[#25D366] hover:bg-[#128C7E] text-white font-black uppercase tracking-widest text-sm py-4 px-12 rounded-full transition-all flex items-center gap-3 mx-auto shadow-xl shadow-[#25d36644] hover:shadow-2xl active:scale-95"
                            >
                                {pollingQr ? <Loader2 className="animate-spin" /> : <RefreshCcw />}
                                Get QR Code To Connect
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#F0F2F5]">
                {/* Chat Sidebar */}
                <div className="w-1/3 min-w-[350px] flex flex-col border-r border-gray-300 bg-white">
                    {/* Sidebar Header */}
                    <div className="h-[60px] bg-[#F0F2F5] flex items-center justify-between px-4">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Phone className="text-gray-600" size={20} />
                        </div>
                        <div className="flex gap-4 text-gray-500">
                            <MessageSquare className="cursor-pointer hover:text-gray-800" />
                            <MoreVertical className="cursor-pointer hover:text-gray-800" />
                            <LogOut className="cursor-pointer hover:text-red-500" onClick={handleLogout} title="Logout" />
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="p-3 bg-white border-b border-gray-100">
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-400"><Search size={18} /></span>
                            <input
                                type="text"
                                placeholder="Search or start new chat"
                                className="w-full bg-[#F0F2F5] py-2 pl-10 pr-4 rounded-lg text-sm focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {chats.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 text-sm">No chats found</div>
                        ) : (
                            chats.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => setActiveChat(chat)}
                                    className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 ${activeChat?.id === chat.id ? 'bg-[#F0F2F5]' : ''}`}
                                >
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-600 font-bold uppercase text-lg">
                                        {chat.chat_id.substring(0, 1)}
                                    </div>
                                    <div className="flex-1 border-gray-100 pb-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-semibold text-gray-900">{chat.chat_id.split('@')[0]}</h3>
                                            <span className="text-[10px] text-gray-500">{formatTime(chat.last_message_at)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-500 truncate w-48">Lead Contact: {chat.chat_id.split('@')[0]}</p>
                                            {chat.unread_count > 0 && (
                                                <span className="bg-[#25D366] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                                                    {chat.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-[#E5DDD5] relative">
                    {!activeChat ? (
                        <div className="flex-1 flex flex-col items-center justify-center bg-[#F0F2F5] border-b-8 border-[#25D366]">
                            <div className="w-64 h-64 opacity-10 mb-6 bg-green-900 rounded-full flex items-center justify-center">
                                <MessageSquare size={120} />
                            </div>
                            <h2 className="text-2xl font-light text-[#41525d] mb-2">Select a chat to start messaging</h2>
                            <p className="text-sm text-[#667781] max-w-md text-center">Your messages are synced with your phone. Keep your phone connected for instant delivery.</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="h-[60px] bg-[#F0F2F5] flex items-center justify-between px-4 z-10 border-b border-gray-200">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3 text-blue-600 font-bold uppercase text-sm">
                                        {activeChat.chat_id.substring(0, 1)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm text-gray-900">{activeChat.chat_id.split('@')[0]}</h3>
                                        <p className="text-[10px] text-gray-500">Contact Number</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 text-gray-500">
                                    <Phone size={18} className="cursor-pointer hover:text-gray-800" />
                                    <Camera size={18} className="cursor-pointer hover:text-gray-800" />
                                    <MoreVertical size={18} className="cursor-pointer hover:text-gray-800" />
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-10 flex flex-col gap-2 relative bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-opacity-10">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={msg.id || idx}
                                        className={`flex flex-col max-w-[65%] rounded-lg p-2 relative shadow-sm text-sm ${msg.direction === 'outbound' ? 'bg-[#dcf8c6] self-end' : 'bg-white self-start'}`}
                                    >
                                        {msg.media_type === 'image' && (
                                            <img src={msg.media_url} alt="Media" className="rounded-md mb-2 max-w-full cursor-pointer hover:opacity-90" />
                                        )}
                                        <p className="pr-12 text-[#111b21]">{msg.message}</p>
                                        <div className="flex items-center gap-1 justify-end mt-1">
                                            <span className="text-[9px] text-gray-400">{formatTime(msg.created_at)}</span>
                                            {msg.direction === 'outbound' && (
                                                msg.status === 'read' ? <CheckCheck size={12} className="text-[#34b7f1]" /> :
                                                    msg.status === 'delivered' ? <CheckCheck size={12} className="text-gray-400" /> :
                                                        <Check size={12} className="text-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="bg-[#F0F2F5] px-4 py-2.5 flex items-center gap-4 z-10">
                                <div className="flex gap-4 text-gray-500">
                                    <Smile className="cursor-pointer hover:text-gray-700" size={24} />
                                    <Paperclip className="cursor-pointer hover:text-gray-700" size={24} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Type a message"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="flex-1 bg-white py-2 px-4 rounded-lg text-sm focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    className="text-gray-500 hover:text-[#0b6156] disabled:opacity-30"
                                >
                                    {sending ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            <style jsx="true">{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #CED0D1;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #A6A8A9;
                }
            `}</style>
        </div>
    );
};

export default WhatsAppWeb;
