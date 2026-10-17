import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/Admin/Layout/AdminLayout';

const AIChat = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { id: 1, role: 'ai', text: "Hello! I'm your Nexora Store Assistant. Ask me anything about your sales, inventory, or customers." }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI Response
        setTimeout(() => {
            let responseText = "I analyze that data for you. Based on current trends, everything looks stable.";
            const lowerInput = userMsg.text.toLowerCase();

            if (lowerInput.includes('sales') || lowerInput.includes('revenue')) {
                responseText = "Your sales are trending upwards! Today's revenue is $4,250, which is a 12% increase from yesterday. Electronics are the top-performing category.";
            } else if (lowerInput.includes('stock') || lowerInput.includes('inventory')) {
                responseText = "You have 5 critical low-stock items. 'Wireless Headphones' need immediate restocking (only 3 units left). Should I draft a purchase order?";
            } else if (lowerInput.includes('customer')) {
                responseText = "You've acquired 12 new customers today. Most are coming from organic search. Retention rate remains high at 28%.";
            }

            const aiMsg = { id: Date.now() + 1, role: 'ai', text: responseText };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1500);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <AdminLayout>
            <div className="flex flex-col h-[calc(100vh-var(--header-height))] bg-[var(--admin-bg-main)]">
                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md border-b border-[var(--admin-border)] px-6 py-4 flex items-center gap-4 shadow-sm z-20 sticky top-0">
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="p-2 hover:bg-[var(--admin-bg-hover)] rounded-full transition-colors text-[var(--admin-text-secondary)]"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-premium rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200/50">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-[var(--admin-text-primary)] text-lg tracking-tight">Nexora AI Assistant</h1>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs text-[var(--admin-text-secondary)] font-medium">Online & Analyzing Live Data</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-6 pb-4">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : 'animate-fade-in'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'ai'
                                    ? 'bg-gradient-premium text-white'
                                    : 'bg-white border border-[var(--admin-border)] text-slate-600'}`}>
                                    {msg.role === 'ai' ? <Bot size={20} /> : <UserIcon size={20} />}
                                </div>
                                <div className={`max-w-[85%] p-5 rounded-2xl shadow-sm leading-relaxed text-[15px] ${msg.role === 'ai'
                                    ? 'bg-white text-[var(--admin-text-primary)] border border-[var(--admin-border)] rounded-tl-none'
                                    : 'bg-[var(--admin-primary)] text-white rounded-tr-none shadow-indigo-200/30'
                                    }`}>
                                    <p>{msg.text}</p>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-5 animate-fade-in">
                                <div className="w-10 h-10 rounded-full bg-gradient-premium text-white flex items-center justify-center shadow-sm">
                                    <Bot size={20} />
                                </div>
                                <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-[var(--admin-border)] shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-[var(--admin-border)] z-20">
                    <div className="max-w-4xl mx-auto relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask about revenue trends, low stock, or refund status..."
                            className="w-full pl-6 pr-14 py-4 bg-[var(--admin-bg-main)] border border-[var(--admin-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner text-[var(--admin-text-primary)] placeholder-slate-400"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className={`absolute right-3 top-3 p-2 rounded-lg transition-all ${input.trim()
                                ? 'bg-[var(--admin-primary)] text-white hover:bg-[var(--admin-primary-hover)] shadow-lg shadow-indigo-200/50 transform hover:scale-105'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                    <div className="text-center mt-3">
                        <p className="text-xs text-[var(--admin-text-muted)] flex items-center justify-center gap-1.5">
                            <Sparkles size={12} className="text-indigo-400" /> AI insights based on real-time store data. Verify critical actions.
                        </p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AIChat;
