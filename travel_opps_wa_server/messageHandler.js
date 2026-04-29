const axios = require('axios');
const { delay, downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { writeFile } = require('fs/promises');

// In-memory queue storage per session
const queues = {};

async function normalizeBaileysMessage(sock, sessionName, msg) {
    if (!msg.message || msg.key.remoteJid.includes('status@broadcast')) return null;

    // technical protocol messages
    const bodyTextRaw = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '');
    if (
        bodyTextRaw.includes('[protocol message]') ||
        bodyTextRaw.includes('[messageContextInfo message]') ||
        bodyTextRaw.includes('[senderKeyDistributionMessage]')
    ) {
        return null;
    }

    let messageBody = '';
    let mediaUrl = null;
    let mediaType = null;
    let mediaCaption = null;
    let quotedMessageId = null;
    let quotedText = null;
    let isReaction = false;

    const msgContent = msg.message || {};
    const inner = msgContent.viewOnceMessage?.message
        || msgContent.viewOnceMessageV2?.message?.viewOnceMessage?.message
        || msgContent.ephemeralMessage?.message
        || msgContent;

    const METADATA_KEYS = ['messageContextInfo', 'messageSecret', 'contextInfo', 'senderKeyDistributionMessage', 'deviceSentMessage'];
    const messageType = Object.keys(inner).find(k => !METADATA_KEYS.includes(k)) || Object.keys(inner)[0];

    const contextInfo = inner?.extendedTextMessage?.contextInfo || inner?.imageMessage?.contextInfo || inner?.videoMessage?.contextInfo || inner?.documentMessage?.contextInfo || inner?.audioMessage?.contextInfo;
    if (contextInfo?.quotedMessage) {
        quotedMessageId = contextInfo.stanzaId || null;
        quotedText = contextInfo.quotedMessage.conversation || contextInfo.quotedMessage.extendedTextMessage?.text || null;
    }

    switch (messageType) {
        case 'conversation': messageBody = inner.conversation; break;
        case 'extendedTextMessage': messageBody = inner.extendedTextMessage.text; break;
        case 'reactionMessage':
            const reaction = inner.reactionMessage;
            messageBody = reaction.text || '';
            isReaction = true;
            quotedMessageId = reaction.key?.id || null;
            break;
        case 'stickerMessage':
            messageBody = '🎭 Sticker';
            try {
                const buffer = await downloadMediaMessage({ message: inner, key: msg.key }, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
                const fileName = `${msg.key.id}.webp`;
                const filePath = path.join(__dirname, 'media', fileName);
                if (!fs.existsSync(path.join(__dirname, 'media'))) fs.mkdirSync(path.join(__dirname, 'media'), { recursive: true });
                await writeFile(filePath, buffer);
                mediaUrl = `${process.env.NODE_SERVER_URL || 'http://localhost:3001'}/media/${fileName}`;
                mediaType = 'sticker';
            } catch (e) { }
            break;
        case 'audioMessage':
            messageBody = '🎵 Voice Note';
            try {
                const buffer = await downloadMediaMessage({ message: inner, key: msg.key }, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
                const fileName = `${msg.key.id}.ogg`;
                const filePath = path.join(__dirname, 'media', fileName);
                if (!fs.existsSync(path.join(__dirname, 'media'))) fs.mkdirSync(path.join(__dirname, 'media'), { recursive: true });
                await writeFile(filePath, buffer);
                mediaUrl = `${process.env.NODE_SERVER_URL || 'http://localhost:3001'}/media/${fileName}`;
                mediaType = 'audio';
            } catch (e) { }
            break;
        case 'imageMessage':
        case 'videoMessage':
        case 'documentMessage':
            const mediaMsg = inner[messageType];
            const ext = messageType === 'imageMessage' ? '.jpg' : messageType === 'videoMessage' ? '.mp4' : '.pdf';
            try {
                const buffer = await downloadMediaMessage({ message: inner, key: msg.key }, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
                let realName = mediaMsg.fileName || `${msg.key.id}${ext}`;
                const fileName = `${Date.now()}-${realName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
                const mediaDir = path.join(__dirname, 'media');
                if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
                await writeFile(path.join(mediaDir, fileName), buffer);
                mediaUrl = `${process.env.NODE_SERVER_URL || 'http://localhost:3001'}/media/${fileName}`;
                mediaType = messageType.replace('Message', '');
                mediaCaption = mediaMsg.caption || '';
                if (messageType === 'documentMessage') messageBody = realName;
                else if (!messageBody) messageBody = mediaCaption || `Media: ${mediaType}`;
            } catch (err) {
                messageBody = mediaMsg.caption || `Media: ${messageType.replace('Message', '')}`;
            }
            break;
        case 'locationMessage':
            messageBody = `📍 Location: https://maps.google.com/?q=${inner.locationMessage.degreesLatitude},${inner.locationMessage.degreesLongitude}`;
            break;
        case 'liveLocationMessage':
            messageBody = `📍 Live Location: https://maps.google.com/?q=${inner.liveLocationMessage.degreesLatitude},${inner.liveLocationMessage.degreesLongitude}`;
            break;
        case 'contactMessage': messageBody = `👤 Contact: ${inner.contactMessage.displayName}`; break;
        case 'contactsArrayMessage': messageBody = `👥 Contacts (${inner.contactsArrayMessage.contacts?.length || 0})`; break;
        case 'buttonsResponseMessage': messageBody = inner.buttonsResponseMessage?.selectedDisplayText || '🔘 Button Response'; break;
        case 'listResponseMessage': messageBody = inner.listResponseMessage?.title || '📋 List Response'; break;
        case 'templateButtonReplyMessage': messageBody = inner.templateButtonReplyMessage?.selectedDisplayText || '📝 Template Reply'; break;
        case 'pollUpdateMessage': messageBody = `📊 Poll Vote`; break;
        case 'pollCreationMessage':
        case 'pollCreationMessageV2':
        case 'pollCreationMessageV3':
            messageBody = `📊 Poll: ${inner[messageType].name}`;
            break;
        default:
            messageBody = inner?.conversation || inner?.extendedTextMessage?.text || inner?.caption || (messageType ? `[${messageType.replace('Message', '')} message]` : '');
    }

    if (!messageBody && !mediaUrl && !isReaction) return null;

    return {
        message_id: msg.key.id,
        from: msg.key.remoteJid.split('@')[0],
        body: messageBody,
        media_url: mediaUrl,
        media_type: mediaType,
        media_caption: mediaCaption,
        quoted_message_id: quotedMessageId,
        quoted_text: quotedText,
        is_reaction: isReaction,
        direction: msg.key.fromMe ? 'outbound' : 'inbound',
        timestamp: msg.messageTimestamp,
        pushName: msg.pushName || null
    };
}

module.exports = (sock, sessionName, pool) => {

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                const normalized = await normalizeBaileysMessage(sock, sessionName, msg);
                if (!normalized) continue;

                // Sync chat name from sender's pushName or known contact
                if (normalized.pushName) {
                    try {
                        await axios.post(sock.webhookUrl || process.env.LARAVEL_WEBHOOK_URL, {
                            type: 'chat_update',
                            session_name: sessionName,
                            chat_id: msg.key.remoteJid,
                            chat_name: normalized.pushName
                        }, { headers: { 'x-api-key': process.env.WA_GATEWAY_API_KEY || 'crm_secure_gateway_key_99' } });
                    } catch (err) { /* silent sync error */ }
                }

                // Resolve chat name (Group subject)
                let chatName = normalized.pushName;
                if (msg.key.remoteJid.includes('@g.us')) {
                    try {
                        const groupMeta = await sock.groupMetadata(msg.key.remoteJid);
                        chatName = groupMeta.subject;
                    } catch (e) { }
                }

                // Push to Laravel Webhook
                try {
                    const payload = {
                        type: 'incoming_message',
                        session_name: sessionName,
                        chat_id: msg.key.remoteJid,
                        remote_jid_alt: msg.key.remoteJidAlt || null,
                        chat_name: chatName,
                        ...normalized
                    };

                    await axios.post(sock.webhookUrl || process.env.LARAVEL_WEBHOOK_URL, payload, {
                        headers: { 'x-api-key': process.env.WA_GATEWAY_API_KEY || 'crm_secure_gateway_key_99' }
                    });
                } catch (error) {
                    console.error(`[Webhook Error] Failed to forward:`, error.message);
                }
            }
        }
    });

    sock.ev.on('messages.update', async (m) => {
        for (const { key, update } of m) {
            if (update.status) {
                const statusMap = { 2: 'sent', 3: 'delivered', 4: 'read', 5: 'played' };
                if (statusMap[update.status]) {
                    try {
                        await axios.post(sock.webhookUrl || process.env.LARAVEL_WEBHOOK_URL, {
                            type: 'message_receipt',
                            session_name: sessionName,
                            message_id: key.id,
                            status: statusMap[update.status]
                        }, { headers: { 'x-api-key': process.env.WA_GATEWAY_API_KEY || 'crm_secure_gateway_key_99' } });
                    } catch (error) {
                        console.error('Error forwarding receipt to Laravel:', error.message);
                    }
                }
            }
        }
    });

    sock.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
            if (update.subject) {
                try {
                    await axios.post(sock.webhookUrl || process.env.LARAVEL_WEBHOOK_URL, {
                        type: 'chat_update',
                        session_name: sessionName,
                        chat_id: update.id,
                        chat_name: update.subject
                    }, { headers: { 'x-api-key': process.env.WA_GATEWAY_API_KEY || 'crm_secure_gateway_key_99' } });
                } catch (error) {
                    console.error('Error forwarding group update to Laravel:', error.message);
                }
            }
        }
    });

    sock.ev.on('presence.update', async ({ id, presences }) => {
        try {
            const jid = id;
            const presence = presences[Object.keys(presences)[0]] || presences[id];
            if (presence) {
                await axios.post(sock.webhookUrl || process.env.LARAVEL_WEBHOOK_URL, {
                    type: 'presence_update',
                    session_name: sessionName,
                    chat_id: jid,
                    presence: typeof presence === 'string' ? presence : (presence.lastKnownPresence || 'available')
                }, { headers: { 'x-api-key': process.env.WA_GATEWAY_API_KEY || 'crm_secure_gateway_key_99' } });
            }
        } catch (error) {
            console.error('Error forwarding presence to Laravel:', error.message);
        }
    });
};

