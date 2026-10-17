import React, { useEffect, useState } from 'react';
import { useProductReviews } from '../../../../context/ProductReviewContext';
import './ReviewManager.css';

const ReviewManager = ({ variantId }) => {
    const {
        reviews,
        loading,
        error,
        fetchAllReviews,
        updateReviewStatus,
        addAdminReply,
        deleteReply,
        adminDeleteReview,
        selectReview,
        selectedReview,
        clearSelectedReview,
        clearError,
        pagination
    } = useProductReviews();

    const [currentPage, setCurrentPage] = useState(1);
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);

    useEffect(() => {
        fetchAllReviews(currentPage, 20);
    }, [currentPage, fetchAllReviews]);

    const handleStatusChange = async (reviewId, newStatus) => {
        await updateReviewStatus(reviewId, newStatus);
    };

    const handleDeleteReview = async (reviewId) => {
        if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
            await adminDeleteReview(reviewId);
        }
    };

    const handleReply = async (reviewId) => {
        console.log("Reply text:", replyText);
        console.log("Is text trimmed?", replyText.trim());

        if (!replyText.trim()) {
            console.log("Empty reply text!");
            alert("Reply text is required");
            return;
        }

        const requestData = {
            body: replyText.trim()
        };

        console.log("Sending to API:", requestData);

        try {
            await addAdminReply(reviewId, requestData);
            setReplyText('');
            setReplyingTo(null);
        } catch (error) {
            console.error("Failed to add reply:", error);
            alert(`Error: ${error.message}`);
        }
    };

    const handleDeleteReply = async (replyId, reviewId) => {
        if (window.confirm('Are you sure you want to delete this reply?')) {
            await deleteReply(replyId, reviewId);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'admin-rm-status-approved';
            case 'pending': return 'admin-rm-status-pending';
            case 'rejected': return 'admin-rm-status-rejected';
            default: return '';
        }
    };

    // Helper function to safely get error message
    const getErrorMessage = (errorObj) => {
        if (!errorObj) return '';

        if (typeof errorObj === 'string') {
            return errorObj;
        } else if (typeof errorObj === 'object') {
            // Handle FastAPI error format
            if (errorObj.detail) {
                if (Array.isArray(errorObj.detail)) {
                    return errorObj.detail.map(detail =>
                        `${detail.loc ? detail.loc.join('.') : 'Field'}: ${detail.msg}`
                    ).join('; ');
                } else {
                    return errorObj.detail;
                }
            } else if (errorObj.message) {
                return errorObj.message;
            } else if (errorObj.msg) {
                return errorObj.msg;
            } else {
                // Stringify only if it's a plain object, not React components
                try {
                    return JSON.stringify(errorObj);
                } catch {
                    return 'An error occurred';
                }
            }
        } else {
            return String(errorObj);
        }
    };

    // Safe rendering of text content
    const renderText = (text) => {
        if (text === null || text === undefined) return '';
        if (typeof text === 'object') {
            try {
                return JSON.stringify(text);
            } catch {
                return String(text);
            }
        }
        return String(text);
    };

    // Safe rendering of review text
    const renderReviewText = (review) => {
        if (!review || typeof review !== 'object') return '';

        const text = review.review_text || '';
        return renderText(text);
    };

    // Safe rendering of reply text
    const renderReplyText = (reply) => {
        if (!reply || typeof reply !== 'object') return '';

        const text = reply.reply_text || '';
        return renderText(text);
    };

    // Safe rendering of reviewer name
    const renderReviewerName = (review) => {
        if (!review || typeof review !== 'object') return 'Anonymous';

        const customer = review.customer;
        if (!customer || typeof customer !== 'object') return 'Anonymous';

        const name = customer.customer_name;
        if (name === null || name === undefined) return 'Anonymous';

        return renderText(name);
    };

    // Safe rendering of status
    const renderStatus = (review) => {
        if (!review || typeof review !== 'object') return 'pending';

        const status = review.status;
        if (status === null || status === undefined) return 'pending';

        return String(status).toLowerCase();
    };

    // Safe rendering of rating
    const renderRating = (review) => {
        if (!review || typeof review !== 'object') return 0;

        const rating = review.rating;
        if (typeof rating !== 'number' || isNaN(rating) || rating < 0 || rating > 5) {
            return 0;
        }

        return Math.max(0, Math.min(5, Math.round(rating)));
    };

    if (error) {
        const errorMessage = getErrorMessage(error);
        return (
            <div className="admin-rm-error">
                <div className="admin-error-content">
                    <strong>Error:</strong> {errorMessage}
                </div>
                <button
                    className="admin-rm-dismiss-btn"
                    onClick={clearError}
                >
                    Dismiss
                </button>
            </div>
        );
    }

    return (
        <div className="admin-review-manager">
            <div className="admin-rm-header">
                <h3 className="admin-rm-title">Product Reviews</h3>
                <div className="admin-rm-stats">
                    <span className="admin-stat-item">Total: {pagination?.total || 0}</span>
                    <span className="admin-stat-item">
                        Page: {currentPage} of {pagination?.total_pages || 1}
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="admin-rm-loading">Loading reviews...</div>
            ) : !reviews || reviews.length === 0 ? (
                <div className="admin-rm-empty">No reviews found.</div>
            ) : (
                <>
                    <div className="admin-rm-list">
                        {(reviews || []).map(review => {
                            const reviewId = review?.review_id;
                            const status = renderStatus(review);
                            const rating = renderRating(review);

                            if (!reviewId) return null; // Skip invalid reviews

                            return (
                                <div key={reviewId} className="admin-rm-item">
                                    <div className="admin-rm-item-header">
                                        <div className="admin-rm-reviewer-info">
                                            <span className="admin-rm-reviewer-name">
                                                {renderReviewerName(review)}
                                            </span>
                                            <span className="admin-rm-date">
                                                {formatDate(review.created_at)}
                                            </span>
                                        </div>
                                        <div className="admin-rm-rating">
                                            {'★'.repeat(rating)}
                                            {'☆'.repeat(5 - rating)}
                                        </div>
                                    </div>

                                    <div className="admin-rm-content">
                                        <p className="admin-rm-text">
                                            {renderReviewText(review)}
                                        </p>
                                    </div>

                                    <div className="admin-rm-footer">
                                        <div className="admin-rm-status">
                                            <span className={`admin-rm-status-badge ${getStatusColor(status)}`}>
                                                {status}
                                            </span>
                                        </div>
                                        <div className="admin-rm-actions">
                                            <select
                                                className="admin-rm-select"
                                                value={status}
                                                onChange={(e) => handleStatusChange(reviewId, e.target.value)}
                                                disabled={loading}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="approved">Approve</option>
                                                <option value="rejected">Reject</option>
                                            </select>

                                            <button
                                                className="admin-rm-btn admin-rm-btn-reply"
                                                onClick={() => setReplyingTo(replyingTo === reviewId ? null : reviewId)}
                                            >
                                                {replyingTo === reviewId ? 'Cancel Reply' : 'Reply'}
                                            </button>

                                            <button
                                                className="admin-rm-btn admin-rm-btn-delete"
                                                onClick={() => handleDeleteReview(reviewId)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {review.replies && Array.isArray(review.replies) && review.replies.length > 0 && (
                                        <div className="admin-rm-replies">
                                            <h4 className="admin-rm-replies-title">
                                                Replies ({review.replies.length})
                                            </h4>
                                            {review.replies.map(reply => {
                                                const replyId = reply?.reply_id;
                                                if (!replyId) return null;

                                                return (
                                                    <div key={replyId} className="admin-rm-reply-item">
                                                        <div className="admin-rm-reply-header">
                                                            <span className="admin-rm-reply-author">Admin</span>
                                                            <span className="admin-rm-reply-date">
                                                                {formatDate(reply.created_at)}
                                                            </span>
                                                            <button
                                                                className="admin-rm-btn-delete-reply"
                                                                onClick={() => handleDeleteReply(replyId, reviewId)}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                        <p className="admin-rm-reply-text">
                                                            {renderReplyText(reply)}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {replyingTo === reviewId && (
                                        <div className="admin-rm-reply-form">
                                            <textarea
                                                className="admin-rm-reply-textarea"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Type your reply here..."
                                                rows={3}
                                            />
                                            <div className="admin-rm-reply-actions">
                                                <button
                                                    className="admin-rm-btn-cancel"
                                                    onClick={() => {
                                                        setReplyingTo(null);
                                                        setReplyText('');
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="admin-rm-btn-submit"
                                                    onClick={() => handleReply(reviewId)}
                                                    disabled={!replyText.trim() || loading}
                                                >
                                                    {loading ? 'Posting...' : 'Post Reply'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {pagination?.total_pages > 1 && (
                        <div className="admin-rm-pagination">
                            <button
                                className="admin-vl-pagination-btn"
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                Previous
                            </button>

                            <span className="admin-vl-pagination-info">
                                Page {currentPage} of {pagination.total_pages}
                            </span>

                            <button
                                className="admin-vl-pagination-btn"
                                disabled={currentPage === pagination.total_pages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ReviewManager;