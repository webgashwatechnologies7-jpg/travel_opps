import React, { memo } from 'react';
import { RefreshCw } from 'lucide-react';
import ChatWindow from '../WhatsAppWeb/ChatWindow';

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
    loadingMessages,
    profilePicUrl,
}) => {
    // Determine JID format
    let phone = lead?.phone ? lead.phone.replace(/\D/g, '') : '';
    if (phone.length === 10) phone = '91' + phone;
    const jid = phone ? phone + '@s.whatsapp.net' : 'No Phone Number';

    const chat = {
        chat_id: jid,
        chat_name: lead?.client_name ? `${lead.client_name} (${phone})` : jid,
        status: 'connected'
    };

    return (
        <div className="flex flex-col h-full overflow-hidden" style={{ minHeight: '600px' }}>
            <div className="flex-1 flex flex-col h-full relative">
                {!lead?.phone ? (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                        <p className="text-sm text-amber-600">
                            ⚠ No phone number — add it to the lead to enable WhatsApp.
                        </p>
                    </div>
                ) : (
                    <ChatWindow
                        chat={chat}
                        messages={whatsappMessages}
                        onSendMessage={(text, quotedId, quotedPreview) => handleSendWhatsAppFromTab(text, null, quotedId, quotedPreview)}
                        onSendMedia={(file, quotedId, quotedPreview) => handleSendWhatsAppFromTab('', file, quotedId, quotedPreview)}
                        isSending={sendingWhatsapp}
                        isTyping={false}
                        loadingMessages={loadingMessages}
                        profilePicUrl={profilePicUrl}
                        onRefresh={fetchWhatsAppMessages}
                    />
                )}
            </div>
        </div>
    );
});

WhatsAppTab.displayName = 'WhatsAppTab';
export default WhatsAppTab;
