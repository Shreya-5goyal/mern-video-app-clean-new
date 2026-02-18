import React, { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '../../socket';
import { Send, X, MessageSquare, Smile, Paperclip } from 'lucide-react';
import './ChatBox.css';

// Quick emoji reactions
const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

const ChatBox = ({ roomId, userName, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Socket chat events
    useEffect(() => {
        // Listen for incoming chat messages
        const handleChatMessage = ({ senderId, senderName, text, timestamp, type }) => {
            const isOwn = senderId === socket.id;
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + Math.random(),
                    senderId,
                    senderName: isOwn ? 'You' : senderName,
                    text,
                    timestamp: timestamp || Date.now(),
                    type: type || 'text',
                    isOwn,
                }
            ]);
            if (!isOwn) {
                setUnreadCount(prev => prev + 1);
            }
        };

        // Listen for user join/leave notifications
        const handleUserJoined = ({ userName: name }) => {
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + Math.random(),
                    type: 'system',
                    text: `${name} joined the room`,
                    timestamp: Date.now(),
                }
            ]);
        };

        const handleUserLeft = ({ userName: name }) => {
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + Math.random(),
                    type: 'system',
                    text: `${name} left the room`,
                    timestamp: Date.now(),
                }
            ]);
        };

        socket.on('chat-message', handleChatMessage);
        socket.on('user-joined-chat', handleUserJoined);
        socket.on('user-left-chat', handleUserLeft);

        // Announce joining
        socket.emit('chat-join', { roomId, userName });

        return () => {
            socket.off('chat-message', handleChatMessage);
            socket.off('user-joined-chat', handleUserJoined);
            socket.off('user-left-chat', handleUserLeft);
            socket.emit('chat-leave', { roomId, userName });
        };
    }, [roomId, userName]);

    // Reset unread when visible
    useEffect(() => {
        if (isVisible) setUnreadCount(0);
    }, [isVisible, messages]);

    const sendMessage = useCallback((text, type = 'text') => {
        if (!text.trim()) return;

        const messageData = {
            roomId,
            senderName: userName,
            text: text.trim(),
            timestamp: Date.now(),
            type,
        };

        // Emit to server
        socket.emit('chat-message', messageData);

        // Add locally immediately (optimistic update)
        setMessages(prev => [
            ...prev,
            {
                id: Date.now() + Math.random(),
                senderId: socket.id,
                senderName: 'You',
                text: text.trim(),
                timestamp: Date.now(),
                type,
                isOwn: true,
            }
        ]);

        setInput('');
        setShowEmoji(false);
        inputRef.current?.focus();
    }, [roomId, userName]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const formatTime = (ts) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getInitials = (name) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
    };

    const getAvatarColor = (name) => {
        const colors = ['#7c3aed', '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
        const idx = name?.charCodeAt(0) % colors.length || 0;
        return colors[idx];
    };

    return (
        <div className="chatbox-container">
            {/* Header */}
            <div className="chatbox-header">
                <div className="chatbox-header-left">
                    <div className="chatbox-icon">
                        <MessageSquare size={16} />
                    </div>
                    <div>
                        <h3 className="chatbox-title">Room Chat</h3>
                        <p className="chatbox-subtitle">{roomId}</p>
                    </div>
                </div>
                <button className="chatbox-close" onClick={onClose} title="Close chat">
                    <X size={16} />
                </button>
            </div>

            {/* Messages */}
            <div className="chatbox-messages">
                {messages.length === 0 && (
                    <div className="chatbox-empty">
                        <MessageSquare size={32} opacity={0.3} />
                        <p>No messages yet</p>
                        <span>Say hello to everyone! 👋</span>
                    </div>
                )}

                {messages.map(msg => {
                    if (msg.type === 'system') {
                        return (
                            <div key={msg.id} className="chat-system-msg">
                                <span>{msg.text}</span>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={msg.id}
                            className={`chat-message ${msg.isOwn ? 'own' : 'other'}`}
                        >
                            {!msg.isOwn && (
                                <div
                                    className="chat-avatar"
                                    style={{ background: getAvatarColor(msg.senderName) }}
                                >
                                    {getInitials(msg.senderName)}
                                </div>
                            )}
                            <div className="chat-bubble-wrapper">
                                {!msg.isOwn && (
                                    <span className="chat-sender-name">{msg.senderName}</span>
                                )}
                                <div className={`chat-bubble ${msg.type === 'emoji' ? 'emoji-bubble' : ''}`}>
                                    {msg.type === 'emoji' ? (
                                        <span className="chat-emoji-reaction">{msg.text}</span>
                                    ) : (
                                        <p>{msg.text}</p>
                                    )}
                                </div>
                                <span className="chat-time">{formatTime(msg.timestamp)}</span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick emoji reactions */}
            {showEmoji && (
                <div className="emoji-picker">
                    {QUICK_EMOJIS.map(emoji => (
                        <button
                            key={emoji}
                            className="emoji-btn"
                            onClick={() => sendMessage(emoji, 'emoji')}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* Input area */}
            <div className="chatbox-input-area">
                <button
                    className={`chat-action-btn ${showEmoji ? 'active' : ''}`}
                    onClick={() => setShowEmoji(!showEmoji)}
                    title="Emoji reactions"
                >
                    <Smile size={18} />
                </button>

                <div className="chat-input-wrapper">
                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        placeholder="Type a message..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        maxLength={500}
                    />
                </div>

                <button
                    className={`chat-send-btn ${input.trim() ? 'active' : ''}`}
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim()}
                    title="Send message"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
};

// Floating chat toggle button with unread badge
export const ChatToggleButton = ({ onClick, unreadCount = 0, isOpen }) => (
    <button
        className={`chat-toggle-btn ${isOpen ? 'active' : ''}`}
        onClick={onClick}
        title="Toggle Chat"
    >
        <MessageSquare size={20} />
        {unreadCount > 0 && !isOpen && (
            <span className="chat-unread-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
    </button>
);

export default ChatBox;