// Queue Manager for anti-ban
async function processQueue(sessionName) {
    if (!queues[sessionName] || queues[sessionName].processing) return;

    queues[sessionName].processing = true;
    while (queues[sessionName].items.length > 0) {
        const { sock, to, content, resolve, reject } = queues[sessionName].items.shift();

        try {
            const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
            const result = await sock.sendMessage(jid, content);
            resolve(result);
        } catch (error) {
            const errMsg = error?.message || '';
            if (errMsg.includes('Connection Closed') || errMsg.includes('lost') || errMsg.includes('timed out')) {
                console.warn(`[Queue ${sessionName}] Connection issue, retrying in 3s: ${errMsg}`);
                await new Promise(r => setTimeout(r, 3000));
                try {
                    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
                    const retryResult = await sock.sendMessage(jid, content);
                    resolve(retryResult);
                } catch (retryErr) {
                    reject(retryErr);
                }
            } else {
                reject(error);
            }
        }

        if (queues[sessionName].items.length > 0) {
            await new Promise(r => setTimeout(r, 300));
        }
    }
    queues[sessionName].processing = false;
}

function addToQueue(sock, sessionName, to, content) {
    if (!queues[sessionName]) {
        queues[sessionName] = { items: [], processing: false };
    }

    return new Promise((resolve, reject) => {
        queues[sessionName].items.push({ sock, to, content, resolve, reject });
        processQueue(sessionName);
    });
}

