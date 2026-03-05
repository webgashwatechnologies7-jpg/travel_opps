import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Send, Paperclip, MoreVertical, Search, FileText, Download, Smile, CheckCheck, Check, Loader2, Reply, Copy, X, Mic, Image, Film, MapPin, User, MessageSquare, Plus, Sticker, Camera } from 'lucide-react';
import { whatsappWebAPI } from '../../services/api';
import { toast } from 'react-toastify';

// Common emojis grouped by category
const EMOJI_GROUPS = [
    { label: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'] },
    { label: 'Gestures', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🫀', '🫁', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋'] },
    { label: 'People', emojis: ['👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩', '🧓', '👴', '👵', '🙍', '🙎', '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦', '🤷', '👮', '🕵️', '💂', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰', '��', '🧑‍🍼', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧝', '🧛', '🧟', '🧞', '🧜', '🧚', '👥', '🫂'] },
    { label: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮'] },
    { label: 'Animals', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🦅', '🦆', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🦂', '🐢', '🦎', '🐍', '🐲', '🦕', '🦖', '🦎', '🐊', '🐸', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🦔'] },
    { label: 'Food', emojis: ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥝', '🍅', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🫓', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🫔', '🌮', '🌯', '🥙', '🧆', '🥚', '🍲', '🥘', '🫕', '🥗', '🫙', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '☕', '🫖', '🍵', '🧉', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧃', '🥤', '🧊'] },
    { label: 'Travel', emojis: ['✈️', '🚀', '🛸', '🚁', '🛺', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🛺', '🚲', '🛴', '🛹', '🛼', '🚏', '🛣️', '🛤️', '⛽', '🚨', '🚥', '🚦', '🛑', '⚓', '⛵', '🛶', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '🗺️', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '🗾', '🎌', '⛩️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁', '⛲', '🌐'] },
    { label: 'Objects', emojis: ['📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '📟', '📠', '📺', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '💳', '🪙', '💰', '💸', '💴', '💵', '💶', '💷', '📊', '📈', '📉', '🗂️', '📋', '📁', '📂', '🗃️', '🗄️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🛡️', '🔧', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🪝', '🧲', '🔫', '🧨', '💣', '🪃', '🏹', '🛡️', '🪚', '🔪', '🩸', '💊', '💉', '🩹', '🩺', '🩻', '🏷️', '🔖', '🚪', '🛗', '🪞', '🪟', '🛏️', '🛋️', '🪑', '🚽', '🚿', '🛁', '🧺', '🧻', '🪣', '🧹', '🧽', '🧯', '🛒', '🚪'] },
    { label: 'Symbols', emojis: ['💯', '🔢', '🔣', '🔤', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🔕', '🔇', '💤', '🅿️', '♿', '🚻', '🚺', '🚹', '🚼', '⚠️', '☢️', '☣️', '🔃', '🔄', '🔙', '🔛', '🔝', '🔚', '📶', '🔜', '📳', '📴', '📵', '🔈', '🔉', '🔊', '📢', '📣', '🔔', '🔕', '🎵', '🎶', '💬', '💭', '🗯️', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄', '🎴', '✅', '❎', '🔱', '⚜️', '〽️', '✳️', '❇️', '🆔', '💠', '♻️', '🔰', '⭕', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔶', '🔷', '🔸', '🔹', '🔺', '🔻', '💠', '🔘', '🔲', '🔳', '⬛', '⬜', '◼️', '◻️', '◾', '◽', '▪️', '▫️'] },
];

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🙏', '🔥', '💯', '😍', '🥰', '😭', '🤣', '😱', '✅', '🙌', '💪', '🎉', '🤔', '😅'];

const ChatWindow = ({ chat, messages, onSendMessage, onSendMedia, isTyping, isSending, loadingMessages }) => {
    const messagesEndRef = useRef(null);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiSearch, setEmojiSearch] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [hoveredMsg, setHoveredMsg] = useState(null);
    const [showReactionMenu, setShowReactionMenu] = useState(null); // msg.whatsapp_message_id
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showChatSearch, setShowChatSearch] = useState(false);
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [showChatMenu, setShowChatMenu] = useState(false);
    const emojiPickerRef = useRef(null);
    const attachmentMenuRef = useRef(null);
    const menuRef = useRef(null);
    const inputRef = useRef(null);

    // Intelligent Scroll State
    const scrollContainerRef = useRef(null);
    const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
    const lastMessageCountRef = useRef(0);

    const scrollToBottom = (force = false) => {
        if ((!isUserScrolledUp || force) && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Detect user scroll action
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;
        setIsUserScrolledUp(!isAtBottom);
    };

    useEffect(() => {
        const currentCount = messages.length;
        const prevCount = lastMessageCountRef.current;

        // Only scroll if this is a new message arriving (count increased)
        // NOT on interval refresh which keeps same count
        if (currentCount > prevCount) {
            if (!isUserScrolledUp || prevCount === 0) {
                // Auto scroll only if user is at bottom OR it's first load
                scrollToBottom();
            }
        }
        lastMessageCountRef.current = currentCount;
    }, [messages.length]); // Only trigger on count change, NOT full array reference

    // Close menus on outside click
    useEffect(() => {
        const handler = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
            if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(e.target)) {
                setShowAttachmentMenu(false);
            }
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowChatMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const REPLY_MARKER = '\u200B[REPLY]\u200B';

    const handleSend = () => {
        const text = inputValue.trim();
        if (!text) return;

        let finalMsg = text;
        let quotedId = null;
        let quotedPreview = null;
        if (replyingTo) {
            quotedId = replyingTo.whatsapp_message_id || replyingTo.id;
            quotedPreview = replyingTo.message?.substring(0, 60).replace(/\n/g, ' ') || '[media]';
        }

        setSending(true);
        onSendMessage(finalMsg, quotedId, quotedPreview).finally(() => setSending(false));
        setInputValue('');
        setReplyingTo(null);
        setShowEmojiPicker(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const insertEmoji = (emoji) => {
        setInputValue(prev => prev + emoji);
        inputRef.current?.focus();
    };

    const handleReply = (msg) => {
        setReplyingTo(msg);
        inputRef.current?.focus();
    };

    const handleCopy = (msg) => {
        if (msg.message) {
            navigator.clipboard.writeText(msg.message).catch(() => { });
        }
    };

    const filteredEmojis = emojiSearch
        ? EMOJI_GROUPS.flatMap(g => g.emojis).filter(e => e.includes(emojiSearch))
        : null;

    const formatTime = (dateStr) => {
        try {
            if (!dateStr) return '';
            // Server stores UTC time - parse correctly
            // If no 'Z' or offset, treat as UTC (add Z)
            const normalized = dateStr.includes('T')
                ? (dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z')
                : dateStr.replace(' ', 'T') + 'Z';
            return new Date(normalized).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const formatDateLabel = (dateStr) => {
        try {
            if (!dateStr) return '';
            const normalized = dateStr.includes('T')
                ? (dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z')
                : dateStr.replace(' ', 'T') + 'Z';
            const d = new Date(normalized);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            if (d.toDateString() === today.toDateString()) return 'Today';
            if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
            return d.toLocaleDateString();
        } catch {
            return '';
        }
    };

    const isSameDay = (dateStr1, dateStr2) => {
        try {
            const norm = (s) => s.includes('T') ? (s.endsWith('Z') || s.includes('+') ? s : s + 'Z') : s.replace(' ', 'T') + 'Z';
            return new Date(norm(dateStr1)).toDateString() === new Date(norm(dateStr2)).toDateString();
        } catch {
            return false;
        }
    };

    // Emoji regex: matches a single emoji character (including combined emojis)
    const EMOJI_ONLY_RE = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})(\u200D(\p{Emoji_Presentation}|\p{Extended_Pictographic})|\uFE0F|\u20E3)*$/u;

    const isReactionMsg = (msg) => {
        if (msg.is_reaction) return true;
        if (!msg.message || msg.media_url) return false;
        const text = msg.message.trim();
        const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]+$/u;
        return text.length <= 8 && emojiRegex.test(text);
    };

    const scrollToMessage = (messageId, fallbackText = null) => {
        if (!messageId && !fallbackText) return;

        // Temporarily disable auto-scroll
        setIsAutoScrollEnabled(false);

        let element = document.getElementById(`msg-${messageId}`);

        // Intelligent Fallback: If ID not found (old message), search for the text content
        if (!element && fallbackText) {
            const cleanFallback = fallbackText.trim().toLowerCase();
            const allBubbles = document.querySelectorAll('.message-bubble-container');
            for (let bubble of allBubbles) {
                if (bubble.innerText.toLowerCase().includes(cleanFallback)) {
                    element = bubble;
                    break;
                }
            }
        }

        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Native WhatsApp style blink highlight
            element.style.transition = 'background-color 0.3s ease';
            const originalBg = element.style.backgroundColor;

            let blinks = 0;
            const blinkInterval = setInterval(() => {
                element.style.backgroundColor = blinks % 2 === 0 ? 'rgba(0, 168, 132, 0.2)' : originalBg;
                blinks++;
                if (blinks > 5) {
                    clearInterval(blinkInterval);
                    element.style.backgroundColor = originalBg;
                }
            }, 300);

            element.classList.add('message-highlight');
            setTimeout(() => {
                element.classList.remove('message-highlight');
            }, 3000);
        } else {
            toast.error("Original message not found in history");
            console.log("Message element not found for:", { messageId, fallbackText });
        }
    };

    const handleReact = async (msg, emoji) => {
        try {
            const response = await whatsappWebAPI.sendReaction({
                chat_id: chat.chat_id,
                message_id: msg.whatsapp_message_id,
                emoji
            });
            if (response.data.success) {
                setShowReactionMenu(null);
            }
        } catch (error) {
            console.error('Failed to send reaction:', error);
        }
    };

    const ATTACHMENT_OPTIONS = [
        { icon: <Image size={20} />, label: 'Photos & Videos', color: '#007bfc', type: 'image' },
        { icon: <Sticker size={20} />, label: 'Sticker', color: '#00a884', type: 'sticker' },
        { icon: <Camera size={20} />, label: 'Camera', color: '#ff2e74', type: 'camera' },
        { icon: <FileText size={20} />, label: 'Document', color: '#7f66ff', type: 'document' },
        { icon: <User size={20} />, label: 'Contact', color: '#06cf9c', type: 'contact' },
    ];

    const renderMedia = (msg) => {
        if (!msg.media_url) return null;

        const type = msg.media_type?.toLowerCase() || '';

        if (type === 'image' || type === 'sticker') {
            return (
                <div className="mt-1 mb-1 rounded-lg overflow-hidden max-w-[220px]">
                    <img
                        src={msg.media_url}
                        alt="Media"
                        className="w-full h-auto max-h-56 object-cover cursor-pointer"
                        onClick={() => window.open(msg.media_url, '_blank')}
                    />
                    {msg.media_caption && <p className="p-1.5 text-xs text-gray-700">{msg.media_caption}</p>}
                </div>
            );
        }

        if (type === 'video') {
            return (
                <div className="mt-1 mb-1 rounded-lg overflow-hidden max-w-[220px]">
                    <video src={msg.media_url} controls className="w-full h-auto max-h-48" />
                    {msg.media_caption && <p className="p-1.5 text-xs text-gray-700">{msg.media_caption}</p>}
                </div>
            );
        }

        if (type === 'audio') {
            return (
                <div className="mt-1 mb-1">
                    <div className="flex items-center gap-2 bg-black/5 rounded-full px-3 py-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Mic size={14} className="text-white" />
                        </div>
                        <audio src={msg.media_url} controls className="h-8 flex-1" style={{ minWidth: 120 }} />
                    </div>
                </div>
            );
        }

        if (type === 'document') {
            const filename = msg.media_url?.split('/').pop() || 'Document';
            return (
                <a href={msg.media_url} target="_blank" rel="noreferrer"
                    className="mt-1 mb-1 flex items-center gap-2 p-2.5 bg-black/5 rounded-xl hover:bg-black/10 transition-colors">
                    <div className="w-9 h-9 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[12px] font-medium truncate max-w-[140px]">{msg.media_caption || filename}</p>
                        <p className="text-[10px] text-gray-400">Document</p>
                    </div>
                    <Download size={16} className="text-gray-400 ml-auto flex-shrink-0" />
                </a>
            );
        }

        return null;
    };

    const renderMessage = (msg, index, messagesList) => {
        const isOutbound = msg.direction === 'outbound';
        const isReaction = isReactionMsg(msg);
        const isHovered = hoveredMsg === (msg.id || index);

        // Separators
        const showDateSeparator = index === 0 ||
            !isSameDay(messagesList[index - 1].created_at, msg.created_at);

        const showUnreadDivider = msg.direction === 'inbound' && msg.status !== 'read' &&
            (index === 0 || messagesList[index - 1].status === 'read' || messagesList[index - 1].direction === 'outbound');

        let quotedPart = msg.quoted_text || null;
        let bodyText = msg.message || '';

        // Skip rendering technical protocol messages
        if (bodyText.includes('[protocol message]') ||
            bodyText.includes('[messageContextInfo message]') ||
            bodyText.includes('[senderKeyDistributionMessage]')) {
            return null;
        }

        // Robust Reply Parsing for legacy [REPLY] tags
        const CLEAN_REPLY_TAG = '[REPLY]';
        if (bodyText.includes(CLEAN_REPLY_TAG)) {
            const tagIdx = bodyText.indexOf(CLEAN_REPLY_TAG);
            const newlineIdx = bodyText.indexOf('\n', tagIdx);

            if (newlineIdx !== -1) {
                // Extract quote: everything between [REPLY] and the first newline
                const extractedQuote = bodyText.substring(tagIdx + CLEAN_REPLY_TAG.length, newlineIdx).trim();
                if (!quotedPart) quotedPart = extractedQuote;
                // Main body is everything after the newline
                bodyText = bodyText.substring(newlineIdx + 1);
            } else {
                // If no newline, just strip the tag
                bodyText = bodyText.replace(CLEAN_REPLY_TAG, '');
            }
        } else if (bodyText.startsWith('> ') && bodyText.includes('\n') && !quotedPart) {
            const lines = bodyText.split('\n');
            quotedPart = lines[0].replace(/^> /, '');
            bodyText = lines.slice(1).join('\n');
        }

        // Determine Quoted Message Author
        let quotedAuthor = null;
        if (msg.quoted_message_id) {
            const originalMsg = messages.find(m => m.whatsapp_message_id === msg.quoted_message_id);
            if (originalMsg) {
                quotedAuthor = originalMsg.direction === 'outbound' ? 'You' : (chat.chat_name || 'Customer');
            }
        }
        if (!quotedAuthor && quotedPart) {
            // Fallback assumption: Inbound message quotes "You" usually. Outbound message quotes "Customer" usually.
            quotedAuthor = isOutbound ? (chat.chat_name || 'Customer') : 'You';
        }

        // Hide fallback media text
        if (msg.media_url && bodyText.trim().startsWith('Media: ')) {
            bodyText = '';
        }

        // Standalone reaction message
        if (isReaction && bodyText && !msg.quoted_message_id) {
            return (
                <div key={msg.id || index} className="w-full">
                    {showDateSeparator && (
                        <div className="flex justify-center my-4">
                            <span className="px-3 py-1 bg-[#202c33] text-[#8696a0] text-[11px] rounded-lg shadow font-medium uppercase tracking-wider">
                                {formatDateLabel(msg.created_at)}
                            </span>
                        </div>
                    )}
                    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} animate-in fade-in zoom-in duration-300`}>
                        <div className="relative cursor-default" title={isOutbound ? 'You' : 'Customer'}>
                            <span className="text-3xl leading-none">{bodyText.trim()}</span>
                        </div>
                    </div>
                </div>
            );
        }

        const reactions = typeof msg.reactions === 'string' ? JSON.parse(msg.reactions) : (msg.reactions || {});
        const reactionEmojis = Object.values(reactions);

        return (
            <div key={msg.id || index} className="w-full animate-message">
                {showDateSeparator && (
                    <div className="flex justify-center my-4 sticky top-0 z-20">
                        <span className="px-3 py-1.5 bg-[#182229] text-[#8696a0] text-[12px] rounded-[8px] shadow-sm font-medium uppercase tracking-tight border border-white/5">
                            {formatDateLabel(msg.created_at)}
                        </span>
                    </div>
                )}

                {showUnreadDivider && (
                    <div className="flex justify-center my-4">
                        <span className="px-4 py-1 bg-[#202c33]/50 text-[#00a884] text-[11px] rounded shadow-sm border border-[#1f2c33] font-medium uppercase">
                            Unread Messages
                        </span>
                    </div>
                )}

                <div
                    id={`msg-${msg.whatsapp_message_id || msg.id}`}
                    className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-[2px] px-2 transition-all duration-500 message-bubble-container`}
                >
                    <div
                        className="relative group max-w-[85%] flex items-end"
                        onMouseEnter={() => setHoveredMsg(msg.whatsapp_message_id || msg.id || index)}
                        onMouseLeave={() => {
                            setHoveredMsg(null);
                            setShowReactionMenu(null);
                        }}
                    >
                        {/* Hover actions - WhatsApp Style - Now anchored precisely */}
                        {isHovered && (
                            <div className={`absolute top-0 flex items-center gap-1 z-30 ${isOutbound ? '-left-12' : '-right-14'}`}>
                                <button
                                    onClick={() => setShowReactionMenu(msg.whatsapp_message_id)}
                                    className="p-1 px-1.5 rounded-md bg-[#233138] text-[#8696a0] hover:text-[#e9edef] shadow-xl border border-[#2a3942] transition-colors"
                                >
                                    <Smile size={18} />
                                </button>
                                <button
                                    onClick={() => handleReply(msg)}
                                    className="p-1 px-1.5 rounded-md bg-[#233138] text-[#8696a0] hover:text-[#e9edef] shadow-xl border border-[#2a3942] transition-colors"
                                >
                                    <Reply size={18} />
                                </button>
                            </div>
                        )}

                        {showReactionMenu === msg.whatsapp_message_id && (
                            <div className={`absolute bottom-full mb-2 ${isOutbound ? 'right-0' : 'left-0'} flex items-center gap-1 bg-[#233138] border border-[#2a3942] rounded-full px-2 py-1 shadow-2xl z-50 animate-in zoom-in-75 duration-200`}>
                                {QUICK_REACTIONS.slice(0, 6).map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReact(msg, emoji)}
                                        className="text-2xl hover:scale-125 transition-transform duration-200 p-1"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className={`px-2 py-1.5 rounded-[7.5px] shadow-sm relative 
                            ${isOutbound ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'}`}>

                            {/* Bubble Tails */}
                            {isOutbound ? <div className="bubble-tail-out" /> : <div className="bubble-tail-in" />}

                            {/* Improved WhatsApp Quote Styling */}
                            {quotedPart && (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        scrollToMessage(msg.quoted_message_id, quotedPart);
                                    }}
                                    className="mb-1 flex flex-col rounded-[6px] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-black/20"
                                >
                                    <div className="flex bg-white/5 relative pb-1 pt-1 pl-2 pr-2">
                                        <div className={`absolute top-0 bottom-0 left-0 w-[4px] ${quotedAuthor === 'You' ? 'bg-[#06cf9c]' : 'bg-[#53bdeb]'}`}></div>
                                        <div className="flex flex-col flex-1 pl-1">
                                            <p className={`font-semibold text-[13px] leading-tight mb-0.5 ${quotedAuthor === 'You' ? 'text-[#06cf9c]' : 'text-[#53bdeb]'}`}>
                                                {quotedAuthor}
                                            </p>
                                            <p className="truncate opacity-70 text-[13px] text-[#e9edef] leading-tight">
                                                {quotedPart}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {renderMedia(msg)}

                            {bodyText && (
                                <p className="text-[14.2px] leading-[1.4] whitespace-pre-wrap pr-12">
                                    {bodyText}
                                </p>
                            )}

                            {/* Footer - Time & Status */}
                            <div className="flex items-center gap-1 justify-end ml-auto -mt-1 opacity-60">
                                <span className="text-[11px] tabular-nums tracking-tighter">{formatTime(msg.created_at)}</span>
                                {isOutbound && (
                                    <span>
                                        {msg.status === 'read' ? <CheckCheck size={14} className="text-[#53bdeb]" /> :
                                            msg.status === 'delivered' ? <CheckCheck size={14} /> :
                                                msg.status === 'sending' ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
                                    </span>
                                )}
                            </div>

                            {/* Reactions */}
                            {reactionEmojis.length > 0 && (
                                <div className={`absolute -bottom-3 ${isOutbound ? 'right-2' : 'left-2'} flex items-center bg-[#233138] border border-[#182229] rounded-full px-1.5 shadow-md h-[22px] z-20`}>
                                    {reactionEmojis.slice(0, 3).map((e, i) => <span key={i} className="text-[13px] leading-none">{e}</span>)}
                                    {reactionEmojis.length > 1 && <span className="text-[11px] text-[#8696a0] ml-1 font-bold">{reactionEmojis.length}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!chat) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4" style={{ background: '#0b141a' }}>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-full flex items-center justify-center border border-white/5">
                    <MessageSquare size={32} className="text-[#00a884] opacity-40" />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-medium text-[#e9edef]">Open a lead to start chatting</h3>
                    <p className="text-sm text-[#8696a0] mt-1">WhatsApp messages are linked to your leads automatically.</p>
                </div>
            </div>
        );
    }

    const chatDisplayName = chat.chat_name || (() => {
        const jid = chat.chat_id || '';
        if (jid.includes('@g.us')) return 'Group Chat';
        if (jid.includes('@lid')) return 'Customer';
        const num = jid.split('@')[0];
        if (num.length >= 10) {
            if (num.startsWith('91') && num.length === 12) {
                return `+91 ${num.slice(2, 7)} ${num.slice(7)}`;
            }
            return `+${num}`;
        }
        return `+${num}`;
    })();

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden" style={{ background: '#0b141a' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 z-20 border-b border-[#1f2c33] shrink-0" style={{ background: '#202c33' }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm bg-gradient-to-br from-[#00bfa5] to-[#00a884]">
                        {chatDisplayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-medium text-[15px] truncate" style={{ color: '#e9edef' }}>{chatDisplayName}</h3>
                        {isTyping ? <p className="text-[11px] text-[#00a884] animate-pulse">typing...</p> : <p className="text-[11px] text-[#8696a0]">WhatsApp</p>}
                    </div>
                </div>
                <div className="flex items-center gap-1 text-[#aebac1] relative">
                    <button
                        onClick={() => setShowChatSearch(!showChatSearch)}
                        className={`p-2 rounded-full transition-colors ${showChatSearch ? 'bg-white/10 text-[#00a884]' : 'hover:bg-white/5'}`}
                    >
                        <Search size={18} />
                    </button>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowChatMenu(!showChatMenu)}
                            className={`p-2 rounded-full transition-colors ${showChatMenu ? 'bg-white/10 text-[#00a884]' : 'hover:bg-white/5'}`}
                        >
                            <MoreVertical size={18} />
                        </button>

                        {showChatMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded-lg shadow-xl z-50 border border-[#2a3942]" style={{ background: '#233138' }}>
                                <button className="w-full px-4 py-2 text-left text-sm hover:bg-[#111b21] transition-colors text-[#e9edef]">Contact Info</button>
                                <button className="w-full px-4 py-2 text-left text-sm hover:bg-[#111b21] transition-colors text-[#e9edef]">Select Messages</button>
                                <button className="w-full px-4 py-2 text-left text-sm hover:bg-[#111b21] transition-colors text-[#e9edef]">Close Chat</button>
                                <button className="w-full px-4 py-2 text-left text-sm hover:bg-[#111b21] transition-colors text-[#e9edef]">Mute Notifications</button>
                                <button className="w-full px-4 py-2 text-left text-sm hover:bg-[#111b21] transition-colors text-[#e9edef]">Disappearing Messages</button>
                                <div className="h-[1px] bg-[#2a3942] my-1" />
                                <button className="w-full px-4 py-2 text-left text-sm hover:bg-[#111b21] transition-colors text-[#e9edef]">Clear Chat</button>
                                <button className="w-full px-4 py-2 text-left text-sm hover:bg-[#111b21] transition-colors text-[#e9edef]">Delete Chat</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Search Bar - Dynamic Overlay */}
            {showChatSearch && (
                <div className="px-4 py-2 border-b border-[#1f2c33] flex items-center gap-3 animate-in slide-in-from-top duration-200" style={{ background: '#202c33' }}>
                    <div className="flex-1 flex items-center gap-3 px-3 py-1.5 rounded-lg border border-transparent focus-within:border-[#00a884] transition-all bg-[#2a3942]">
                        <Search size={16} className="text-[#8696a0]" />
                        <input
                            autoFocus
                            placeholder="Search in chat..."
                            className="bg-transparent border-none outline-none text-sm w-full text-[#e9edef]"
                            value={chatSearchQuery}
                            onChange={(e) => setChatSearchQuery(e.target.value)}
                        />
                        {chatSearchQuery && (
                            <button onClick={() => setChatSearchQuery('')} className="text-[#8696a0] hover:text-[#e9edef]">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button onClick={() => { setShowChatSearch(false); setChatSearchQuery(''); }} className="text-[#8696a0] hover:text-[#e9edef] p-1">
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 relative overflow-hidden z-10">
                {/* Background Wallpaper layer */}
                <div
                    className="absolute inset-0 opacity-[0.06] z-0"
                    style={{
                        backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
                        backgroundSize: '400px',
                        backgroundRepeat: 'repeat',
                        filter: 'invert(1)'
                    }}
                />

                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="absolute inset-0 overflow-y-auto px-4 py-3 whatsapp-scroll z-10"
                >
                    {loadingMessages ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-3">
                            <Loader2 size={40} className="text-[#00a884] animate-spin" />
                            <p className="text-sm text-[#8696a0]">Loading messages...</p>
                        </div>
                    ) : (!messages || messages.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-2 opacity-20 invert">
                            <MessageSquare size={48} />
                            <p className="text-sm font-medium">No messages yet</p>
                        </div>
                    ) : (
                        (() => {
                            const filtered = messages
                                .filter(msg => !(isReactionMsg(msg) && msg.quoted_message_id))
                                .filter(msg => {
                                    if (!chatSearchQuery) return true;
                                    const body = msg.message?.toLowerCase() || '';
                                    return body.includes(chatSearchQuery.toLowerCase());
                                });

                            if (chatSearchQuery && filtered.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-2">
                                        <Search size={32} className="text-[#8696a0]" />
                                        <p className="text-[#8696a0] text-sm">No results found for "{chatSearchQuery}"</p>
                                    </div>
                                );
                            }

                            return filtered.map((msg, idx, list) => renderMessage(msg, idx, list));
                        })()
                    )}

                    {/* Sending state bubble */}
                    {(isSending || sending) && (
                        <div className="flex justify-end mb-4 animate-in fade-in slide-in-from-right-2">
                            <div className="bg-[#005c4b] px-3 py-1.5 rounded-lg rounded-tr-none shadow-sm flex items-center gap-2">
                                <Loader2 size={11} className="text-[#00a884] animate-spin" />
                                <span className="text-[11px] text-[#e9edef]/60">Sending...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            {/* Reply Preview Bar */}
            {replyingTo && (
                <div className="px-4 py-2 flex items-start gap-3 border-t" style={{ background: '#202c33', borderColor: '#1f2c33' }}>
                    <div className="flex-1 pl-3 border-l-4 border-[#00a884]">
                        <p className="text-[10px] font-semibold mb-0.5" style={{ color: '#00a884' }}>
                            ↩ Replying to {replyingTo.direction === 'outbound' ? 'yourself' : 'customer'}
                        </p>
                        <p className="text-[12px] truncate" style={{ color: '#8696a0' }}>
                            {replyingTo.message?.substring(0, 80) || '[media]'}
                        </p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} style={{ color: '#8696a0' }} className="mt-0.5 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Emoji Picker — dark themed */}
            {showEmojiPicker && (
                <div ref={emojiPickerRef}
                    className="absolute bottom-16 left-2 z-50 w-80 rounded-2xl shadow-2xl overflow-hidden"
                    style={{ background: '#233138', border: '1px solid #1f2c33' }}>
                    {/* Search */}
                    <div className="p-2 border-b" style={{ borderColor: '#1f2c33' }}>
                        <input
                            value={emojiSearch}
                            onChange={e => setEmojiSearch(e.target.value)}
                            placeholder="Search emojis..."
                            className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
                            style={{ background: '#2a3942', color: '#e9edef' }}
                            autoFocus
                        />
                    </div>
                    {/* Quick Reactions */}
                    {!emojiSearch && (
                        <div className="flex items-center gap-1 px-3 py-2 border-b" style={{ borderColor: '#1f2c33' }}>
                            {QUICK_REACTIONS.map(e => (
                                <button key={e} onClick={() => insertEmoji(e)}
                                    className="text-xl hover:scale-125 transition-transform p-0.5 rounded">
                                    {e}
                                </button>
                            ))}
                        </div>
                    )}
                    {/* Emoji Grid */}
                    <div className="overflow-y-auto" style={{ maxHeight: 240 }}>
                        {filteredEmojis ? (
                            <div className="grid grid-cols-8 gap-0.5 p-2">
                                {filteredEmojis.map((e, i) => (
                                    <button key={i} onClick={() => insertEmoji(e)}
                                        className="text-xl text-center rounded p-1 transition-colors hover:bg-white/10">
                                        {e}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            EMOJI_GROUPS.map(group => (
                                <div key={group.label}>
                                    <p className="text-[10px] font-bold uppercase px-3 pt-2 pb-1" style={{ color: '#8696a0' }}>{group.label}</p>
                                    <div className="grid grid-cols-8 gap-0.5 px-2 pb-1">
                                        {group.emojis.map((e, i) => (
                                            <button key={i} onClick={() => insertEmoji(e)}
                                                className="text-xl text-center rounded p-0.5 transition-colors hover:bg-white/10">
                                                {e}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Input Bar */}
            <div className="px-[16px] py-[10px] flex items-end gap-2 z-20" style={{ background: '#202c33', borderTop: '1px solid rgba(134, 150, 160, 0.15)' }}>
                <div className="flex items-center gap-1 mb-1">
                    <button
                        onClick={() => setShowEmojiPicker(v => !v)}
                        className="p-2 rounded-full transition-all hover:bg-white/5 active:scale-95"
                        style={{ color: showEmojiPicker ? '#00a884' : '#8696a0' }}>
                        <Smile size={26} strokeWidth={1.5} />
                    </button>

                    <div className="relative" ref={attachmentMenuRef}>
                        <button
                            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                            className={`p-2 rounded-full transition-all hover:bg-white/5 active:scale-95 ${showAttachmentMenu ? 'rotate-45' : ''}`}
                            style={{ color: showAttachmentMenu ? '#00a884' : '#8696a0' }}>
                            <Plus size={26} strokeWidth={1.5} />
                        </button>

                        {showAttachmentMenu && (
                            <div className="absolute bottom-14 left-0 w-52 bg-[#233138] rounded-xl shadow-2xl overflow-hidden py-1.5 animate-in slide-in-from-bottom-4 duration-300 z-50 border border-[#2a3942]">
                                {ATTACHMENT_OPTIONS.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (opt.type === 'image' || opt.type === 'document') {
                                                const acceptMap = {
                                                    'image': 'image/*,video/*',
                                                    'document': '.pdf,.doc,.docx,.xls,.xlsx,.txt'
                                                };
                                                fileInputRef.current.accept = acceptMap[opt.type] || '*/*';
                                                fileInputRef.current.click();
                                            }
                                            setShowAttachmentMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#111b21] transition-colors group"
                                    >
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: opt.color }}>
                                            {React.cloneElement(opt.icon, { size: 16, className: 'text-white' })}
                                        </div>
                                        <span className="text-[13px] text-[#e9edef] font-medium">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { if (e.target.files[0]) { onSendMedia(e.target.files[0]); e.target.value = ''; } }} />

                <div className="flex-1 bg-[#2a3942] rounded-[8px] px-3 py-1.5 min-h-[42px] flex items-center mb-1">
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            e.target.style.height = '24px';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message"
                        className="flex-1 bg-transparent border-none focus:outline-none text-[#e9edef] text-[15px] resize-none overflow-y-auto max-h-32 py-0"
                        rows={1}
                        style={{ lineHeight: '24px' }}
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || sending}
                    className="p-2.5 rounded-full flex items-center justify-center transition-all flex-shrink-0 mb-1 active:scale-95"
                    style={{ color: inputValue.trim() && !sending ? '#00a884' : '#8696a0' }}>
                    {sending ? (
                        <Loader2 size={24} className="animate-spin" />
                    ) : (
                        <Send size={24} fill={inputValue.trim() && !sending ? "currentColor" : "none"} />
                    )}
                </button>
            </div>

            <style jsx="true">{`
                .whatsapp-scroll::-webkit-scrollbar {
                    width: 6px !important;
                }
                .whatsapp-scroll::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.1) !important;
                }
                .whatsapp-scroll::-webkit-scrollbar-track {
                    background: transparent !important;
                }
                .message-highlight {
                    background-color: rgba(0, 168, 132, 0.3) !important;
                    transition: all 0.4s ease;
                }
                .bubble-tail-out {
                    position: absolute;
                    top: 0;
                    right: -8px;
                    width: 0;
                    height: 0;
                    border-left: 10px solid #005c4b;
                    border-bottom: 10px solid transparent;
                }
                .bubble-tail-in {
                    position: absolute;
                    top: 0;
                    left: -8px;
                    width: 0;
                    height: 0;
                    border-right: 10px solid #202c33;
                    border-bottom: 10px solid transparent;
                }
                @keyframes message-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-message {
                    animation: message-in 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ChatWindow;
