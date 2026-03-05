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

// Endpoint to initialize/get QR
app.post('/api/session/init', async (req, res) => {
    const { userId, companyId } = req.body;
    if (!userId || !companyId) {
        return res.status(400).json({ error: 'User ID and Company ID are required' });
    }

    try {
        const sessionName = `session_${userId}_${companyId}`;

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
        res.json({ message: 'Session initialization started' });
    } catch (error) {
        console.error('Error init session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to send message
app.post('/api/message/send', async (req, res) => {
    const { userId, companyId, to, message, quotedMessageId, quotedText } = req.body;
    const sessionName = `session_${userId}_${companyId}`;
    const sock = sessions.get(sessionName);

    if (!sock) {
        return res.status(404).json({ error: 'Session not active' });
    }

    try {
        const result = await sendWhatsAppMessage(sock, sessionName, to, message, quotedMessageId, quotedText);
        res.json({ success: true, messageId: result.key.id });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
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
