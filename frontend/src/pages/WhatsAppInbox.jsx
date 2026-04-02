import { useState, useEffect } from 'react';
import { whatsappAPI } from '../services/api';
import { toast } from 'react-toastify';
import LogoLoader from '../components/LogoLoader';

// Layout removed - handled by nested routing

const WhatsAppInbox = () => {
  const [inbox, setInbox] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInbox();
  }, []);

  useEffect(() => {
    if (inbox.length > 0 && !selectedLead) {
      setSelectedLead(inbox[0]);
    }
  }, [inbox]);

  const fetchInbox = async () => {
    try {
      const response = await whatsappAPI.inbox();
      const inboxData = response.data.data.inbox || [];
      setInbox(inboxData);
      if (inboxData.length > 0 && !selectedLead) {
        setSelectedLead(inboxData[0]);
      }
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedLead) return;

    try {
      await whatsappAPI.send(selectedLead.lead_id, message);
      setMessage('');
      fetchInbox();
      toast.success('Message sent successfully');
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] p-6 relative page-transition">
      {loading && <div className="side-progress-bar absolute top-0 left-0 right-0 h-1 z-50" />}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">WhatsApp Inbox</h1>
        <div className="flex items-center gap-3">
          <button 
             onClick={fetchInbox}
             disabled={loading}
             className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
             title="Refresh"
          >
             <div className={loading ? 'animate-spin' : ''}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
             </div>
          </button>
        </div>
      </div>

      <div className="flex h-full gap-5">
        {loading && inbox.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full h-[60vh] bg-white rounded-2xl border-2 border-dashed border-gray-100 animate-in fade-in duration-500">
             <LogoLoader text="Loading Conversations..." />
          </div>
        ) : (
          <>
            {/* Lead List */}
            <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                <h2 className="font-bold text-gray-800 text-sm">Conversations</h2>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black">{inbox.length}</span>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {inbox.length === 0 ? (
                   <div className="p-8 text-center text-gray-400">
                      <p className="text-sm">No conversations yet</p>
                   </div>
                ) : (
                  inbox.map((item) => (
                    <div
                      key={item.lead_id}
                      onClick={() => setSelectedLead(item)}
                      className={`p-4 border-b border-gray-50 cursor-pointer transition-all hover:bg-gray-50 ${selectedLead?.lead_id === item.lead_id ? 'bg-blue-50/80 border-l-4 border-l-blue-600' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-gray-900 text-sm">{item.client_name}</div>
                        <div className="text-[10px] text-gray-400 font-medium">
                          {new Date(item.last_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">{item.phone}</div>
                      <div className="text-xs text-gray-400 truncate font-medium bg-gray-50 p-2 rounded-lg">{item.last_message || 'No messages yet'}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
              {selectedLead ? (
                <>
                  <div className="p-4 border-b bg-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                       {selectedLead.client_name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 leading-tight">{selectedLead.client_name}</h2>
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                         <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                         {selectedLead.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-4">
                    <div className="flex flex-col items-center mb-6">
                       <span className="px-3 py-1 bg-white rounded-full text-[10px] text-gray-400 font-bold uppercase tracking-wider border border-gray-100 shadow-sm">
                          {new Date(selectedLead.last_sent_at).toLocaleDateString()}
                       </span>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="max-w-[80%] bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-sm relative group">
                        <p className="text-sm leading-relaxed">{selectedLead.last_message}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                           <span className="text-[9px] font-medium">{new Date(selectedLead.last_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <p className="text-[10px] text-center text-gray-400 font-black uppercase tracking-[0.2em]">
                        System Log: {selectedLead.total_messages} messages recorded
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-blue-300 focus-within:bg-white transition-all">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message here..."
                        className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
                      />
                      <button
                        onClick={handleSend}
                        className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-md flex items-center justify-center disabled:opacity-50"
                        disabled={!message.trim()}
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                     <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">No Active Conversation</p>
                  <p className="text-xs mt-2 text-gray-400">Select a lead from the left to view their chat history and send updates.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WhatsAppInbox;
