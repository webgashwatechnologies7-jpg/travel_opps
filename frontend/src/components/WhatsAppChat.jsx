import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Phone, Video, Info, Smartphone } from 'lucide-react';
import { useErrorHandler } from '../hooks/useErrorHandler';

const WhatsAppChat = ({ lead, onMessageSent }) => {
  const { executeWithErrorHandling } = useErrorHandler();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [waStatus, setWaStatus] = useState('Checking...');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation and status
  useEffect(() => {
    if (lead?.phone) {
      loadConversation();
      checkConnectionStatus();
    }
  }, [lead?.phone]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp-web/status');
      const data = await response.json();
      setWaStatus(data.status || 'Disconnected');
    } catch (err) {
      setWaStatus('Disconnected');
    }
  };

  // Simulate online status
  useEffect(() => {
    setIsOnline(Math.random() > 0.3); // Random online status for demo
  }, [lead?.phone]);

  const loadConversation = async () => {
    const result = await executeWithErrorHandling(async () => {
      const response = await fetch(`/api/whatsapp/conversation?phone=${encodeURIComponent(lead.phone)}&limit=50`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to load conversation');
      }
      
      return data.data;
    });

    if (result.success) {
      setMessages(result.data || []);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    // Check WhatsApp Connection
    if (waStatus !== 'Connected') {
      setShowWarningModal(true);
      return;
    }

    setLoading(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    // Add message to UI immediately for better UX
    const tempMessage = {
      id: Date.now(),
      message: messageText,
      direction: 'outbound',
      status: 'sending',
      created_at: new Date().toISOString(),
      sender: 'You'
    };

    setMessages(prev => [...prev, tempMessage]);

    const result = await executeWithErrorHandling(async () => {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: lead.phone,
          message: messageText,
          lead_id: lead.id
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to send message');
      }
      
      return data.data;
    });

    if (result.success) {
      // Update temp message with real data
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, id: result.message_id, status: 'sent' }
          : msg
      ));
      
      onMessageSent?.(result);
    } else {
      // Remove temp message on failure
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(messageText); // Restore message text
    }

    setLoading(false);
  };

  const sendMedia = async (file) => {
    if (!file || loading) return;

    // Check WhatsApp Connection
    if (waStatus !== 'Connected') {
      setShowWarningModal(true);
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('to', lead.phone);
    formData.append('media_file', file);
    formData.append('lead_id', lead.id);

    // Add temporary media message
    const tempMessage = {
      id: Date.now(),
      media_url: URL.createObjectURL(file),
      media_type: file.type.startsWith('image/') ? 'image' : 'document',
      direction: 'outbound',
      status: 'sending',
      created_at: new Date().toISOString(),
      sender: 'You'
    };

    setMessages(prev => [...prev, tempMessage]);

    const result = await executeWithErrorHandling(async () => {
      const response = await fetch('/api/whatsapp/send-media', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to send media');
      }
      
      return data.data;
    });

    if (result.success) {
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, id: result.message_id, status: 'sent', media_url: result.media_url }
          : msg
      ));
    } else {
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sending':
        return '⏳';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'failed':
        return '❌';
      default:
        return '✓';
    }
  };

  const localUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
              {lead?.client_name?.charAt(0) || 'C'}
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              isOnline ? 'bg-green-400' : 'bg-gray-400'
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{lead?.client_name || 'Customer'}</h3>
            <div className="flex items-center gap-2">
               <p className="text-sm text-gray-500">{lead?.phone}</p>
               <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${waStatus === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {waStatus === 'Connected' ? 'WA Connected' : 'WA Disconnected'}
               </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Info className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.direction === 'outbound' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.direction === 'outbound'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              {message.media_url && (
                <div className="mb-2">
                  {message.media_type === 'image' ? (
                    <img
                      src={message.media_url}
                      alt="Shared media"
                      className="rounded-lg max-w-full h-auto"
                    />
                  ) : (
                    <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                      <Paperclip className="w-4 h-4" />
                      <span className="text-sm">Document</span>
                    </div>
                  )}
                  {message.media_caption && (
                    <p className="text-sm mt-1 opacity-90">{message.media_caption}</p>
                  )}
                </div>
              )}
              
              {message.message && (
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.message}
                </p>
              )}
              
              <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                <span>{formatTime(message.created_at)}</span>
                {message.direction === 'outbound' && (
                  <span>{getStatusIcon(message.status)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) sendMedia(file);
            }}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={1}
              disabled={loading}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <button className="absolute right-2 bottom-2 p-1 hover:bg-gray-100 rounded transition-colors">
              <Smile className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || loading}
            className={`p-2 rounded-full transition-colors ${
              newMessage.trim() && !loading
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Custom Connection Warning Modal */}
      {showWarningModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-md transition-all duration-500 rounded-lg">
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300 border border-gray-100">
            <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600"></div>
            
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className="bg-emerald-50 p-4 rounded-2xl relative">
                  <Smartphone className="h-10 w-10 text-emerald-600" />
                  <div className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                  </div>
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 leading-tight">
                  WhatsApp Disconnected
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-3 leading-relaxed">
                  Please connect your WhatsApp from the main menu to send messages.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-6 group hover:border-emerald-200 transition-colors">
                <div className="flex gap-3">
                  <div className="bg-white p-2 rounded-xl shadow-sm group-hover:bg-emerald-50 transition-colors">
                    <Info className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Authorization Requirement</h4>
                    <p className="text-xs text-gray-700 font-bold leading-relaxed">
                      Login only with your registered number:<br/>
                      <span className="text-emerald-700 text-sm font-black underline decoration-emerald-200 underline-offset-4">
                        {localUser?.phone || 'Your Number'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowWarningModal(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-100 hover:shadow-xl hover:shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wide text-xs"
              >
                Got it, Thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppChat;
