import React from 'react';
import './OrderFeedback.css';

const OrderFeedbackCard = ({ feedback }) => {
    if (!feedback) {
        return (
            <div className="order-feedback-card no-feedback">
                <h3>No Feedback Available</h3>
                <p>No feedback has been provided for this order.</p>
            </div>
        );
    }

    const renderStars = (rating) => {
        return (
            <div className="stars-container">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`star-icon ${star <= rating ? '' : 'empty'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    return (
        <div className="order-feedback-card">
            <div className="feedback-header">
                <div className="feedback-title">
                    <h3>Customer Feedback</h3>
                    <p className="feedback-date">
                        Submitted on {new Date(feedback.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="rating-display">
                    <div>{renderStars(feedback.rating)}</div>
                    <span className="rating-value">{feedback.rating}/5</span>
                </div>
            </div>
            
            <div className="feedback-comment">
                <p>{feedback.comment}</p>
            </div>
            
            {feedback.suggestions && (
                <div className="suggestions-box">
                    <p className="suggestions-title">Suggestions:</p>
                    <p className="suggestions-text">{feedback.suggestions}</p>
                </div>
            )}
            
            <div className="feedback-details">
                <div className="detail-item">
                    <span className="detail-label">Order Experience:</span>
                    <span className="detail-value">{feedback.order_experience || 'N/A'}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Delivery Experience:</span>
                    <span className="detail-value">{feedback.delivery_experience || 'N/A'}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Product Quality:</span>
                    <span className="detail-value">{feedback.product_quality || 'N/A'}</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Would Recommend:</span>
                    <span className="detail-value">
                        {feedback.would_recommend ? 'Yes' : 'No'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default OrderFeedbackCard;