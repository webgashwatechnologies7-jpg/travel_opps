import React, { memo } from 'react';
import { RefreshCw, Send, Paperclip, FileText } from 'lucide-react';

const WhatsAppTab = memo(({
    lead,
    whatsappMessages,
    whatsappInput,
    setWhatsappInput,
    whatsappAttachment,
    setWhatsappAttachment,
    sendingWhatsapp,
    fetchWhatsAppMessages,
    handleSendWhatsAppFromTab,
}) => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                    Send and receive WhatsApp messages for this lead. Connect WhatsApp in Settings if messages do not send.
                </p>
                <button
                    type="button"
                    onClick={fetchWhatsAppMessages}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg border border-gray-200 p-4 min-h-[280px] max-h-[400px] space-y-3">
                {whatsappMessages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No WhatsApp messages yet. Type below and click Send.
                    </div>
                ) : (
                    whatsappMessages.map((msg, idx) => (
                        <div
                            key={msg.id || idx}
                            className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.direction === 'inbound'
                                        ? 'bg-white border border-gray-200 text-gray-800'
                                        : 'bg-green-600 text-white'
                                    }`}
                            >
                                {msg.media_url && (
                                    <div className="mb-2">
                                        {msg.media_type === 'image' ? (
                                            <img src={msg.media_url} alt="Shared" className="rounded max-w-full max-h-48" />
                                        ) : (
                                            <a
                                                href={msg.media_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm underline"
                                            >
                                                <FileText className="h-4 w-4" />
                                                {msg.media_type || 'Document'}
                                            </a>
                                        )}
                                    </div>
                                )}
                                {(msg.message || msg.body || msg.text) && (
                                    <div className="text-sm whitespace-pre-wrap">{msg.message || msg.body || msg.text}</div>
                                )}
                                <div className={`text-xs mt-1 ${msg.direction === 'inbound' ? 'text-gray-500' : 'text-green-100'}`}>
                                    {new Date(msg.created_at || msg.sent_at).toLocaleString()}
                                    {msg.direction === 'inbound' && ' · Received'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex gap-2 items-end">
                    <input
                        type="file"
                        id="whatsapp-file"
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => setWhatsappAttachment(e.target.files?.[0] || null)}
                    />
                    <label
                        htmlFor="whatsapp-file"
                        className="p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                        title="Attach file"
                    >
                        <Paperclip className="h-5 w-5 text-gray-600" />
                    </label>
                    <textarea
                        value={whatsappInput}
                        onChange={(e) => setWhatsappInput(e.target.value)}
                        onKeyDown={(e) =>
                            e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendWhatsAppFromTab())
                        }
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none min-h-[40px] max-h-[120px]"
                        rows={2}
                        disabled={sendingWhatsapp || !lead?.phone}
                    />
                    <button
                        type="button"
                        onClick={handleSendWhatsAppFromTab}
                        disabled={sendingWhatsapp || (!whatsappInput.trim() && !whatsappAttachment) || !lead?.phone}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {sendingWhatsapp ? (
                            <>Sending...</>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Send
                            </>
                        )}
                    </button>
                </div>
                {whatsappAttachment && (
                    <p className="text-xs text-gray-500 mt-2">
                        File: {whatsappAttachment.name}
                        <button
                            type="button"
                            onClick={() => setWhatsappAttachment(null)}
                            className="ml-2 text-red-600 hover:underline"
                        >
                            Remove
                        </button>
                    </p>
                )}
                {!lead?.phone && (
                    <p className="text-xs text-amber-600 mt-2">
                        ⚠ No phone number — add it to the lead to enable WhatsApp.
                    </p>
                )}
            </div>
        </div>
    );
});

WhatsAppTab.displayName = 'WhatsAppTab';
export default WhatsAppTab;
