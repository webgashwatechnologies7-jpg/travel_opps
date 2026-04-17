import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Send, Paperclip, RefreshCw, MoreVertical, Search, FileText, Download, Smile, CheckCheck, Check, Loader2, Reply, Copy, X, Mic, Image, Film, MapPin, User, MessageSquare, Plus, Sticker, Camera, ChevronDown, Info, Pin, Star, Forward, Trash, Circle } from 'lucide-react';
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

const ChatWindow = ({ chat, messages, onSendMessage, onSendMedia, isTyping, isSending, loadingMessages, profilePicUrl: externalProfilePicUrl, onRefresh }) => {
    const messagesEndRef = useRef(null);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiSearch, setEmojiSearch] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [hoveredMsg, setHoveredMsg] = useState(null);
    const [showReactionMenu, setShowReactionMenu] = useState(null); // msg.whatsapp_message_id
    const [showMessageMenu, setShowMessageMenu] = useState(null); // msg.whatsapp_message_id
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinTarget, setPinTarget] = useState(null);
    const [pinDuration, setPinDuration] = useState(604800); // Default 7 days
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showChatSearch, setShowChatSearch] = useState(false);
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [showChatMenu, setShowChatMenu] = useState(false);
    const emojiPickerRef = useRef(null);
    const attachmentMenuRef = useRef(null);
    const menuRef = useRef(null);
    const inputRef = useRef(null);
    const [localProfilePicUrl, setLocalProfilePicUrl] = useState(null);

    const profilePicUrl = externalProfilePicUrl || localProfilePicUrl;

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
            // Check specifically for elements that SHOULD NOT close the menu (like the bubble itself)
            const isClickInsideMenu = e.target.closest('.message-dropdown-menu');
            const isClickOnToggle = e.target.closest('.dropdown-trigger');

            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
            if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(e.target)) {
                setShowAttachmentMenu(false);
            }
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowChatMenu(false);
            }

            // Close message menu ONLY if click is outside BOTH the menu and the trigger bubble
            // Fix: Use !== null because showMessageMenu can be 0 (index)
            if (showMessageMenu !== null && !isClickInsideMenu && !isClickOnToggle) {
                setShowMessageMenu(null);
            }

            if (showReactionMenu !== null && !e.target.closest('.reaction-menu-container') && !e.target.closest('.smile-trigger')) {
                setShowReactionMenu(null);
            }
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showMessageMenu, showReactionMenu, showEmojiPicker, showAttachmentMenu, showChatMenu]);

    useEffect(() => {
        setLocalProfilePicUrl(null); // Clear previous DP when chat changes

        // If provided externally (e.g. from LeadDetails), skip local fetch
        if (externalProfilePicUrl) return;

        const currentJid = chat?.chat_id;
        if (currentJid && currentJid.includes('@')) {
            whatsappWebAPI.getProfilePicture(currentJid)
                .then(res => {
                    if (res?.data?.success && res?.data?.url) {
                        setLocalProfilePicUrl(res.data.url);
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch profile picture:', err);
                });
        }
    }, [chat?.chat_id, externalProfilePicUrl]);

    const REPLY_MARKER = '\u200B[REPLY]\u200B';

    const handleSend = () => {
        const text = inputValue.trim();
        if (!text || sending) return;

        let quotedId = null;
        let quotedPreview = null;
        if (replyingTo) {
            quotedId = replyingTo.whatsapp_message_id || replyingTo.id;
            quotedPreview = replyingTo.message?.substring(0, 60).replace(/\n/g, ' ') || '[media]';
        }

        // Clear UI state IMMEDIATELY for snappy feel
        setInputValue('');
        setReplyingTo(null);
        setShowEmojiPicker(false);
        if (inputRef.current) inputRef.current.style.height = '24px';

        setSending(true);
        onSendMessage(text, quotedId, quotedPreview).finally(() => {
            setSending(false);
        });
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
        let textToCopy = msg.message || msg.media_caption || '';

        // Clean up [REPLY] tags or quote blocks if present
        if (textToCopy.includes('[REPLY]')) {
            const lines = textToCopy.split('\n');
            if (lines.length > 1) {
                textToCopy = lines.slice(1).join('\n');
            } else {
                textToCopy = textToCopy.replace('[REPLY]', '').trim();
            }
        } else if (textToCopy.startsWith('> ') && textToCopy.includes('\n')) {
            textToCopy = textToCopy.split('\n').slice(1).join('\n');
        }

        if (textToCopy) {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    toast.success('Message copied!');
                }).catch((err) => {
                    console.error('Clipboard error:', err);
                    fallbackCopyTextToClipboard(textToCopy);
                });
            } else {
                fallbackCopyTextToClipboard(textToCopy);
            }
        } else {
            toast.warn('Nothing to copy');
        }
    };

    const fallbackCopyTextToClipboard = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            toast.success('Message copied!');
        } catch (err) {
            toast.error('Failed to copy message');
        }
        document.body.removeChild(textArea);
    };

    const handleStar = async (msg) => {
        try {
            const msgId = msg.whatsapp_message_id || msg.id;
            // The instruction implies whatsappWebAPI.starMessage might be missing or incorrectly called.
            // Assuming whatsappWebAPI is an object that should have a starMessage method.
            // The provided "Code Edit" snippet for `starMessage` definition belongs in `src/services/api.js`,
            // not directly in this component. This component should just call it.
            // The current call `whatsappWebAPI.starMessage({ message_id: msgId })` is syntactically correct
            // for calling a method on an imported API service.
            const res = await whatsappWebAPI.starMessage({ message_id: msgId });
            if (res.data.success) {
                toast.success(res.data.is_starred ? 'Message starred' : 'Message unstarred');
                onRefresh(); // Refresh messages to show the star icon
            }
        } catch (err) {
            toast.error('Failed to star message');
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
                ? (dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr)
                : dateStr.replace(' ', 'T');
            return new Date(normalized).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const formatDateLabel = (dateStr) => {
        try {
            if (!dateStr) return '';
            const normalized = dateStr.includes('T')
                ? (dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr)
                : dateStr.replace(' ', 'T');
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
            const norm = (s) => s.includes('T') ? (s.endsWith('Z') || s.includes('+') ? s : s) : s.replace(' ', 'T');
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

        // Temporarily treat as user scrolled to prevent auto-scrolling conflicts
        setIsUserScrolledUp(true);

        const targetId = `msg-${messageId}`;
        let element = document.getElementById(targetId);

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
            // Smoothly scroll to the message
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // WhatsApp Style Blink Highlight
            const bubble = element.querySelector('.message-bubble-content') || element;
            bubble.classList.add('highlight-blink');
            setTimeout(() => {
                bubble.classList.remove('highlight-blink');
            }, 2000);
        } else {
            toast.error("Original message not found in history");
        }
    };

    const handleReact = async (msg, emoji) => {
        try {
            const reactionId = msg.whatsapp_message_id || msg.id;
            const response = await whatsappWebAPI.sendReaction({
                chat_id: chat.chat_id,
                message_id: reactionId,
                emoji
            });
            if (response.data.success) {
                setShowReactionMenu(null);
                toast.success('Reaction sent');
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error('Failed to send reaction:', error);
            toast.error('Failed to react');
        }
    };

    const handlePinSubmit = async () => {
        if (!pinTarget) return;
        try {
            const response = await whatsappWebAPI.pinMessage({
                chat_id: chat.chat_id,
                message_id: pinTarget.whatsapp_message_id || pinTarget.id,
                duration: pinDuration
            });
            if (response.data.success) {
                toast.success('Message pinned!');
                setShowPinModal(false);
                setPinTarget(null);
                if (onRefresh) onRefresh();
            }
        } catch (error) {
            console.error('Pin error:', error);
            toast.error('Failed to pin message');
        }
    };

    const ATTACHMENT_OPTIONS = [
        { icon: <Image size={20} />, label: 'Photos & Videos', color: '#007bfc', type: 'image' },
        { icon: <Sticker size={20} />, label: 'Sticker', color: '#00a884', type: 'sticker' },
        { icon: <Camera size={20} />, label: 'Camera', color: '#ff2e74', type: 'camera' },
        { icon: <FileText size={20} />, label: 'Document', color: '#7f66ff', type: 'document' },
        { icon: <User size={20} />, label: 'Contact', color: '#06cf9c', type: 'contact' },
    ];

    const normalizeMediaUrl = (url) => {
        if (!url) return '';
        // If the URL contains localhost:3001 or 127.0.0.1:3001, replace with current host
        if (url.includes(':3001')) {
            const currentHost = window.location.hostname;
            return url.replace('localhost', currentHost).replace('127.0.0.1', currentHost);
        }
        return url;
    };

    const renderMedia = (msg) => {
        if (!msg.media_url) return null;

        const mediaUrl = normalizeMediaUrl(msg.media_url);
        const type = msg.media_type?.toLowerCase() || '';

        if (type === 'image' || type === 'sticker') {
            return (
                <div className="mt-1 mb-1 rounded-lg overflow-hidden max-w-[220px]">
                    <img
                        src={mediaUrl}
                        alt="Media"
                        className="w-full h-auto max-h-56 object-cover cursor-pointer"
                        onClick={() => window.open(mediaUrl, '_blank')}
                        onError={(e) => {
                            console.error("Image load failed:", mediaUrl);
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<div class="p-4 bg-black/10 text-[10px] text-[#8696a0] flex flex-col items-center gap-1"><i class="lucide lucide-image-off h-5 w-5"></i><span>Image unavailable</span></div>`;
                        }}
                    />
                    {msg.media_caption && <p className="p-1.5 text-xs text-[#e9edef] opacity-80">{msg.media_caption}</p>}
                </div>
            );
        }

        if (type === 'video') {
            return (
                <div className="mt-1 mb-1 rounded-lg overflow-hidden max-w-[220px]">
                    <video src={mediaUrl} controls className="w-full h-auto max-h-48" />
                    {msg.media_caption && <p className="p-1.5 text-xs text-[#e9edef] opacity-80">{msg.media_caption}</p>}
                </div>
            );
        }

        if (type === 'audio') {
            return (
                <div className="mt-1 mb-1">
                    <div className="flex items-center gap-2 bg-black/20 rounded-full px-3 py-2 border border-white/5">
                        <div className="w-8 h-8 bg-[#00a884] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Mic size={14} className="text-white" />
                        </div>
                        <audio src={mediaUrl} controls className="h-8 flex-1 whatsapp-audio" style={{ minWidth: 150 }} />
                    </div>
                </div>
            );
        }

        if (type === 'document' || type === 'file') {
            const filename = mediaUrl.split('/').pop() || 'Document';
            return (
                <a href={mediaUrl} target="_blank" rel="noreferrer"
                    className="mt-1 mb-1 flex items-center gap-2 p-2.5 bg-black/20 border border-white/5 rounded-xl hover:bg-black/30 transition-all group">
                    <div className="w-9 h-9 bg-[#202c33] rounded-lg flex items-center justify-center flex-shrink-0 border border-white/5 group-hover:bg-[#00a884] transition-colors">
                        <FileText size={18} className="text-[#aebac1] group-hover:text-white" />
                    </div>
                    <div className="min-w-0 pr-4">
                        <p className="text-[12.5px] font-medium truncate max-w-[140px] text-[#e9edef]">{msg.media_caption || filename}</p>
                        <p className="text-[10px] text-[#8696a0] uppercase tracking-wider">Document</p>
                    </div>
                    <Download size={16} className="text-[#8696a0] ml-auto flex-shrink-0 group-hover:text-[#00a884]" />
                </a>
            );
        }

        return null;
    };

    const renderMessage = (msg, index, messagesList) => {
        const isOutbound = msg.direction?.toLowerCase() === 'outbound';
        const isReaction = isReactionMsg(msg);
        const isHovered = hoveredMsg === (msg.whatsapp_message_id || msg.id || index);

        // Separators
        const showDateSeparator = index === 0 ||
            !isSameDay(messagesList[index - 1].created_at, msg.created_at);

        // Only show one "Unread Messages" divider at the very first unread message
        const firstUnreadIdx = messagesList.findIndex(m => m.direction === 'inbound' && m.status !== 'read');
        const showUnreadDivider = index === firstUnreadIdx;

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

        // Check if it's a SYSTEM message (e.g., You pinned a message)
        const isSystemMsg = bodyText.includes('You pinned a message') || bodyText.includes('pinned a message');

        if (isSystemMsg) {
            const cleanSysText = bodyText.replace(CLEAN_REPLY_TAG, '').trim();
            return (
                <div key={msg.id || index} className="w-full flex justify-center my-2">
                    <span className="px-4 py-1.5 bg-[#182229]/80 text-[#8696a0] text-[12.5px] rounded-[10px] shadow-sm font-medium border border-white/5 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                        {cleanSysText}
                    </span>
                </div>
            );
        }

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

        // Determine Quoted Message Author and Text Fallback
        let quotedAuthor = null;
        if (msg.quoted_message_id) {
            const originalMsg = messages.find(m => m.whatsapp_message_id === msg.quoted_message_id);
            if (originalMsg) {
                quotedAuthor = originalMsg.direction === 'outbound' ? 'You' : (chat.chat_name || 'Customer');
                if (!quotedPart) {
                    // If it's an image/video/etc without caption, show the type
                    if (originalMsg.media_type) {
                        const typeCaps = originalMsg.media_type.charAt(0).toUpperCase() + originalMsg.media_type.slice(1);
                        quotedPart = typeCaps;
                    } else {
                        quotedPart = originalMsg.message;
                    }
                }
            }
        }
        if (!quotedAuthor && quotedPart) {
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
            <div key={msg.id || index} className={`w-full animate-message relative ${showMessageMenu === (msg.whatsapp_message_id || msg.id || index) ? 'z-[100]' : 'z-0'}`}>
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
                    className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-[2px] px-2 relative animate-in fade-in slide-in-from-bottom-1 duration-300 ${showMessageMenu === (msg.whatsapp_message_id || msg.id || index) || showReactionMenu === (msg.whatsapp_message_id || msg.id || index) ? 'z-[100]' : 'z-10'}`}
                >
                    <div
                        className="relative group max-w-[85%] flex items-end"
                        onMouseEnter={() => setHoveredMsg(msg.whatsapp_message_id || msg.id || index)}
                        onMouseLeave={() => {
                            setHoveredMsg(null);
                            // We don't close showReactionMenu here to avoid gap issues
                        }}
                    >
                        {/* Hover action removed for cleaner flow - use Chevron instead */}

                        {showReactionMenu === (msg.whatsapp_message_id || msg.id || index) && (
                            <div className={`reaction-menu-container absolute ${index < messagesList.length / 2 ? 'top-[95%]' : 'bottom-[95%]'} ${isOutbound ? 'right-0' : 'left-0'} flex items-center gap-1 bg-[#233138] border border-[#2a3942] rounded-full px-2 py-1 shadow-2xl z-[110] animate-in fade-in zoom-in-75 duration-200`}>
                                {QUICK_REACTIONS.slice(0, 6).map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReact(msg, emoji)}
                                        className="text-2xl hover:scale-125 transition-transform duration-200 p-1"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                                <button
                                    onClick={() => { setShowEmojiPicker(true); setShowReactionMenu(null); }}
                                    className="p-1.5 rounded-full hover:bg-white/10 text-[#8696a0] hover:text-[#e9edef] transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        )}

                        <div
                            onDoubleClick={() => handleReply(msg)}
                            className={`message-bubble-content px-2 py-1.5 rounded-[7.5px] shadow-sm relative cursor-default transition-all duration-300
                            ${(msg.whatsapp_message_id || msg.id) === chat.pinned_message_id ? 'ring-2 ring-inset ring-[#00a884]/40' : ''}
                            ${isOutbound ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'}`}>

                            {/* Pinned Icon Indicator */}
                            {(msg.whatsapp_message_id || msg.id) === chat.pinned_message_id && (
                                <div className="absolute top-1.5 right-6 text-[#00a884] opacity-80 scale-75 origin-right">
                                    <Pin size={14} fill="currentColor" />
                                </div>
                            )}

                            {/* Chevron & Emoji Trigger on Bubble Hover */}
                            {isHovered && !showMessageMenu && !showReactionMenu && (
                                <div className={`absolute top-0.5 ${isOutbound ? '-left-12' : '-right-12'} flex items-center gap-0.5 z-40 transition-opacity duration-200`}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowReactionMenu(msg.whatsapp_message_id || msg.id || index); }}
                                        className="smile-trigger p-2 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#182229]/60 backdrop-blur-sm transition-all"
                                    >
                                        <Smile size={19} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const msgId = msg.whatsapp_message_id || msg.id || index;
                                            setShowMessageMenu(prev => prev === msgId ? null : msgId);
                                        }}
                                        className="dropdown-trigger p-2 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#182229]/60 backdrop-blur-sm transition-all"
                                    >
                                        <ChevronDown size={19} />
                                    </button>
                                </div>
                            )}

                            {/* Options Dropdown Menu - WhatsApp Style */}
                            {showMessageMenu === (msg.whatsapp_message_id || msg.id || index) && (
                                <div className={`message-dropdown-menu absolute ${index > messagesList.length / 2 ? 'bottom-2' : 'top-10'} ${isOutbound ? 'right-2' : 'left-2'} w-52 py-2 rounded-lg shadow-2xl z-[100] border border-[#2a3942] animate-in zoom-in-95 duration-200`} style={{ background: '#233138', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                                    <button
                                        onClick={() => {
                                            let info = `Status: ${msg.status || 'Sent'}\n`;
                                            if (msg.delivered_at) info += `Delivered: ${formatTime(msg.delivered_at)}\n`;
                                            if (msg.read_at) info += `Read: ${formatTime(msg.read_at)}\n`;
                                            info += `Sent: ${formatTime(msg.created_at)}`;

                                            toast.info(info, {
                                                autoClose: 5000,
                                                style: { background: '#233138', color: '#e9edef', fontSize: '14px' }
                                            });
                                            setShowMessageMenu(null);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-[14.5px] hover:bg-[#182229] transition-colors text-[#e9edef] flex items-center gap-4">
                                        <Info size={18} className="text-[#8696a0]" /> Message info
                                    </button>
                                    <button onClick={() => { handleReply(msg); setShowMessageMenu(null); }} className="w-full px-4 py-2.5 text-left text-[14.5px] hover:bg-[#182229] transition-colors text-[#e9edef] flex items-center gap-4">
                                        <Reply size={18} className="text-[#8696a0]" /> Reply
                                    </button>
                                    <button onClick={() => { handleCopy(msg); setShowMessageMenu(null); }} className="w-full px-4 py-2.5 text-left text-[14.5px] hover:bg-[#182229] transition-colors text-[#e9edef] flex items-center gap-4">
                                        <Copy size={18} className="text-[#8696a0]" /> Copy
                                    </button>
                                    <button onClick={() => { setShowReactionMenu(msg.whatsapp_message_id || msg.id || index); setShowMessageMenu(null); }} className="w-full px-4 py-2.5 text-left text-[14.5px] hover:bg-[#182229] transition-colors text-[#e9edef] flex items-center gap-4">
                                        <Smile size={18} className="text-[#8696a0]" /> React
                                    </button>
                                    <button
                                        onClick={() => { toast.info('Forwarding feature coming soon!'); setShowMessageMenu(null); }}
                                        className="w-full px-4 py-2.5 text-left text-[14.5px] hover:bg-[#182229] transition-colors text-[#e9edef] flex items-center gap-4">
                                        <Forward size={18} className="text-[#8696a0]" /> Forward
                                    </button>
                                    <button
                                        onClick={() => { setPinTarget(msg); setShowPinModal(true); setShowMessageMenu(null); }}
                                        className="w-full px-4 py-2.5 text-left text-[14.5px] hover:bg-[#182229] transition-colors text-[#e9edef] flex items-center gap-4">
                                        <Pin size={18} className="text-[#8696a0]" /> Pin
                                    </button>
                                    <button
                                        onClick={() => { toast.info('Meta AI integration coming soon!'); setShowMessageMenu(null); }}
                                        className="w-full px-4 py-2.5 text-left text-[14.5px] hover:bg-[#182229] transition-colors text-[#e9edef] flex items-center gap-4">
                                        <Circle size={18} className="text-[#8696a0]" /> Ask Meta AI
                                    </button>
                                    <button
                                        onClick={() => { handleStar(msg); setShowMessageMenu(null); }}
                                        className="w-full px-4 py-2.5 text-left text-[14.5px] hover:bg-[#182229] transition-colors text-[#e9edef] flex items-center gap-4">
                                        <Star size={18} className={`${msg.is_starred ? 'text-yellow-400 fill-yellow-400' : 'text-[#8696a0]'}`} />
                                        {msg.is_starred ? 'Unstar' : 'Star'}
                                    </button>
                                    <div className="h-[1px] bg-[#2a3942] my-1 mx-2" />
                                    <button
                                        onClick={() => { toast.info('Delete feature coming soon!'); setShowMessageMenu(null); }}
                                        className="w-full px-4 py-2.5 text-left text-[14.5px] hover:bg-[#182229] transition-colors text-[#ea0038] flex items-center gap-4">
                                        <Trash size={18} className="text-[#ea0038]" /> Delete
                                    </button>
                                </div>
                            )}

                            {/* Bubble Tails */}
                            {isOutbound ? <div className="bubble-tail-out" /> : <div className="bubble-tail-in" />}

                            {/* Improved WhatsApp Quote Styling */}
                            {quotedPart && (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const orig = messages.find(m => m.whatsapp_message_id === msg.quoted_message_id || m.id === msg.quoted_message_id);
                                        scrollToMessage(orig?.whatsapp_message_id || orig?.id || msg.quoted_message_id, quotedPart);
                                    }}
                                    className="mb-1 flex flex-col rounded-[6px] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-black/20 pr-2"
                                >
                                    <div className="flex bg-white/5 relative pb-1 pt-1 pl-3 h-full">
                                        <div className={`absolute top-0 bottom-0 left-0 w-[4px] ${quotedAuthor === 'You' ? 'bg-[#06cf9c]' : 'bg-[#53bdeb]'}`}></div>
                                        <div className="flex flex-col flex-1 pl-1 min-w-0">
                                            <p className={`font-semibold text-[13px] leading-tight mb-0.5 truncate ${quotedAuthor === 'You' ? 'text-[#06cf9c]' : 'text-[#53bdeb]'}`}>
                                                {quotedAuthor}
                                            </p>
                                            <div className="flex items-center gap-1 opacity-70">
                                                {/* Show Media Icon in Quote if applicable */}
                                                {(() => {
                                                    const orig = messages.find(m => m.whatsapp_message_id === msg.quoted_message_id);
                                                    if (orig?.media_type) {
                                                        if (orig.media_type === 'image') return <Image size={14} className="text-[#8696a0]" />;
                                                        if (orig.media_type === 'video') return <Film size={14} className="text-[#8696a0]" />;
                                                        if (orig.media_type === 'document') return <FileText size={14} className="text-[#8696a0]" />;
                                                    }
                                                    return null;
                                                })()}
                                                <p className="truncate text-[13px] text-[#e9edef] leading-tight">
                                                    {quotedPart}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Optional Thumbnail for Image/Video Quotes */}
                                        {(() => {
                                            const orig = messages.find(m => m.whatsapp_message_id === msg.quoted_message_id);
                                            if (orig?.media_url && (orig.media_type === 'image' || orig.media_type === 'video')) {
                                                return (
                                                    <div className="w-[45px] h-[45px] flex-shrink-0 ml-2 bg-[#1c272d] rounded-[4px] overflow-hidden">
                                                        <img
                                                            src={orig.media_url}
                                                            className="w-full h-full object-cover"
                                                            alt="quote-thumb"
                                                            onError={(e) => e.target.style.display = 'none'}
                                                        />
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                </div>
                            )}

                            {renderMedia(msg)}

                            {bodyText && (
                                <p className="text-[14.2px] leading-[1.4] whitespace-pre-wrap pr-[70px]">
                                    {bodyText}
                                </p>
                            )}

                            {/* Footer - Time & Status */}
                            <div className="flex items-center gap-1.5 justify-end ml-auto mt-1 pb-0.5 pr-0.5 opacity-100">
                                {!!msg.is_starred && <Star size={12} className="text-[#ffd700] fill-[#ffd700] mr-1" />}
                                <span className="text-[11px] tabular-nums tracking-tighter text-[#e9edef] opacity-80">{formatTime(msg.created_at)}</span>
                                {isOutbound && (
                                    <span className="flex items-center">
                                        {msg.status === 'read' || msg.status === 'viewed' ? <CheckCheck size={16} className="text-[#53bdeb]" /> :
                                            msg.status === 'delivered' ? <CheckCheck size={16} className="text-[#8696a0]" /> :
                                                msg.status === 'sending' ? <Loader2 size={12} className="animate-spin text-[#8696a0]" /> :
                                                    msg.status === 'failed' ? <span title="Send failed" className="text-red-500 text-[10px] font-bold">!</span> :
                                                        <Check size={16} className="text-[#8696a0]" />}
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
            </div >
        );
    };

    const chatDisplayName = chat ? (chat.chat_name || (() => {
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
        return num || 'Unknown';
    })()) : 'None';

    const getInitials = (name) => {
        if (!name) return '?';
        const clean = name.replace(/[^a-zA-Z0-9]/g, '').trim();
        return clean ? clean.charAt(0).toUpperCase() : name.charAt(0);
    };

    // Memoize the rendered messages for performance
    const renderedMessages = React.useMemo(() => {
        if (!chat || !messages) return [];

        // Filter out protocol messages and reactions if needed
        const filtered = messages
            .filter(msg => !(isReactionMsg(msg) && msg.quoted_message_id))
            .filter(msg => {
                if (!chatSearchQuery) return true;
                const body = msg.message?.toLowerCase() || '';
                return body.includes(chatSearchQuery.toLowerCase());
            });

        return filtered.map((msg, idx) => renderMessage(msg, idx, filtered));
    }, [messages, chatSearchQuery, hoveredMsg, showMessageMenu, showReactionMenu, chat?.pinned_message_id, replyingTo, chat]);

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

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden" style={{ background: '#0b141a' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 z-20 border-b border-[#1f2c33] shrink-0" style={{ background: '#202c33' }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm bg-gradient-to-br from-[#00bfa5] to-[#00a884] overflow-hidden">
                        {profilePicUrl ? (
                            <img src={profilePicUrl} alt={chatDisplayName} className="w-full h-full object-cover" />
                        ) : (
                            getInitials(chatDisplayName)
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-medium text-[15px] truncate" style={{ color: '#e9edef' }}>{chatDisplayName}</h3>
                        {isTyping ? <p className="text-[11px] text-[#00a884] animate-pulse">typing...</p> : <p className="text-[11px] text-[#8696a0]">WhatsApp</p>}
                    </div>
                </div>
                <div className="flex items-center gap-1 text-[#aebac1] relative">
                    <button
                        onClick={onRefresh}
                        className={`p-2 rounded-full transition-colors ${loadingMessages ? 'animate-spin text-[#00a884]' : 'hover:bg-white/5'}`}
                        disabled={loadingMessages}
                        title="Refresh messages and profile"
                    >
                        <RefreshCw size={18} />
                    </button>

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

            {/* Pinned Message Bar */}
            {chat?.pinned_message_id && (
                <div
                    onClick={() => {
                        const el = document.getElementById(`msg-${chat.pinned_message_id}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="flex items-center gap-3 px-4 py-2 border-b border-[#1f2c33] bg-[#202c33]/90 backdrop-blur-md cursor-pointer hover:bg-[#202c33] transition-all z-[60] animate-in slide-in-from-top duration-300"
                >
                    <div className="w-8 h-8 rounded-lg bg-[#00a884]/20 flex items-center justify-center flex-shrink-0">
                        <Pin size={15} className="text-[#00a884]" fill="currentColor" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-[11px] font-bold text-[#00a884] uppercase tracking-wider mb-0.5">Pinned Message</p>
                        <p className="text-[13.5px] text-[#e9edef] truncate opacity-90">
                            {messages.find(m => (m.whatsapp_message_id || m.id) === chat.pinned_message_id)?.message?.replace('[REPLY]', '').trim() || 'View pinned message'}
                        </p>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 relative overflow-hidden z-10">
                {/* Background Wallpaper layer */}
                <div
                    className="absolute inset-0 opacity-[0.05] z-0"
                    style={{
                        backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
                        backgroundSize: '480px',
                        backgroundRepeat: 'repeat',
                        filter: 'invert(0.8) hue-rotate(120deg) brightness(0.6)'
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
                            if (chatSearchQuery && renderedMessages.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-2">
                                        <Search size={32} className="text-[#8696a0]" />
                                        <p className="text-[#8696a0] text-sm">No results found for "{chatSearchQuery}"</p>
                                    </div>
                                );
                            }
                            return renderedMessages;
                        })()
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

                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                    if (e.target.files[0]) {
                        let qId = null;
                        let qPreview = null;
                        if (replyingTo) {
                            qId = replyingTo.whatsapp_message_id || replyingTo.id;
                            qPreview = replyingTo.message?.substring(0, 60).replace(/\n/g, ' ') || '[media]';
                        }
                        onSendMedia(e.target.files[0], qId, qPreview);
                        setReplyingTo(null);
                        e.target.value = '';
                    }
                }} />

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

            {/* WhatsApp Style Pin Modal */}
            {showPinModal && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#233138] w-[95%] max-w-[400px] rounded-[22px] shadow-2xl p-7 border border-[#2a3942] animate-in zoom-in-95 duration-200">
                        <h3 className="text-[#e9edef] text-[19px] font-semibold mb-2">Choose how long your pin lasts</h3>
                        <p className="text-[#8696a0] text-[15px] mb-8">You can unpin at any time.</p>

                        <div className="space-y-6 mb-10">
                            {[
                                { label: '24 hours', value: 86400 },
                                { label: '7 days', value: 604800 },
                                { label: '30 days', value: 2592000 }
                            ].map((opt) => (
                                <label key={opt.value} className="flex items-center gap-5 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="radio"
                                            name="pinDuration"
                                            className="sr-only"
                                            checked={pinDuration === opt.value}
                                            onChange={() => setPinDuration(opt.value)}
                                        />
                                        <div className={`w-[22px] h-[22px] rounded-full border-2 transition-all flex items-center justify-center ${pinDuration === opt.value ? 'border-[#00a884]' : 'border-[#8696a0] group-hover:border-[#e9edef]'}`}>
                                            {pinDuration === opt.value && <div className="w-[12px] h-[12px] rounded-full bg-[#00a884] shadow-sm" />}
                                        </div>
                                    </div>
                                    <span className="text-[#e9edef] text-[16px] font-medium">{opt.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end items-center gap-6 pr-2">
                            <button
                                onClick={() => { setShowPinModal(false); setPinTarget(null); }}
                                className="text-[#00a884] text-[15px] font-bold hover:bg-[#00a884]/10 px-4 py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePinSubmit}
                                className="bg-[#00a884] text-[#111b21] text-[15px] font-bold px-8 py-2.5 rounded-full hover:bg-[#06cf9c] transition-all shadow-lg active:scale-95 transform"
                            >
                                Pin
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
