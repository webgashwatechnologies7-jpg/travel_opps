import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import {
    Plus,
    MessageSquare,
    Clock,
    CheckCircle2,
    Send,
    Image as ImageIcon,
    X,
    AlertCircle,
    ChevronRight,
    User,
    Info,
    Reply
} from 'lucide-react';
import { supportAPI, ASSET_URL } from '../services/api';
import { toast } from 'react-toastify';

const Support = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: '', description: '', screenshot: null });
    const [previewUrl, setPreviewUrl] = useState(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [attachment, setAttachment] = useState(null);
    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const replyFileInputRef = useRef(null);

    const scrollToMessage = (msgId) => {
        const el = document.getElementById(`msg-${msgId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2');
            setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2'), 2000);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 30000); // Poll list every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (id && tickets.length > 0) {
            const ticket = tickets.find(t => t.id.toString() === id.toString());
            if (ticket) setSelectedTicket(ticket);
        }
    }, [id, tickets]);

    useEffect(() => {
        if (selectedTicket) {
            fetchTicketDetails(selectedTicket.id);
            const interval = setInterval(() => fetchTicketDetails(selectedTicket.id), 10000); // Poll every 10s
            return () => clearInterval(interval);
        }
    }, [selectedTicket]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchTickets = async () => {
        try {
            const res = await supportAPI.getTickets();
            if (res.data?.success) {
                setTickets(res.data.data);
            }
        } catch (err) {
            toast.error('Failed to fetch tickets');
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketDetails = async (id) => {
        try {
            const res = await supportAPI.getTicket(id);
            if (res.data?.success) {
                setMessages(res.data.data.messages);
                // Update status in list if changed
                if (res.data.data.status !== selectedTicket?.status) {
                    setSelectedTicket(res.data.data);
                    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: res.data.data.status } : t));
                }
            }
        } catch (err) {
            console.error('Failed to fetch messages');
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!newTicket.description) return;

        try {
            setLoading(true);
            const res = await supportAPI.createTicket(newTicket);
            if (res.data?.success) {
                toast.success('Ticket sent successfully!');
                setIsModalOpen(false);
                setNewTicket({ subject: '', description: '', screenshot: null });
                setPreviewUrl(null);
                fetchTickets();
            }
        } catch (err) {
            toast.error('Failed to send ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !attachment || !selectedTicket) return;

        setSendingMessage(true);
        try {
            // Optimistic Update
            const tempId = Date.now();
            const optimisticMessage = {
                id: tempId,
                user_id: user?.id,
                message: newMessage,
                created_at: new Date().toISOString(),
                user: {
                    id: user?.id,
                    name: user?.name,
                    is_super_admin: false
                },
                parent_message: replyingTo,
                parentMessage: replyingTo,
                is_optimistic: true
            };
            setMessages(prev => [...prev, optimisticMessage]);
            const messageToSend = newMessage;
            setNewMessage('');

            const res = await supportAPI.sendMessage(selectedTicket.id, {
                message: messageToSend,
                attachment: attachment,
                parent_id: replyingTo?.id
            });
            if (res.data?.success) {
                setMessages(prev => prev.map(m => m.id === tempId ? res.data.data : m));
                setAttachment(null);
                setAttachmentPreview(null);
                setReplyingTo(null);
            }
        } catch (err) {
            toast.error('Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    const handleReplyFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size should be less than 5MB');
                return;
            }
            setAttachment(file);
            if (file.type.startsWith('image/')) {
                setAttachmentPreview(URL.createObjectURL(file));
            } else {
                setAttachmentPreview(null);
            }
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size should be less than 5MB');
                return;
            }
            setNewTicket({ ...newTicket, screenshot: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'on working':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12} /> On Working</span>;
            case 'done':
                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle2 size={12} /> Done</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1"><AlertCircle size={12} /> Pending</span>;
        }
    };

    return (
        <Layout>
            <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Support Center</h1>
                        <p className="text-sm text-gray-500">How can we help you today?</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        <span>New Ticket</span>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Ticket List */}
                    <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/30">
                        <div className="p-4 border-b border-gray-100 bg-white">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search tickets..."
                                    className="w-full pl-3 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {loading && tickets.length === 0 ? (
                                <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
                            ) : tickets.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">No tickets found.</div>
                            ) : (
                                tickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => {
                                            setSelectedTicket(ticket);
                                            navigate(`/support/tickets/${ticket.id}`);
                                            setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, unread_count: 0 } : t));
                                        }}
                                        className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${selectedTicket?.id === ticket.id ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'} ${ticket.unread_count > 0 ? 'bg-blue-50/20' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`${ticket.unread_count > 0 ? 'font-bold text-blue-900' : 'font-semibold text-gray-800'} truncate text-sm flex items-center gap-2`}>
                                                {ticket.unread_count > 0 && <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 animate-pulse"></span>}
                                                {ticket.subject || 'No Subject'}
                                            </h3>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className={`text-xs line-clamp-1 mb-2 ${ticket.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{ticket.description}</p>
                                        <div className="flex items-center justify-between">
                                            {getStatusBadge(ticket.status)}
                                            <ChevronRight size={14} className="text-gray-300" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat/Detail Area */}
                    <div className="flex-1 flex flex-col bg-white">
                        {selectedTicket ? (
                            <>
                                {/* Chat Header */}
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                            {selectedTicket.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-gray-800">{selectedTicket.subject || 'Support Ticket'}</h2>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">Ticket #{selectedTicket.id}</span>
                                                {getStatusBadge(selectedTicket.status)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/20">
                                    {/* Initial Ticket Description */}
                                    <div className="flex justify-start mb-4">
                                        <div className="flex flex-col max-w-[80%]">
                                            <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedTicket.description}</p>
                                                {selectedTicket.screenshot && (
                                                    <div className="mt-3">
                                                        <img
                                                            src={`${ASSET_URL}/storage/${selectedTicket.screenshot}`}
                                                            alt="Screenshot"
                                                            className="rounded-lg max-h-64 object-contain border border-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => window.open(`${ASSET_URL}/storage/${selectedTicket.screenshot}`, '_blank')}
                                                        />
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-gray-400 mt-2 text-right">
                                                    {new Date(selectedTicket.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {messages.map((msg, index) => {
                                        const isOwn = msg.user_id === user?.id || msg.user?.id === user?.id;
                                        const parentMsg = msg.parent_message || msg.parentMessage;

                                        return (
                                            <div key={index} id={`msg-${msg.id}`} className={`flex flex-col gap-1 mb-4 transition-all duration-500 rounded-xl ${isOwn ? 'items-end' : 'items-start'}`}>
                                                <div className={`flex items-center gap-2 mb-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{msg.user?.name} {msg.user?.is_super_admin ? '(Super Admin)' : ''}</span>
                                                    <span className="text-[10px] text-gray-300">•</span>
                                                    <span className="text-[10px] text-gray-400 uppercase">{new Date(msg.created_at).toLocaleString()}</span>
                                                    <button
                                                        onClick={() => setReplyingTo(msg)}
                                                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                                        title="Reply"
                                                    >
                                                        <Reply size={12} />
                                                    </button>
                                                </div>
                                                <div className={`flex flex-col max-w-[80%]`}>
                                                    <div className={`relative group p-4 rounded-2xl shadow-sm ${isOwn
                                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                                        }`}>
                                                        {parentMsg && (
                                                            <div
                                                                onClick={() => scrollToMessage(parentMsg.id)}
                                                                className={`mb-2 p-2.5 rounded-lg border-l-[4px] text-[11px] cursor-pointer hover:bg-opacity-80 transition-all ${isOwn
                                                                        ? 'bg-black/20 border-blue-300 text-blue-50'
                                                                        : 'bg-gray-100 border-blue-600 text-gray-600'
                                                                    }`}>
                                                                <div className={`font-bold mb-0.5 ${isOwn ? 'text-blue-200' : 'text-blue-600'}`}>
                                                                    {parentMsg.user_id === user?.id ? 'You' : (parentMsg.user?.name || (isOwn ? 'Support' : 'User'))}
                                                                </div>
                                                                <div className="truncate opacity-90 italic">{parentMsg.message}</div>
                                                            </div>
                                                        )}
                                                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                                        {msg.attachment && (
                                                            <div className="mt-3 pt-3 border-t border-gray-200/20">
                                                                {msg.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                                    <img
                                                                        src={`${ASSET_URL}/storage/${msg.attachment}`}
                                                                        alt="Attachment"
                                                                        className="rounded-lg max-h-60 border border-gray-100 cursor-pointer"
                                                                        onClick={() => window.open(`${ASSET_URL}/storage/${msg.attachment}`, '_blank')}
                                                                    />
                                                                ) : (
                                                                    <a
                                                                        href={`${ASSET_URL}/storage/${msg.attachment}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={`text-xs flex items-center gap-2 underline ${isOwn ? 'text-blue-100' : 'text-blue-600'}`}
                                                                    >
                                                                        <ImageIcon size={12} /> View Attachment
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="p-4 border-t border-gray-100 bg-white">
                                    {selectedTicket.status === 'done' ? (
                                        <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm">
                                            <CheckCircle2 size={16} />
                                            <span>This ticket is marked as solved. If you still have issues, please create a new ticket.</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {attachmentPreview && (
                                                <div className="relative inline-block w-20 h-20 mb-2">
                                                    <img src={attachmentPreview} className="w-20 h-20 object-cover rounded-lg border" alt="Preview" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setAttachment(null); setAttachmentPreview(null); }}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            )}
                                            {attachment && !attachmentPreview && (
                                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg text-xs border w-fit mb-2">
                                                    <ImageIcon size={14} /> {attachment.name}
                                                    <button type="button" onClick={() => setAttachment(null)} className="text-red-500 ml-1">×</button>
                                                </div>
                                            )}
                                            {replyingTo && (
                                                <div className="flex items-center justify-between gap-3 bg-blue-50/50 p-3 rounded-xl border-l-4 border-blue-500 mb-2 animate-in slide-in-from-bottom-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Reply size={12} className="text-blue-600" />
                                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none">Replying to {replyingTo.user?.name || (replyingTo.user?.is_super_admin ? 'Support' : 'User')}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 line-clamp-1 truncate">{replyingTo.message}</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setReplyingTo(null)}
                                                        className="p-1 hover:bg-blue-100 rounded-full transition-colors text-blue-600"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                                                <div className="flex-1 relative">
                                                    <textarea
                                                        rows="1"
                                                        placeholder="Type your message..."
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        className="w-full pr-12 pl-4 py-3 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                                e.preventDefault();
                                                                handleSendMessage(e);
                                                            }
                                                        }}
                                                    />
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            ref={replyFileInputRef}
                                                            onChange={handleReplyFileChange}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => replyFileInputRef.current.click()}
                                                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="Attach File"
                                                        >
                                                            <ImageIcon size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={sendingMessage || (!newMessage.trim() && !attachment)}
                                                    className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md shadow-blue-500/20"
                                                >
                                                    <Send size={18} />
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-6 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <MessageSquare size={40} />
                                </div>
                                <h2 className="text-xl font-semibold mb-2 text-gray-600">Your Conversations</h2>
                                <p className="max-w-xs text-sm">Select a ticket from the left or create a new one to start chatting with our support team.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* New Ticket Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h2 className="text-xl font-bold text-gray-800">New Support Ticket</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    placeholder="E.g. Problem with Invoice generation"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Describe the problem</label>
                                <textarea
                                    rows="4"
                                    placeholder="What is the issue you're facing? Please give details..."
                                    value={newTicket.description}
                                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Screenshot (optional)</label>
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${previewUrl ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}`}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        ref={fileInputRef}
                                    />

                                    {previewUrl ? (
                                        <div className="relative group">
                                            <img src={previewUrl} alt="Preview" className="h-32 rounded-lg object-contain" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg transition-opacity">
                                                <p className="text-white text-xs font-medium">Click to change</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                                                <ImageIcon className="text-blue-600" size={24} />
                                            </div>
                                            <p className="text-sm font-medium text-gray-600">Click to upload image</p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Submit Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Support;
