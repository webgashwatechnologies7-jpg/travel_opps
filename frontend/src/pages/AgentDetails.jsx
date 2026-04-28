import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { accountsAPI, whatsappWebAPI } from '../services/api';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, User, Mail, Phone, Building, 
  Calendar, MessageCircle, ClipboardList, 
  Send, Paperclip, MoreVertical, Search,
  ExternalLink, Clock, MapPin
} from 'lucide-react';
import LogoLoader from '../components/LogoLoader';

const AgentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // WhatsApp State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchAgentDetails();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'whatsapp' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const fetchAgentDetails = async () => {
    try {
      setLoading(true);
      const response = await accountsAPI.getAgent(id);
      if (response.data.success) {
        setAgent(response.data.data);
        setMessages(response.data.data.whatsapp_messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch agent details:', error);
      toast.error('Failed to load agent details');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !agent?.mobile) return;

    setSending(true);
    try {
      const phoneStr = agent.mobile.replace(/\D/g, '');
      const chatId = phoneStr.length <= 10 ? `91${phoneStr}@s.whatsapp.net` : `${phoneStr}@s.whatsapp.net`;
      
      const response = await whatsappWebAPI.sendMessage({
        chat_id: chatId,
        message: newMessage
      });

      if (response.data.success) {
        const newMsg = {
          id: Date.now(),
          message: newMessage,
          from_me: true,
          created_at: new Date().toISOString(),
          type: 'text'
        };
        setMessages([...messages, newMsg]);
        setNewMessage('');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('WhatsApp service not connected');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LogoLoader text="Loading agent details..." />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Agent not found</h2>
        <button onClick={() => navigate('/accounts/agents')} className="mt-4 text-blue-600 hover:underline">
          Back to Agents
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/accounts/agents')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-2xl uppercase">
            {agent.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
            <p className="text-gray-500 flex items-center gap-1">
              <Building size={14} /> {agent.company}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <a 
            href={`tel:${agent.mobile}`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium border border-gray-200"
          >
            <Phone size={16} /> Call
          </a>
          <button 
            onClick={() => setActiveTab('whatsapp')}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-all font-medium border border-green-200"
          >
            <MessageCircle size={16} /> WhatsApp
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview', icon: User },
          { id: 'queries', label: 'Assigned Queries', icon: ClipboardList },
          { id: 'whatsapp', label: 'WhatsApp Chat', icon: MessageCircle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="md:col-span-2 space-y-6">
              {/* Profile Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User size={18} className="text-blue-600" /> Agent Profile
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <DetailItem icon={Mail} label="Email Address" value={agent.email} />
                  <DetailItem icon={Phone} label="Mobile Number" value={agent.mobile} />
                  <DetailItem icon={MapPin} label="City" value={agent.city} />
                  <DetailItem icon={Calendar} label="Registered On" value={agent.created_at} />
                  <DetailItem icon={Building} label="GST Number" value={agent.gst} />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Queries</p>
                    <h4 className="text-3xl font-black text-gray-900">{agent.queries?.length || 0}</h4>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <ClipboardList size={24} />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Messages</p>
                    <h4 className="text-3xl font-black text-gray-900">{messages.length}</h4>
                  </div>
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                    <MessageCircle size={24} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Action Card */}
              <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white">
                <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/20">
                    Send Mass Email
                  </button>
                  <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/20">
                    View Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agent.queries?.map(query => (
                    <tr key={query.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{query.client_name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{query.destination || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          query.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {query.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{query.created_at}</td>
                      <td className="px-6 py-4">
                        <Link 
                          to={`/leads/${query.id}`}
                          className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-bold"
                        >
                          View <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {(!agent.queries || agent.queries.length === 0) && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                        No queries assigned to this agent yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[600px] flex flex-col animate-in fade-in duration-500">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold">
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-gray-900">WhatsApp Chat</div>
                  <div className="text-xs text-green-500 font-medium">{agent.mobile}</div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {messages.map((msg, idx) => (
                <div 
                  key={msg.id || idx} 
                  className={`flex ${msg.from_me ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${
                    msg.from_me 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  }`}>
                    {msg.message}
                    <div className={`text-[10px] mt-1 opacity-70 flex items-center gap-1 ${msg.from_me ? 'justify-end' : 'justify-start'}`}>
                      <Clock size={10} /> {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageCircle size={48} className="opacity-20 mb-2" />
                  <p className="text-sm">No messages yet. Start a conversation!</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  disabled={sending || !newMessage.trim()}
                  type="submit"
                  className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value || 'N/A'}</p>
    </div>
  </div>
);

export default AgentDetails;
