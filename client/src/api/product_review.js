import api from "./api";

const REVIEWS_BASE_URL = "/reviews";

/* =========================================
   USER FUNCTIONS (WORK WITH YOUR BACKEND)
========================================= */

// Fetch reviews for a variant (paginated)
export const fetchVariantReviews = async (variantId, page = 1, perPage = 10) => {
    try {
        const response = await api.get(`${REVIEWS_BASE_URL}/${variantId}`, {
            params: { page, per_page: perPage },
        });

        return {
            success: true,
            data: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch reviews",
            data: {
                items: [],
                total: 0,
                page,
                per_page: perPage,
                total_pages: 0,
            },
        };
    }
};


// Fetch user's own reviews
export const fetchUserReviews = async (page = 1, perPage = 10) => {
    try {
        const response = await api.get(`${REVIEWS_BASE_URL}/my-reviews`, {
            params: { page, per_page: perPage },
        });

        return {
            success: true,
            data: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to fetch user reviews",
            data: {
                items: [],
                total: 0,
                page,
                per_page: perPage,
                total_pages: 0,
            },
        };
    }
};

// Create review

// Create review
export const createReview = async (reviewData) => {
    try {
        const response = await api.post(`${REVIEWS_BASE_URL}/`, reviewData);
        return {
            success: true,
            data: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to create review",
            data: null,
        };
    }
};

// Update review
export const updateReview = async (reviewId, updateData) => {
    try {
        const response = await api.put(`${REVIEWS_BASE_URL}/${reviewId}`, updateData);
        return {
            success: true,
            data: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to update review",
            data: null,
        };
    }
};

// Delete review
export const deleteReview = async (reviewId) => {
    try {
        const response = await api.delete(`${REVIEWS_BASE_URL}/${reviewId}`);
        return {
            success: true,
            data: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            message: error.response?.data?.detail || "Failed to delete review",
            data: null,
        };
    }
};

/* =========================================
   ADMIN FUNCTIONS (REAL BACKEND)
========================================= */

// Admin: fetch all reviews
export const fetchAllReviews = async (page = 1, perPage = 20) => {
    try {
        const response = await api.get(`${REVIEWS_BASE_URL}/admin/all`, {
            params: { page, per_page: perPage },
        });

        return {
            success: true,
            data: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            message:
                error.response?.data?.detail ||
                "Failed to fetch all reviews",
            data: {
                items: [],
                total: 0,
                page: 1,
                per_page: perPage,
                total_pages: 0,
            },
        };
    }
};

// Admin: update review status
// Admin: update review status - FIXED VERSION
export const updateReviewStatus = async (reviewId, status) => {
    try {
        const response = await api.put(
            `${REVIEWS_BASE_URL}/admin/${reviewId}/status`,
            null,  // No request body
            {
                params: { status }  // Send as query parameter
            }
        );

        return {
            success: true,
            data: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            message:
                error.response?.data?.detail ||
                "Failed to update review status",
            data: null,
        };
    }
};
// Admin: add a reply to a review
export const addAdminReply = async (reviewId, replyData) => {
    try {
        const response = await api.post(
            `${REVIEWS_BASE_URL}/admin/${reviewId}/reply`,
            replyData
        );

        return {
            success: true,
            data: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            message:
                error.response?.data?.detail || "Failed to add reply",
            data: null,
        };
    }
};

// Admin: delete reply
export const deleteReply = async (replyId) => {
    try {
        const response = await api.delete(
            `${REVIEWS_BASE_URL}/admin/reply/${replyId}`
        );

        return {
            success: true,
            data: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            message:
                error.response?.data?.detail || "Failed to delete reply",
            data: null,
        };
    }
};

// Admin: delete review
export const adminDeleteReview = async (reviewId) => {
    try {
        const response = await api.delete(
            `${REVIEWS_BASE_URL}/admin/${reviewId}`
        );

        return {
            success: true,
            data: response.data.data,
            message: response.data.message,
        };
    } catch (error) {
        return {
            success: false,
            message:
                error.response?.data?.detail ||
                "Failed to delete review by admin",
            data: null,
        };
    }
};
