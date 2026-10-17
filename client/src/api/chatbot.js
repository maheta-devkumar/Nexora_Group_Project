import api from './api';

const CHATBOT_BASE_URL = `/chatbot`;

/**
 * Fetch all chatbot data from backend
 * Returns products, variants, categories, and all related data
 */
export const fetchChatbotData = async () => {
    try {
        const response = await api.get(`${CHATBOT_BASE_URL}/complete-data`);
        return {
            success: true,
            data: response.data,
            message: response.data.message || "Chatbot data fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Chatbot Data Error:", error.response?.data || error.message);
        return {
            success: false,
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch chatbot data",
            data: null
        };
    }
};
