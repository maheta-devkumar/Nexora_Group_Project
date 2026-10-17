import React, { useState, useEffect, useRef } from 'react';
import { useAdminAI } from '../../context/AdminAIContext';
import AdminAIMessage from './AdminAIMessage';

import './AdminAIChat.css';

const AdminAIChat = () => {
    const { conversation, sendMessage, loading, clearChat } = useAdminAI();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversation, loading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const msg = input;
        setInput('');
        await sendMessage(msg);
    };

    return (
        <div className="admin-ai-chat-container">
            {/* Header */}
            <div className="chat-header">
                <div className="header-left">
                    <div className="ai-avatar">
                        ✨
                    </div>
                    <div className="header-info">
                        <h3>Admin Intelligence</h3>
                        <p>Powered by Gemini • Connected to Live Data</p>
                    </div>
                </div>
                <button
                    onClick={clearChat}
                    className="clear-btn"
                >
                    Clear History
                </button>
            </div>

            {/* Messages Area */}
            <div className="messages-area">
                {conversation.map((msg) => (
                    <AdminAIMessage key={msg.id} message={msg} />
                ))}
                {loading && (
                    <div className="loading-indicator">
                        <div className="loading-bubble">
                            <div className="dot" style={{ animationDelay: '0ms' }} />
                            <div className="dot" style={{ animationDelay: '150ms' }} />
                            <div className="dot" style={{ animationDelay: '300ms' }} />
                            <span className="loading-text">Analyzing data...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="chat-form">
                <div className="input-group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        placeholder="Ask anything about reports, inventory, or sales..."
                        className="chat-input"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="send-btn"
                    >
                        <span>Send</span>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
                <p className="disclaimer-text">
                    AI analyses real-time backend data. Responses may vary based on data availability.
                </p>
            </form>
        </div>
    );
};

export default AdminAIChat;
