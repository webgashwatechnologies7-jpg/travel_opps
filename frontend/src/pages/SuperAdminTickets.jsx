import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SuperAdminLayout from '../components/SuperAdminLayout';
import {
    MessageSquare,
    Clock,
    CheckCircle2,
    Send,
    Image as ImageIcon,
    AlertCircle,
    ChevronRight,
    User,
    Building2,
    Filter,
    Reply,
    X
} from 'lucide-react';
import { superAdminAPI, ASSET_URL } from '../services/api';
import { toast } from 'react-toastify';

const SuperAdminTickets = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [attachment, setAttachment] = useState(null);
    const [attachmentPreview, setAttachmentPreview] = useState(null);
    const chatEndRef = useRef(null);
    const fileInputRef = useRef(null);

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
            const interval = setInterval(() => fetchTicketDetails(selectedTicket.id), 10000);
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
            const res = await superAdminAPI.getTickets();
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
            const res = await superAdminAPI.getTicket(id);
            if (res.data?.success) {
                setMessages(res.data.data.messages);
                // Sync local selected ticket state with fetched data
                if (res.data.data.status !== selectedTicket?.status) {
                    setSelectedTicket(res.data.data);
                    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: res.data.data.status } : t));
                }
            }
        } catch (err) {
            console.error('Failed to fetch messages');
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await superAdminAPI.updateTicketStatus(id, status);
            if (res.data?.success) {
                toast.success(`Status updated to ${status}`);
                setSelectedTicket(prev => ({ ...prev, status }));
                setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
            }
        } catch (err) {
            toast.error('Failed to update status');
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
                    is_super_admin: true
                },
                parent_message: replyingTo,
                parentMessage: replyingTo,
                is_optimistic: true
            };
            setMessages(prev => [...prev, optimisticMessage]);
            const messageToSend = newMessage;
            setNewMessage('');

            const res = await superAdminAPI.sendTicketMessage(selectedTicket.id, {
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size should be less than 10MB');
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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'on working':
                return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={10} /> On Working</span>;
            case 'done':
                return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={10} /> Done</span>;
            default:
                return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><AlertCircle size={10} /> Pending</span>;
        }
    };

    const filteredTickets = tickets.filter(t => statusFilter === 'all' || t.status === statusFilter);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50">
                <div className="flex flex-1 overflow-hidden shadow-sm">
                    {/* Sidebar / Ticket List */}
                    <div className="w-1/3 min-w-[320px] max-w-md border-r bg-white flex flex-col">
                        <div className="p-6 border-b">
                            <h1 className="text-xl font-bold text-gray-900 mb-4">Support Management</h1>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 bg-gray-50 border-gray-200 rounded-lg text-sm focus:ring-blue-500 outline-none p-2"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Statues</option>
                                    <option value="pending">Pending</option>
                                    <option value="on working">On Working</option>
                                    <option value="done">Done</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading && tickets.length === 0 ? (
                                <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="px-6 py-12 text-center text-gray-500">
                                    <MessageSquare className="mx-auto w-12 h-12 text-gray-200 mb-4" />
                                    <p className="text-sm">No tickets found in this category.</p>
                                </div>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => {
                                            setSelectedTicket(ticket);
                                            navigate(`/super-admin/tickets/${ticket.id}`);
                                            setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, unread_count: 0 } : t));
                                        }}
                                        className={`p-5 border-b cursor-pointer transition-all ${selectedTicket?.id === ticket.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'} ${ticket.unread_count > 0 ? 'bg-blue-50/20' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                                                <Building2 size={10} />
                                                {ticket.company?.name || 'Unknown Company'}
                                            </div>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(ticket.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className={`${ticket.unread_count > 0 ? 'font-bold text-blue-900' : 'font-semibold text-gray-900'} mb-1 text-sm line-clamp-1 flex items-center gap-2`}>
                                            {ticket.unread_count > 0 && <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 animate-pulse"></span>}
                                            {ticket.subject || 'No Subject'}
                                        </h3>
                                        <p className={`text-xs line-clamp-2 mb-3 leading-relaxed ${ticket.unread_count > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{ticket.description}</p>
                                        <div className="flex items-center justify-between">
                                            {getStatusBadge(ticket.status)}
                                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                <User size={10} />
                                                {ticket.user?.name}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Ticket Detail / Chat Area */}
                    <div className="flex-1 flex flex-col bg-white">
                        {selectedTicket ? (
                            <>
                                {/* Header */}
                                <div className="px-8 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-20 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {selectedTicket.company?.name?.charAt(0) || 'C'}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">{selectedTicket.subject || 'Support Ticket'}</h2>
                                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                                <span className="flex items-center gap-1"><Building2 size={14} /> {selectedTicket.company?.name}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><User size={14} /> {selectedTicket.user?.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Status</label>
                                            <select
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 outline-none transition-all ${selectedTicket.status === 'done' ? 'bg-green-50 border-green-200 text-green-700' :
                                                    selectedTicket.status === 'on working' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                                        'bg-yellow-50 border-yellow-200 text-yellow-700'
                                                    }`}
                                                value={selectedTicket.status}
                                                onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                                            >
                                                <option value="pending">PENDING</option>
                                                <option value="on working">ON WORKING</option>
                                                <option value="done">DONE</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/30">
                                    {/* Initial description from client */}
                                    <div className="flex flex-col gap-1 items-start">
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedTicket.user?.name}</span>
                                            <span className="text-[10px] text-gray-300">•</span>
                                            <span className="text-[10px] text-gray-400 uppercase">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                                        </div>
                                        <div className="bg-white border rounded-2xl rounded-tl-none p-5 shadow-sm max-w-2xl">
                                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                                            {selectedTicket.screenshot && (
                                                <div className="mt-4 border-t pt-4">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Attachment</label>
                                                    <img
                                                        src={`${ASSET_URL}/storage/${selectedTicket.screenshot}`}
                                                        alt="Screenshot"
                                                        className="rounded-xl max-h-80 border cursor-pointer hover:shadow-md transition-shadow"
                                                        onClick={() => window.open(`${ASSET_URL}/storage/${selectedTicket.screenshot}`, '_blank')}
                                                    />
                                                </div>
                                            )}
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
                                                <div className={`relative group p-4 rounded-2xl shadow-sm max-w-2xl ${isOwn
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : 'bg-white border text-gray-800 rounded-tl-none'
                                                    }`}>
                                                    {parentMsg && (
                                                        <div
                                                            onClick={() => scrollToMessage(parentMsg.id)}
                                                            className={`mb-2 p-2.5 rounded-lg border-l-[4px] text-[11px] cursor-pointer hover:bg-opacity-80 transition-all ${isOwn
                                                                ? 'bg-black/20 border-blue-300 text-blue-50'
                                                                : 'bg-gray-100 border-blue-600 text-gray-600'
                                                                }`}>
                                                            <div className={`font-bold mb-0.5 ${isOwn ? 'text-blue-200' : 'text-blue-600'}`}>
                                                                {parentMsg.user_id === user?.id ? 'You' : (parentMsg.user?.name || 'User')}
                                                            </div>
                                                            <div className="truncate opacity-90 italic">{parentMsg.message}</div>
                                                        </div>
                                                    )}
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                                                    {msg.attachment && (
                                                        <div className="mt-3 pt-3 border-t border-white/20">
                                                            {msg.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                                                <img
                                                                    src={`${ASSET_URL}/storage/${msg.attachment}`}
                                                                    alt="Attachment"
                                                                    className="rounded-lg max-h-60 border bg-white/10 cursor-pointer"
                                                                    onClick={() => window.open(`${ASSET_URL}/storage/${msg.attachment}`, '_blank')}
                                                                />
                                                            ) : (
                                                                <a
                                                                    href={`${ASSET_URL}/storage/${msg.attachment}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`text-xs flex items-center gap-2 underline ${isOwn ? 'text-blue-50' : 'text-blue-600'}`}
                                                                >
                                                                    <ImageIcon size={12} /> View Attachment
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Internal Reply Box */}
                                <div className="p-6 border-t bg-white sticky bottom-0 z-10">
                                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex flex-col gap-2">
                                        {attachmentPreview && (
                                            <div className="relative inline-block w-20 h-20 mb-2">
                                                <img src={attachmentPreview} className="w-20 h-20 object-cover rounded-lg border" alt="Preview" />
                                                <button
                                                    type="button"
                                                    onClick={() => { setAttachment(null); setAttachmentPreview(null); }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                                                >
                                                    <Filter size={10} className="rotate-45" />
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
                                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none">Replying to {replyingTo.user?.name}</span>
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
                                        <div className="flex-1 bg-gray-50 rounded-2xl p-2 border focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                            <textarea
                                                rows="3"
                                                placeholder="Type your reply to the client..."
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                className="w-full px-4 py-2 bg-transparent border-none outline-none text-sm resize-none"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage(e);
                                                    }
                                                }}
                                            />
                                            <div className="flex justify-between items-center px-4 py-2 border-t mt-1">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        ref={fileInputRef}
                                                        onChange={handleFileChange}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current.click()}
                                                        className="text-gray-500 hover:text-blue-600 transition-colors"
                                                        title="Attach File"
                                                    >
                                                        <ImageIcon size={20} />
                                                    </button>
                                                    <p className="text-[10px] text-gray-400 font-medium">Replying as Super Admin • Emails will be sent on completion</p>
                                                </div>
                                                {newMessage.trim() && (
                                                    <button
                                                        type="submit"
                                                        disabled={sendingMessage}
                                                        className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-all font-bold text-xs shadow-md shadow-blue-500/10 flex items-center gap-2 animate-in fade-in zoom-in duration-200"
                                                    >
                                                        {sendingMessage ? 'Sending...' : (
                                                            <>
                                                                <Send size={14} /> Send Reply
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50 p-12 text-center">
                                <div className="w-24 h-24 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                                    <MessageSquare size={48} className="text-blue-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Help Desk</h2>
                                <p className="max-w-sm text-gray-500 leading-relaxed">Select a support ticket from the list to view details, reply to clients, and manage system statuses.</p>
                            </div>
                        )}
                    </div>
                </div>
    </div>
  );
};

export default SuperAdminTickets;
