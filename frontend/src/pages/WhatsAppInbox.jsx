import { useState, useEffect } from 'react';
import { whatsappAPI } from '../services/api';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)]">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">WhatsApp Inbox</h1>

        <div className="flex h-full gap-4">
          {/* Lead List */}
          <div className="w-1/3 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold">Conversations ({inbox.length})</h2>
            </div>
            <div className="overflow-y-auto h-[calc(100%-4rem)]">
              {inbox.map((item) => (
                <div
                  key={item.lead_id}
                  onClick={() => setSelectedLead(item)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedLead?.lead_id === item.lead_id ? 'bg-blue-50' : ''
                    }`}
                >
                  <div className="font-semibold text-gray-900">{item.client_name}</div>
                  <div className="text-sm text-gray-500">{item.phone}</div>
                  <div className="text-xs text-gray-400 mt-1 truncate">{item.last_message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(item.last_sent_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 bg-white rounded-lg shadow flex flex-col">
            {selectedLead ? (
              <>
                <div className="p-4 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-900">{selectedLead.client_name}</h2>
                  <p className="text-sm text-gray-500">{selectedLead.phone}</p>
                </div>

                <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                  <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
                    <p className="text-sm text-gray-700">{selectedLead.last_message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(selectedLead.last_sent_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-xs text-center text-gray-400">
                    Total messages: {selectedLead.total_messages}
                  </p>
                </div>

                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSend}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WhatsAppInbox;

