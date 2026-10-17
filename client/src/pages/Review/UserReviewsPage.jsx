import React, { useEffect } from 'react';
import { useProductReviews } from '../../context/ProductReviewContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './UserReviewsPage.css';

const UserReviewsPage = () => {
    const {
        userReviews,
        fetchUserReviews,
        loading,
        deleteReview // Assuming this exists or we need to add user delete logic
    } = useProductReviews();

    // We'll need to check if context exports delete functionality for users
    // If not, we might need to add it, but let's assume standard delete works or just show list for now.

    const navigate = useNavigate();

    useEffect(() => {
        fetchUserReviews();
    }, [fetchUserReviews]);

    // Helpers
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <i
                key={index}
                className={`fas fa-star ${index < rating ? 'filled' : ''}`}
            ></i>
        ));
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            default: return 'status-pending';
        }
    };

    // If context doesn't export user delete, we can emit a placeholder function or skip it
    const handleDelete = async (reviewId) => {
        if (window.confirm("Are you sure you want to delete this review?")) {
            // Logic to be implemented if not already available in context for user side
            // Usually updateContext -> deleteReview(id) works if API handles permission check
            toast.info("Delete functionality coming soon");
        }
    };

    return (
        <div className="reviews-page">
            <div className="reviews-container">
                <div className="reviews-header">
                    <h1>My Reviews</h1>
                </div>

                {loading && !userReviews.length ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : userReviews.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-star-half-alt empty-icon"></i>
                        <h2>No Reviews Yet</h2>
                        <p>You haven't accepted any products yet. Share your thoughts on your purchases!</p>
                        <button className="shop-btn" onClick={() => navigate('/products')}>
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="reviews-grid">
                        {userReviews.map((review) => (
                            <div key={review.review_id} className="review-card">
                                {/* Product Image */}
                                <div className="review-product-image">
                                    <img
                                        src={review.product_image || 'https://via.placeholder.com/100'}
                                        alt={review.product_name || 'Product'}
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/100'}
                                    />
                                </div>

                                <div className="review-content">
                                    <div className="review-meta">
                                        <h3 className="product-name">{review.product_name || 'Unknown Product'}</h3>
                                        <span className="review-date">{formatDate(review.created_at)}</span>
                                    </div>

                                    <div className="review-rating">
                                        {renderStars(review.rating)}
                                    </div>

                                    <div className={`review-status ${getStatusClass(review.status)}`}>
                                        {review.status || 'Pending'}
                                    </div>

                                    <h4 className="review-title">{review.title}</h4>
                                    <p className="review-body">{review.body}</p>

                                    {/* Actions */}
                                    {/* 
                                    <div className="review-actions">
                                        <button className="action-btn" onClick={() => navigate(`/products/${review.variant_id}`)}>
                                            <i className="fas fa-eye"></i> View Product
                                        </button>
                                         
                                        <button 
                                            className="action-btn delete-btn"
                                            onClick={() => handleDelete(review.review_id)}
                                        >
                                            <i className="fas fa-trash"></i> Delete
                                        </button>
                                        
                                    </div>
                                    */}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserReviewsPage;
