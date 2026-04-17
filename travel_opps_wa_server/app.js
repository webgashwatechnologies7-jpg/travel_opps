const express = require('express');
const bodyParser = require('body-parser');
const { createSession, logoutSession, sessions, pool } = require('./baileysSessionModule');
const { sendWhatsAppMessage, sendWhatsAppMedia } = require('./messageHandler');
require('dotenv').config();

const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

// CORS: Allow browser to load media files (images/audio/video) from this server
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// 1. Security: Internal API Key Middleware
const INTERNAL_API_KEY = process.env.WA_GATEWAY_API_KEY || 'travelops_secret_key_2024';
const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== INTERNAL_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
    }
    next();
};

// 2. Safely serialize BigInt values returned by Baileys
app.set('json replacer', (k, v) => typeof v === 'bigint' ? v.toString() : v);

// 3. Simple request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/media', express.static(path.join(__dirname, 'media')));

// 4. Multer setup: High-concurrency safe filenames
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'media/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Use timestamp + random string to avoid collisions under heavy load
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// 5. Scalability: Auto-Cleanup of old media files (Every 24 hours)
setInterval(() => {
    const mediaDir = path.join(__dirname, 'media');
    const files = fs.readdirSync(mediaDir);
    const now = Date.now();
    const expiry = 7 * 24 * 60 * 60 * 1000; // 7 Days

    console.log('[Cleanup] Checking for expired media files...');
    files.forEach(file => {
        const filePath = path.join(mediaDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > expiry) {
            fs.unlinkSync(filePath);
            console.log(`[Cleanup] Deleted: ${file}`);
        }
    });
}, 24 * 60 * 60 * 1000); // 24 Hours

// Protection for all API routes
app.use('/api', authMiddleware);

const PORT = process.env.PORT || 3001;

// Health check: is a specific session active in memory?
app.get('/api/status', (req, res) => {
    const { userId, companyId } = req.query;
    const sessionName = `session_${userId}_${companyId}`;
    const sock = sessions.get(sessionName);
    const isConnected = sock && sock.user;
    res.json({ connected: isConnected, sessionName });
});

