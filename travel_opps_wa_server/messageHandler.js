const axios = require('axios');
const { delay, downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { writeFile } = require('fs/promises');

// In-memory queue storage per session
const queues = {};

module.exports = (sock, sessionName, pool) => {

    sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
            for (const msg of m.messages) {
                if (!msg.key.remoteJid.includes('status@broadcast')) {
                    // Sync chat name from sender's pushName or known contact
                    if (msg.pushName) {
                        try {
                            await axios.post(process.env.LARAVEL_WEBHOOK_URL, {
                                type: 'chat_update',
                                session_name: sessionName,
                                chat_id: msg.key.remoteJid,
                                chat_name: msg.pushName
                            }, { headers: { 'x-api-key': process.env.WA_GATEWAY_API_KEY || 'travelops_secure_gateway_key_99' } });
                        } catch (err) { /* silent sync error */ }
                    }

                    let messageBody = '';
                    let mediaUrl = null;
                    let mediaType = null;
                    let mediaCaption = null;
                    let quotedMessageId = null;
                    let quotedText = null;
                    let isReaction = false;


                    const msgContent = msg.message || {};
                    // Unwrap viewOnceMessage or ephemeralMessage wrappers
                    const inner = msgContent.viewOnceMessage?.message
                        || msgContent.viewOnceMessageV2?.message?.viewOnceMessage?.message
                        || msgContent.ephemeralMessage?.message
                        || msgContent;

                    // Keys that are Baileys METADATA, NOT content types — must skip these
                    const METADATA_KEYS = [
                        'messageContextInfo', 'messageSecret', 'contextInfo',
                        'senderKeyDistributionMessage', 'deviceSentMessage'
                    ];

                    // Pick the FIRST key that is actually a content type
                    const messageType = Object.keys(inner).find(k => !METADATA_KEYS.includes(k))
                        || Object.keys(inner)[0];

                    // --- Extract quoted/reply context ---
                    const contextInfo = inner?.extendedTextMessage?.contextInfo
                        || inner?.imageMessage?.contextInfo
                        || inner?.videoMessage?.contextInfo
                        || inner?.documentMessage?.contextInfo
                        || inner?.audioMessage?.contextInfo;

                    if (contextInfo?.quotedMessage) {
                        quotedMessageId = contextInfo.stanzaId || null;
                        quotedText = contextInfo.quotedMessage.conversation
                            || contextInfo.quotedMessage.extendedTextMessage?.text
                            || null;
                    }

                    switch (messageType) {
                        case 'conversation':
                            messageBody = inner.conversation;
                            break;

                        case 'extendedTextMessage':
                            messageBody = inner.extendedTextMessage.text;
                            break;

                        case 'reactionMessage': {
                            const reaction = inner.reactionMessage;
                            messageBody = reaction.text || ''; // the emoji like 👍
                            isReaction = true;
                            // The key of the message being reacted to
                            quotedMessageId = reaction.key?.id || null;
                            break;
                        }

                        case 'stickerMessage':
                            messageBody = '🎭 Sticker';
                            // Try to download sticker
                            try {
                                const buffer = await downloadMediaMessage({ message: inner, key: msg.key }, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
                                const fileName = `${msg.key.id}.webp`;
                                const filePath = path.join(__dirname, 'media', fileName);
                                await writeFile(filePath, buffer);
                                mediaUrl = `${process.env.NODE_SERVER_URL || 'http://localhost:3001'}/media/${fileName}`;
                                mediaType = 'sticker';
                            } catch (e) { /* sticker download failed, show text fallback */ }
                            break;

                        case 'audioMessage':
                            messageBody = '🎵 Voice Note';
                            try {
                                const buffer = await downloadMediaMessage({ message: inner, key: msg.key }, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
                                const fileName = `${msg.key.id}.ogg`;
                                const filePath = path.join(__dirname, 'media', fileName);
                                await writeFile(filePath, buffer);
                                mediaUrl = `${process.env.NODE_SERVER_URL || 'http://localhost:3001'}/media/${fileName}`;
                                mediaType = 'audio';
                            } catch (e) { /* audio download failed */ }
                            break;

                        case 'imageMessage':
                        case 'videoMessage':
                        case 'documentMessage': {
                            const mediaMsg = inner[messageType];
                            const ext = messageType === 'imageMessage' ? '.jpg'
                                : messageType === 'videoMessage' ? '.mp4' : '.pdf';
                            try {
                                const buffer = await downloadMediaMessage({ message: inner, key: msg.key }, 'buffer', {}, { logger: console, reuploadRequest: sock.updateMediaMessage });
                                // For Documents, use the REAL filename from the message
                                let realName = mediaMsg.fileName || `${msg.key.id}${ext}`;
                                const fileName = `${Date.now()}-${realName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
                                
                                const mediaDir = path.join(__dirname, 'media');
                                if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir, { recursive: true });
                                const filePath = path.join(mediaDir, fileName);
                                await writeFile(filePath, buffer);

                                mediaUrl = `${process.env.NODE_SERVER_URL || 'http://localhost:3001'}/media/${fileName}`;
                                mediaType = messageType.replace('Message', '');
                                mediaCaption = mediaMsg.caption || '';
                                
                                // Set the message body to the REAL filename
                                if (messageType === 'documentMessage') {
                                    messageBody = realName;
                                } else if (!messageBody) {
                                    messageBody = mediaCaption || `Media: ${mediaType}`;
                                }
                            } catch (err) {
                                console.error('Error downloading media:', err.message);
                                messageBody = mediaMsg.caption || `Media: ${messageType.replace('Message', '')}`;
                            }
                            break;
                        }

                        case 'locationMessage': {
                            const loc = inner.locationMessage;
                            messageBody = `📍 Location: https://maps.google.com/?q=${loc.degreesLatitude},${loc.degreesLongitude}`;
                            break;
                        }

                        case 'liveLocationMessage': {
                            const loc = inner.liveLocationMessage;
                            messageBody = `📍 Live Location: https://maps.google.com/?q=${loc.degreesLatitude},${loc.degreesLongitude}`;
                            break;
                        }

                        case 'contactMessage':
                            messageBody = `👤 Contact: ${inner.contactMessage.displayName}`;
                            break;

                        case 'contactsArrayMessage':
                            messageBody = `👥 Contacts (${inner.contactsArrayMessage.contacts?.length || 0})`;
                            break;

                        case 'buttonsResponseMessage':
                            messageBody = inner.buttonsResponseMessage?.selectedDisplayText || '🔘 Button Response';
                            break;

                        case 'listResponseMessage':
                            messageBody = inner.listResponseMessage?.title || '📋 List Response';
                            break;

                        case 'templateButtonReplyMessage':
                            messageBody = inner.templateButtonReplyMessage?.selectedDisplayText || '📝 Template Reply';
                            break;

                        case 'pollUpdateMessage':
                            messageBody = `📊 Poll Vote`;
                            break;

                        case 'pollCreationMessage':
                        case 'pollCreationMessageV2':
                        case 'pollCreationMessageV3': {
                            const poll = inner[messageType];
                            messageBody = `📊 Poll: ${poll.name}`;
                            break;
                        }

                        default:
                            messageBody = inner?.conversation
                                || inner?.extendedTextMessage?.text
                                || inner?.caption
                                || (messageType ? `[${messageType.replace('Message', '')} message]` : '');
                    }

                    // Resolve chat name (Group subject or Push name)
                    let chatName = msg.pushName || null;
                    if (msg.key.remoteJid.includes('@g.us')) {
                        try {
                            // For groups, pushName is the sender. We need the group subject.
                            // We use a small optimization/cache if possible, but for now just fetch.
                            const groupMeta = await sock.groupMetadata(msg.key.remoteJid);
                            chatName = groupMeta.subject;
                        } catch (e) { }
                    }

                    if (!messageBody && !mediaUrl && !isReaction) {
                        continue;
                    }

                    // Push to Laravel Webhook
                    try {
                        const payload = {
                            type: 'incoming_message',
                            session_name: sessionName,
                            chat_id: msg.key.remoteJid,
                            remote_jid_alt: msg.key.remoteJidAlt || null, // Include alternate JID (phone) if available
                            chat_name: chatName, // Capture sender name/group name if available
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
                        };

                        await axios.post(process.env.LARAVEL_WEBHOOK_URL, payload, {
                            headers: { 'x-api-key': process.env.WA_GATEWAY_API_KEY || 'travelops_secret_key_2024' }
                        });
                    } catch (error) {
                        console.error('Error forwarding incoming message to Laravel:', error.message);
                    }
                }
            }
        }
    });

    sock.ev.on('messages.update', async (m) => {
        for (const { key, update } of m) {
            if (update.status) {
                const statusMap = { 3: 'delivered', 4: 'read' };
                if (statusMap[update.status]) {
                    try {
                        await axios.post(process.env.LARAVEL_WEBHOOK_URL, {
                            type: 'message_receipt',
                            session_name: sessionName,
                            message_id: key.id,
                            status: statusMap[update.status]
                        }, { headers: { 'x-api-key': process.env.WA_GATEWAY_API_KEY || 'travelops_secret_key_2024' } });
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
                    await axios.post(process.env.LARAVEL_WEBHOOK_URL, {
                        type: 'chat_update',
                        session_name: sessionName,
                        chat_id: update.id,
                        chat_name: update.subject
                    }, { headers: { 'x-api-key': process.env.WA_GATEWAY_API_KEY || 'travelops_secret_key_2024' } });
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
                await axios.post(process.env.LARAVEL_WEBHOOK_URL, {
                    type: 'presence_update',
                    session_name: sessionName,
                    chat_id: jid,
                    presence: typeof presence === 'string' ? presence : (presence.lastKnownPresence || 'available')
                }, { headers: { 'x-api-key': process.env.WA_GATEWAY_API_KEY || 'travelops_secret_key_2024' } });
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
            // If WhatsApp closed the connection, wait 3s and retry ONCE
            if (errMsg.includes('Connection Closed') || errMsg.includes('lost') || errMsg.includes('timed out')) {
                console.warn(`[Queue ${sessionName}] Connection issue, retrying in 3s: ${errMsg}`);
                await new Promise(r => setTimeout(r, 3000));
                try {
                    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
                    const retryResult = await sock.sendMessage(jid, content);
                    resolve(retryResult);
                } catch (retryErr) {
                    console.error(`[Queue ${sessionName}] Retry also failed:`, retryErr.message);
                    reject(retryErr);
                }
            } else {
                console.error(`[Queue ${sessionName}] Error:`, error.message);
                reject(error);
            }
        }

        // Anti-ban pause: 300ms between messages prevents WhatsApp from disconnecting
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
        // Basic context info for quoting with text content
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
        const mimeMap = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ppt: 'application/vnd.ms-powerpoint',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            zip: 'application/zip',
            rar: 'application/x-rar-compressed',
            txt: 'text/plain',
            csv: 'text/csv',
            rtf: 'application/rtf'
        };
        const mimetype = mimeMap[ext] || 'application/octet-stream';

        content = {
            document: { url: filePath },
            mimetype,
            fileName: originalFileName || `document.${ext}`,
            caption: caption
        };
    } else if (type === 'audio') {
        content = {
            audio: { url: filePath },
            mimetype: 'audio/mp4', // Common for high compatibility
            ptt: false
        };
    } else if (type === 'video') {
        content = {
            video: { url: filePath },
            caption: caption,
            mimetype: 'video/mp4'
        };
    } else if (type === 'sticker') {
        content = {
            sticker: { url: filePath }
        };
    } else {
        // Default: image
        content = {
            image: { url: filePath },
            caption: caption
        };
    }

    if (!content) throw new Error('Unsupported media type: ' + type);

    return addToQueue(sock, sessionName, toPhone, content);
}

module.exports.sendWhatsAppMessage = sendWhatsAppMessage;
module.exports.sendWhatsAppMedia = sendWhatsAppMedia;
