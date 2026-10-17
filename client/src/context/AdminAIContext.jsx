import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useEffect
} from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useReports } from "./ReportsContext";

/* ================= GEMINI API SETUP ================= */
// Reusing the same key as AIContext to ensure consistency
const GEMINI_API_KEY = "AIzaSyD1E0K6aNVnIxAUN3eQTPpn367slKLc8EY";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/* ================= CONTEXT ================= */
const AdminAIContext = createContext();

/* ================= HELPER: FORMAT DATA FOR AI ================= */
const formatReportsForAI = (reports) => {
    if (!reports) return "No data available.";

    const { overview, sales, products, categories, customers, payments, delivery } = reports;

    let contextText = "CURRENT BUSINESS DATA:\n\n";

    // Overview
    if (overview) {
        contextText += `OVERVIEW:\n`;
        contextText += `- Total Revenue: $${overview.total_revenue}\n`;
        contextText += `- Total Orders: ${overview.total_orders}\n`;
        contextText += `- Avg Order Value: $${overview.avg_order_value}\n`;
        contextText += `- Completed Orders: ${overview.completed_orders}\n`;
        contextText += `- Cancelled Orders: ${overview.cancelled_orders}\n\n`;
    }

    // Sales (Last 5 days for brevity in context)
    if (sales && sales.length > 0) {
        contextText += `RECENT SALES TREND (Last 5 Days):\n`;
        sales.slice(0, 5).forEach(s => {
            contextText += `- ${s.date}: ${s.orders_count} orders, $${s.revenue}\n`;
        });
        contextText += "\n";
    }

    // Top Products
    if (products && products.length > 0) {
        contextText += `TOP PERFORMING PRODUCTS:\n`;
        products.slice(0, 5).forEach(p => {
            contextText += `- ${p.product_name}: Sold ${p.total_sold}, Rev $${p.revenue}\n`;
        });
        contextText += "\n";
    }

    // Categories
    if (categories && categories.length > 0) {
        contextText += `CATEGORY PERFORMANCE:\n`;
        categories.forEach(c => {
            contextText += `- ${c.category_name}: ${c.total_products} prods, Sold ${c.total_sold}\n`;
        });
        contextText += "\n";
    }

    // Customers
    if (customers && customers.length > 0) {
        contextText += `TOP CUSTOMERS:\n`;
        customers.slice(0, 3).forEach(c => {
            contextText += `- ${c.customer_name}: ${c.total_orders} orders, Spent $${c.total_spent}\n`;
        });
        contextText += "\n";
    }

    return contextText;
};

/* ================= GEMINI API CALL ================= */
const callAdminGemini = async (message, history, reportData) => {
    console.log("=== DEBUG: ADMIN AI DATA RECEIVED ===", reportData);

    // Prepare conversation history
    const conversationText = history
        .slice(-10) // Keep last 10 messages for context
        .map(m => `${m.role === "user" ? "Admin" : "AI"}: ${m.content}`)
        .join("\n");

    const dataContext = formatReportsForAI(reportData);

    // If no meaningful data, warn the AI
    const dataWarning = (dataContext === "No data available.")
        ? "WARNING: No report data could be loaded. Inform the user you cannot see the latest stats."
        : "";

    const SYSTEM_INSTRUCTION = `You are Nexora Admin AI, a Senior Business Intelligence Assistant.

ROLE:
- Analyze business data (sales, orders, inventory, customers).
- Provide strategic insights and actionable recommendations.
- Identify trends, risks, and opportunities.
- Be professional, concise, and analytical.

RULES:
- ONLY use the provided "CURRENT BUSINESS DATA". Do not hallucinate.
- If data is missing, state it clearly.
- Do not behave like a customer support bot. You are talking to the BUSINESS OWNER.
- Focus on key metrics: Revenue, Growth, Retention, Efficiency.

    CRITICAL: You must ALWAYS cite specific numbers and metrics from the "CURRENT BUSINESS DATA" to support your answers. Prove to the user that you see the real data by quoting exact figures (e.g., "$12,500 revenue" instead of "good revenue").
    
${dataWarning}
${dataContext}`;

    const prompt = `
${SYSTEM_INSTRUCTION}

Conversation History:
${conversationText}

Admin: ${message}

AI:
`;

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-lite-latest", // Use the latest stable lite alias
            systemInstruction: SYSTEM_INSTRUCTION
        });

        const generationConfig = {
            temperature: 0.4,
            topK: 1,
            topP: 1,
            maxOutputTokens: 1000,
        };

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig
        });

        const responseText = result.response.text() || "I couldn't analyze that properly. Please try again.";
        return responseText;

    } catch (error) {
        console.error('❌ Admin Gemini API error:', error);

        // Handle Quota Exceeded (429) gracefully
        if (error.message.includes('429') || error.status === 429) {
            return "⚠️ **System Busy (Quota Exceeded)**\n\nI have reached my usage limit for the moment. Please wait about a minute and try again.";
        }

        // Handle Model Not Found (404) gracefully
        if (error.message.includes('404')) {
            return "⚠️ **AI Model Error**\n\nThe configured AI model is currently unavailable. Please check system settings.";
        }

        throw new Error("Failed to get response from Admin AI.");
    }
};

