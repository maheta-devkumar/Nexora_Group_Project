import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchChatbotData } from "../api/chatbot";
import { useAuth } from "./AuthContext";

/* ================= GEMINI API SETUP ================= */
const CHATBOT_API_KEY = import.meta.env.VITE_CHATBOT_API_KEY;
const genAI = new GoogleGenerativeAI(CHATBOT_API_KEY);

const ChatbotContext = createContext();

export const ChatbotProvider = ({ children }) => {
    const { user } = useAuth(); // Assuming AuthContext provides user object with role
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: "init",
            role: "assistant",
            text: "Hello! I am Nexora AI. How can I help you today?"
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [nexoraData, setNexoraData] = useState(null);
    const [role, setRole] = useState("Visitor");

    // Ref to access latest data inside async callbacks
    const nexoraDataRef = useRef(null);

    // Initial Data Fetch
    useEffect(() => {
        const loadData = async () => {
            if (!nexoraDataRef.current) {
                const response = await fetchChatbotData();
                if (response.success) {
                    setNexoraData(response.data);
                    nexoraDataRef.current = response.data;
                }
            }
        };
        loadData();
    }, []);

    // Role Detection
    useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                // Admin shouldn't really see this, but just in case
                setRole("Admin");
            } else if (user.role === 'delivery_person') {
                setRole("Delivery Person");
            } else {
                setRole("Customer");
            }
        } else {
            setRole("Visitor");
        }
    }, [user]);


    /* ================= SYSTEM PROMPT GENERATION ================= */
    const getRoleInstruction = (currentRole) => {
        let roleInstruction = "";
        switch (currentRole) {
            case "Delivery Person":
                roleInstruction = `USER ROLE: Delivery Person\nFOCUS: Deliveries, Earnings, Payouts.`;
                break;
            case "Customer":
                roleInstruction = `USER ROLE: Customer\nFOCUS: Products, Orders, Refunds.`;
                break;
            case "Visitor":
            default:
                roleInstruction = `USER ROLE: Visitor\nFOCUS: General inquiries, Sign up.`;
                break;
        }

        return `
        You are **Nexora AI**, the official virtual assistant for Nexora.
        GOAL: Provide helpful assistance based on user role and context.
        ${roleInstruction}
        
        RULES:
        1. Prioritize provided NEXORA DATA.
        2. If unrelated to Nexora, start with "👉 Not from Nexora:" and answer via general knowledge.
        3. Be concise and professional.
        `;
    };

    /* ================= SEND MESSAGE ================= */
    const sendMessage = useCallback(async (text) => {
        if (!text.trim()) return;

        // Add User Message
        const userMsg = { id: Date.now(), role: "user", text };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const roleInstruction = getRoleInstruction(role);

            // Configure model with concise system instruction
            const model = genAI.getGenerativeModel({
                model: "gemini-flash-lite-latest",
                systemInstruction: roleInstruction
            });

            // Prepare Data Context
            const dataContext = nexoraDataRef.current
                ? JSON.stringify(nexoraDataRef.current).substring(0, 30000)
                : "No data.";

            // Construct History
            // 1. Inject Data Context as the *first* exchange
            const contextHistory = [
                {
                    role: "user",
                    parts: [{ text: `Here is the CURRENT NEXORA DATA for reference:\n${dataContext}` }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I will use this data to answer your questions." }]
                }
            ];

            // 2. Add recent conversation (filtering out initial greeting)
            let recentMessages = messages.slice(-6);
            if (recentMessages.length > 0 && recentMessages[0].role === 'assistant') {
                recentMessages = recentMessages.slice(1);
            }

            const conversationHistory = recentMessages.map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.text }]
            }));

            // Combine histories
            // Note: If conversation is long, we might need to be careful, but context is priority.
            const fullHistory = [...contextHistory, ...conversationHistory];

            // Start chat
            const chat = model.startChat({
                history: fullHistory,
            });

            const result = await chat.sendMessage(text);
            const responseText = result.response.text();

            const botMsg = {
                id: Date.now() + 1,
                role: "assistant",
                text: responseText
            };

            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error("Chatbot Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: "assistant",
                text: "⚠️ I'm having trouble connecting right now. Please try again later. (" + (error.message || "Unknown error") + ")"
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, role]);

    const toggleChat = () => setIsOpen(prev => !prev);
    const closeChat = () => setIsOpen(false);
    const clearChat = () => setMessages([{ id: "init", role: "assistant", text: "Hello! I am Nexora AI. How can I help you today?" }]);

    const value = {
        isOpen,
        toggleChat,
        closeChat,
        messages,
        sendMessage,
        isLoading,
        role,
        clearChat
    };

    return <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>;
};

export const useChatbot = () => {
    const context = useContext(ChatbotContext);
    if (!context) {
        throw new Error("useChatbot must be used within a ChatbotProvider");
    }
    return context;
};
