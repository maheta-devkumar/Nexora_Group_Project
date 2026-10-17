import React, { useRef, useEffect } from 'react';
import { useChatbot } from '../../context/ChatbotContext';
import './Chatbot.css';
import {
    MessageCircle,
    X,
    Send,
    Trash2,
    Bot,
    User,
    Loader2
} from 'lucide-react';
import Markdown from 'react-markdown';

const Chatbot = () => {
    const {
        isOpen,
        toggleChat,
        closeChat,
        messages,
        sendMessage,
        isLoading,
        role,
        clearChat
    } = useChatbot();

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = (e) => {
        e.preventDefault();
        const text = inputRef.current.value;
        if (text.trim()) {
            sendMessage(text);
            inputRef.current.value = '';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    if (!isOpen) {
        return (
            <button
                className="nexora-chatbot-trigger"
                onClick={toggleChat}
                title="Chat with Nexora AI"
            >
                <MessageCircle size={24} />
                <span className="trigger-text">Nexora AI</span>
            </button>
        );
    }

    return (
        <div className="nexora-chatbot-container">
            {/* Header */}
            <div className="chatbot-header">
                <div className="header-info">
                    <div className="bot-avatar-sm">
                        <Bot size={20} />
                    </div>
                    <div className="header-text">
                        <h3>Nexora AI</h3>
                        <span className="role-badge">{role} Mode</span>
                    </div>
                </div>
                <div className="header-actions">
                    <button onClick={clearChat} title="Clear Chat" className="icon-btn">
                        <Trash2 size={18} />
                    </button>
                    <button onClick={closeChat} title="Close" className="icon-btn">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="chatbot-messages">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`message-wrapper ${msg.role === 'user' ? 'user' : 'bot'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="message-avatar bot">
                                <Bot size={16} />
                            </div>
                        )}

                        <div className="message-bubble">
                            <Markdown>{msg.text}</Markdown>
                        </div>

                        {msg.role === 'user' && (
                            <div className="message-avatar user">
                                <User size={16} />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="message-wrapper bot">
                        <div className="message-avatar bot">
                            <Bot size={16} />
                        </div>
                        <div className="message-bubble loading">
                            <Loader2 className="spinner" size={16} />
                            <span>Thinking...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chatbot-input-area">
                <form onSubmit={handleSend}>
                    <textarea
                        ref={inputRef}
                        placeholder="Ask me anything about Nexora..."
                        onKeyDown={handleKeyDown}
                        rows={1}
                    />
                    <button type="submit" disabled={isLoading} className="send-btn">
                        <Send size={18} />
                    </button>
                </form>
                <div className="chatbot-footer">
                    Powered by Nexora
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