/* ================= PROVIDER ================= */
export const AdminAIProvider = ({ children }) => {
    const reportsContext = useReports();

    // Use local state to store a snapshot of reports for the AI
    // We access reportsContext values directly

    const [conversation, setConversation] = useState([
        {
            id: "init",
            role: "assistant",
            content: "Hello! I am your Business Intelligence Assistant. I have analyzed your latest reports. How can I help you regarding Sales, Inventory, or Customer trends?"
        }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Keep a ref to the latest reports to avoid stale closures in async calls
    const reportsRef = useRef(reportsContext);

    useEffect(() => {
        reportsRef.current = reportsContext;
    }, [reportsContext]);

    // Keep ref to conversation
    const conversationRef = useRef(conversation);

    useEffect(() => {
        conversationRef.current = conversation;
    }, [conversation]);

    /* ===== ACTIONS ===== */

    // 1. General Chat Function
    const sendMessage = useCallback(async (message) => {
        if (!message.trim()) return;

        const userMsgId = Date.now();
        setConversation(prev => [...prev, { id: userMsgId, role: "user", content: message }]);

        // Safety check if reports are still loading
        if (reportsContext.loading) {
            setTimeout(() => {
                setConversation(prev => [...prev, {
                    id: Date.now(),
                    role: "assistant",
                    content: "⚡ I am currently syncing with the latest live data. Please wait a moment and try again so I can give you an accurate answer."
                }]);
            }, 500);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Gather current report data
            // Gather current report data from REF to ensure we have the very latest
            const currentData = reportsRef.current || {};

            const currentReports = {
                overview: currentData.overview,
                sales: currentData.sales,
                products: currentData.products,
                categories: currentData.categories,
                customers: currentData.customers,
                payments: currentData.payments,
                delivery: currentData.delivery
            };

            const aiResponse = await callAdminGemini(message, conversationRef.current, currentReports);

            setConversation(prev => [...prev, {
                id: Date.now() + 1,
                role: "assistant",
                content: aiResponse
            }]);

        } catch (err) {
            setError("Failed to get AI response. Please check your connection.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [reportsContext]);

    // 2. Pre-defined Summary Generators
    const generateSummary = useCallback(async (type) => {
        let prompt = "";
        switch (type) {
            case "sales":
                prompt = "Analyze the recent sales performance. Identify trends in revenue and order volume over the last few days. Are we growing or declining?";
                break;
            case "products":
                prompt = "Review the top performing products. Which items are driving revenue? Are there any low-performers that need attention?";
                break;
            case "risks":
                prompt = "Identify potential risks in the business based on the data. Look for cancelled orders, low stock (if visible), or delivery issues.";
                break;
            case "customers":
                prompt = "Analyze customer behavior. Who are our top clients? What is the repeat purchase rate (if available)? How can we improve retention?";
                break;
            case "health":
                prompt = "Provide a comprehensive Executive Summary of the overall business health. Combine sales, product performance, and operational metrics into a high-level report.";
                break;
            default:
                prompt = "Summarize the current business status.";
        }

        // Treat it like a user message but maybe display it differently? 
        // For now, we'll just insert it as a user command to trigger the analysis.
        await sendMessage(prompt);

    }, [sendMessage]);

    const clearChat = () => {
        setConversation([{
            id: Date.now(),
            role: "assistant",
            content: "Chat cleared. Ready for new analysis."
        }]);
    };

    const value = {
        conversation,
        loading,
        error,
        sendMessage,
        generateSummary,
        clearChat
    };

    return <AdminAIContext.Provider value={value}>{children}</AdminAIContext.Provider>;
};

export const useAdminAI = () => {
    const ctx = useContext(AdminAIContext);
    if (!ctx) throw new Error("useAdminAI must be used within AdminAIProvider");
    return ctx;
};