// Endpoint to initialize/get QR
app.post('/api/session/init', async (req, res) => {
    const { userId, companyId } = req.body;
    if (!userId || !companyId) {
        return res.status(400).json({ error: 'User ID and Company ID are required' });
    }

    try {
        const sessionName = `session_${userId}_${companyId}`;
        const { force } = req.body;

        if (force === true) {
            console.log(`[Session ${sessionName}] Force refresh requested. Logging out...`);
            await logoutSession(userId, companyId);
            // Optional: short delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Check if session exists in DB
        const [rows] = await pool.execute(
            'SELECT * FROM whatsapp_sessions WHERE session_name = ?',
            [sessionName]
        );

        if (rows.length === 0) {
            await pool.execute(
                'INSERT INTO whatsapp_sessions (user_id, company_id, session_name, status) VALUES (?, ?, ?, ?)',
                [userId, companyId, sessionName, 'Disconnected']
            );
        }

        await createSession(userId, companyId);
        res.json({ message: 'Session initialization started' + (force ? ' (Force Refreshed)' : '') });
    } catch (error) {
        console.error('Error init session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint: Get WhatsApp Contact Profile Picture
app.get('/api/profile-picture', authMiddleware, async (req, res) => {
    const { userId, companyId, jid } = req.query;
    const sessionName = `session_${userId}_${companyId}`;
    const sock = sessions.get(sessionName);

    if (!sock) return res.status(404).json({ success: false, error: 'Session not active' });
    if (!sock.user) return res.json({ success: true, url: null });

    try {
        const targetJids = [jid];
        try {
            const [result] = await sock.onWhatsApp(jid);
            if (result?.jid && result.jid !== jid) targetJids.unshift(result.jid);
        } catch (e) { }

        const tryFetch = async (id, type) => {
            try {
                return await sock.profilePictureUrl(id, type);
            } catch (e) {
                return null;
            }
        };

        let ppUrl = null;

        // 2. Try all available JIDs (resolved and original)
        for (const id of targetJids) {
            try {
                await sock.fetchStatus(id);
            } catch (e) { }

            ppUrl = await tryFetch(id, 'image');
            if (ppUrl) break;

            ppUrl = await tryFetch(id, 'preview');
            if (ppUrl) break;
        }

        // 3. Fallback: Business Profile
        if (!ppUrl) {
            const bestJid = targetJids[0];
            try {
                const biz = await sock.getBusinessProfile(bestJid);
                ppUrl = biz?.profile_picture_url || biz?.cover_photo?.url || null;
            } catch (e) { }
        }

        return res.json({ success: true, url: ppUrl });
    } catch (err) {
        return res.json({ success: true, url: null, error: err.message });
    }
});

// Diagnostic: Get OUR OWN profile picture
app.get('/api/profile-picture/me', authMiddleware, async (req, res) => {
    const { userId, companyId } = req.query;
    const sessionName = `session_${userId}_${companyId}`;
    const sock = sessions.get(sessionName);

    if (!sock || !sock.user) {
        return res.status(404).json({ success: false, error: 'Session not authenticated' });
    }

    try {
        const myJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const ppUrl = await sock.profilePictureUrl(myJid, 'preview');
        return res.json({ success: true, url: ppUrl, jid: myJid });
    } catch (err) {
        return res.json({ success: false, error: err.message });
    }
});
app.post('/api/message/send', async (req, res) => {
    const { userId, companyId, to, message, quotedMessageId, quotedText } = req.body;
    const sessionName = `session_${userId}_${companyId}`;
    const sock = sessions.get(sessionName);

    if (!sock) {
        console.warn(`[Gateway] Session ${sessionName} not active/found.`);
        return res.status(404).json({ error: 'Session not active' });
    }

    try {
        const result = await sendWhatsAppMessage(sock, sessionName, to, message, quotedMessageId, quotedText);
        const msgId = result?.key?.id?.toString() || ('sent_' + Date.now());
        res.json({ success: true, messageId: msgId });
    } catch (error) {
        const errMsg = error?.message || 'Send Failed';
        console.error(`[Gateway] Error for ${sessionName}: ${errMsg}`);
        res.status(500).json({ error: errMsg });
    }
});

// Endpoint to send media
app.post('/api/message/send-media', upload.single('file'), async (req, res) => {
    const { userId, companyId, to, caption, type } = req.body;
    const sessionName = `session_${userId}_${companyId}`;
    const sock = sessions.get(sessionName);

    if (!sock || !req.file) {
        return res.status(404).json({ error: 'Session not active or file missing' });
    }

    try {
        const filePath = path.join(__dirname, req.file.path);
        const originalFileName = req.file.originalname || req.file.filename;
        const result = await sendWhatsAppMedia(sock, sessionName, to, filePath, caption, type, originalFileName);
        const fileUrl = `${process.env.NODE_SERVER_URL || 'http://localhost:3001'}/media/${req.file.filename}`;
        res.json({ success: true, messageId: result.key.id, url: fileUrl });
    } catch (error) {
        console.error('Error sending media:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to send reaction
app.post('/api/message/react', async (req, res) => {
    const { userId, companyId, to, emoji, messageId } = req.body;
    const sessionName = `session_${userId}_${companyId}`;
    const sock = sessions.get(sessionName);

    if (!sock) {
        return res.status(404).json({ error: 'Session not active' });
    }

    try {
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        const result = await sock.sendMessage(jid, {
            react: {
                text: emoji,
                key: {
                    id: messageId,
                    remoteJid: jid,
                    fromMe: false // Usually reacting to received messages
                }
            }
        });
        res.json({ success: true, messageId: result.key.id });
    } catch (error) {
        console.error('Error sending reaction:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to pin/unpin message
app.post('/api/message/pin', async (req, res) => {
    const { userId, companyId, to, messageId, type, duration } = req.body;
    const sessionName = `session_${userId}_${companyId}`;
    const sock = sessions.get(sessionName);

    if (!sock) {
        return res.status(404).json({ error: 'Session not active' });
    }

    try {
        const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
        const isPin = type !== 'unpin';

        // Attempt to pin - usually reacting to incoming messages (fromMe: false)
        let pinKey = {
            id: messageId,
            remoteJid: jid,
            fromMe: false
        };

        // Note: In WhatsApp, PinMessageType.PIN = 1, PinMessageType.UNPIN = 2
        try {
            const result = await sock.sendMessage(jid, {
                pin: {
                    key: pinKey,
                    type: isPin ? 1 : 2,
                    timeInSeconds: duration || 604800
                }
            });
            return res.json({ success: true, messageId: result.key.id });
        } catch (pinErr) {
            // If it failed with fromMe: false, try fromMe: true as a fallback
            if (pinErr.message.includes('not found') || pinErr.message.includes('forbidden')) {
                pinKey.fromMe = true;
                const result = await sock.sendMessage(jid, {
                    pin: {
                        key: pinKey,
                        type: isPin ? 1 : 2,
                        timeInSeconds: duration || 604800
                    }
                });
                return res.json({ success: true, messageId: result.key.id });
            }
            throw pinErr;
        }
    } catch (error) {
        console.error('Error pinning message:', error);
        res.status(500).json({ error: error.message });
    }
});
// Endpoint to mark chat as read
app.post('/api/chat/read', async (req, res) => {
    const { userId, companyId, chatId, message_id } = req.body;
    console.log(`[MarkAsRead] Chat: ${chatId}, Msg: ${message_id}, Company: ${companyId}`);
    let sessionName = `session_${userId}_${companyId}`;
    let sock = sessions.get(sessionName);

    // If specific user session not found, try finding ANY session for this company
    if (!sock && companyId) {
        for (const [name, socket] of sessions.entries()) {
            if (name.endsWith(`_${companyId}`)) {
                sock = socket;
                break;
            }
        }
    }

    if (!sock) {
        return res.status(404).json({ error: 'Session not active' });
    }

    try {
        const jid = chatId.includes('@') ? chatId : `${chatId}@s.whatsapp.net`;
        // Baileys way to mark as read: passing the message key
        const key = {
            remoteJid: jid,
            id: message_id || null,
            fromMe: false
        };
        await sock.readMessages([key]);
        res.json({ success: true, message: 'Marked as read', key });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to logout
app.post('/api/session/logout', async (req, res) => {
    const { userId, companyId } = req.body;
    try {
        await logoutSession(userId, companyId);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to create group
app.post('/api/group/create', async (req, res) => {
    const { userId, companyId, groupName, participants } = req.body;
    const sessionName = `session_${userId}_${companyId}`;
    const sock = sessions.get(sessionName);

    if (!sock) {
        return res.status(404).json({ error: 'Session not active' });
    }

    try {
        const creatorJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        let jids = participants.map(p => {
            if (p.includes('@')) return p;
            const clean = p.replace(/[^0-9]/g, '');
            const formatted = clean.length === 10 ? `91${clean}` : clean;
            return `${formatted}@s.whatsapp.net`;
        });

        // Deduplicate and filter out creator
        jids = [...new Set(jids)].filter(jid => jid !== creatorJid);

        if (jids.length === 0) {
            return res.status(400).json({ error: 'At least one participant (other than yourself) is required' });
        }

        console.log(`[Session ${userId}_${companyId}] Validating ${jids.length} participants...`);
        const invalidJids = [];
        for (const jid of jids) {
            const [result] = await sock.onWhatsApp(jid);
            if (!result || !result.exists) {
                invalidJids.push(jid.split('@')[0]);
            }
        }

        if (invalidJids.length > 0) {
            return res.status(400).json({
                error: `Group creation failed. The following numbers are not on WhatsApp: ${invalidJids.join(', ')}`
            });
        }

        console.log(`[Session ${userId}_${companyId}] Attempting to create group "${groupName}"...`);
        const group = await sock.groupCreate(groupName, jids);
        console.log(`✅ Group created successfully: ${groupName} (${group.id})`);
        res.json({ success: true, group });

    } catch (error) {
        console.error('❌ Error creating group:', error);

        let errorMessage = error.message;
        if (error.data === 400 || error.message.includes('bad-request')) {
            errorMessage = 'WhatsApp rejected group creation. This usually happens if a participant is not on WhatsApp, has blocked you, or their privacy settings prevent being added to groups.';
        }

        res.status(error.data || 500).json({
            error: errorMessage,
            details: error.data || null
        });
    }
});

// Restore sessions on startup
async function restoreSessions() {
    try {
        const [rows] = await pool.execute(
            "SELECT user_id, company_id FROM whatsapp_sessions WHERE status IN ('Connected', 'Scanning')"
        );
        console.log(`Restoring ${rows.length} sessions...`);
        for (const row of rows) {
            createSession(row.user_id, row.company_id);
        }
    } catch (error) {
        console.error('Error restoring sessions:', error);
    }
}

app.listen(PORT, () => {
    console.log(`WhatsApp Gateway Server running on port ${PORT}`);
    restoreSessions();
});