async function sendWhatsAppMessage(sock, sessionName, toPhone, messageBody, quotedMessageId = null, quotedText = null) {
    const content = { text: messageBody };
    if (quotedMessageId) {
        const jid = toPhone.includes('@') ? toPhone : `${toPhone}@s.whatsapp.net`;
        content.contextInfo = {
            stanzaId: quotedMessageId,
            participant: jid,
            quotedMessage: {
                conversation: quotedText || ""
            }
        };
    }
    return addToQueue(sock, sessionName, toPhone, content);
}

async function sendWhatsAppMedia(sock, sessionName, toPhone, filePath, caption, type, originalFileName) {
    let content;
    const jid = toPhone.includes('@') ? toPhone : `${toPhone}@s.whatsapp.net`;

    if (type === 'document') {
        const ext = (originalFileName || filePath || '').split('.').pop()?.toLowerCase() || 'pdf';
        const mimeMap = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
        content = { document: { url: filePath }, mimetype: mimeMap[ext] || 'application/octet-stream', fileName: originalFileName || `document.${ext}`, caption: caption };
    } else if (type === 'audio') {
        content = { audio: { url: filePath }, mimetype: 'audio/mp4', ptt: false };
    } else if (type === 'video') {
        content = { video: { url: filePath }, caption: caption, mimetype: 'video/mp4' };
    } else if (type === 'sticker') {
        content = { sticker: { url: filePath } };
    } else {
        content = { image: { url: filePath }, caption: caption };
    }
    return addToQueue(sock, sessionName, toPhone, content);
}

async function fetchMessagesHistory(sock, jid, count = 50) {
    const sessionName = 'history_sync'; // Placeholder if not strictly needed for normalization
    try {
        const rawMessages = await sock.fetchMessagesFromWA(jid, count);
        const normalized = [];
        for (const msg of rawMessages) {
            const n = await normalizeBaileysMessage(sock, sessionName, msg);
            if (n) normalized.push(n);
        }
        return normalized;
    } catch (error) {
        console.error(`[HistorySync] Error fetching for ${jid}:`, error.message);
        throw error;
    }
}

module.exports.sendWhatsAppMessage = sendWhatsAppMessage;
module.exports.sendWhatsAppMedia = sendWhatsAppMedia;
module.exports.fetchMessagesHistory = fetchMessagesHistory;
