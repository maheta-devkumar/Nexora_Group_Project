import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOfferContext } from '../../context/OfferContext';
import { useCartContext } from '../../context/CartContext';
import OfferCard from '../../components/Offer/OfferCard';
import OfferBadge from '../../components/Offer/OfferBadge';
import './OfferDetailsPage.css';

const OfferDetailsPage = () => {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { fetchOfferById, selectedOffer, loading, error, getOffersForVariant } = useOfferContext();
  const { cart, addItemToCart } = useCartContext();
  
  const [products, setProducts] = useState([]);
  const [relatedOffers, setRelatedOffers] = useState([]);
  const [addingToCart, setAddingToCart] = useState({});

  useEffect(() => {
    if (offerId) {
      fetchOfferById(parseInt(offerId));
    }
  }, [offerId, fetchOfferById]);

  useEffect(() => {
    if (selectedOffer) {
      // Simulate fetching products for this offer
      // In a real app, you would fetch products based on variant IDs
      const mockProducts = selectedOffer.variants?.slice(0, 5).map(variantId => ({
        id: variantId,
        name: `Product for Variant ${variantId}`,
        price: Math.floor(Math.random() * 100) + 20,
        image: `https://via.placeholder.com/300x200?text=Product+${variantId}`,
        inStock: Math.random() > 0.3
      })) || [];
      
      setProducts(mockProducts);
      
      // Get related offers
      const allRelatedOffers = [];
      selectedOffer.variants?.forEach(variantId => {
        const offers = getOffersForVariant(variantId).filter(
          offer => offer.offer_id !== selectedOffer.offer_id
        );
        allRelatedOffers.push(...offers);
      });
      
      // Remove duplicates
      const uniqueOffers = Array.from(
        new Map(allRelatedOffers.map(offer => [offer.offer_id, offer])).values()
      ).slice(0, 3);
      
      setRelatedOffers(uniqueOffers);
    }
  }, [selectedOffer, getOffersForVariant]);

  const handleAddToCart = async (variantId) => {
    setAddingToCart(prev => ({ ...prev, [variantId]: true }));
    const result = await addItemToCart(variantId, 1);
    setAddingToCart(prev => ({ ...prev, [variantId]: false }));
    
    if (result.success) {
      // Show success message
      alert('Added to cart!');
    }
  };

  const handleShopAll = () => {
    navigate('/products', { 
      state: { 
        offerFilter: selectedOffer?.variants || [],
        offerTitle: selectedOffer?.title 
      }
    });
  };

  if (loading) {
    return (
      <div className="offer-details-loading">
        <div className="loading-spinner-large"></div>
        <p>Loading offer details...</p>
      </div>
    );
  }

  if (error || !selectedOffer) {
    return (
      <div className="offer-details-error">
        <div className="error-content">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Offer Not Found</h2>
          <p>{error || 'The offer you are looking for does not exist.'}</p>
          <Link to="/offers" className="btn-back">
            <i className="fas fa-arrow-left"></i> Back to Offers
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const startDate = new Date(selectedOffer.start_date);
  const endDate = new Date(selectedOffer.end_date);
  const isActive = selectedOffer.is_active && now >= startDate && now <= endDate;
  const isUpcoming = now < startDate;
  const isExpired = now > endDate;

  const timeRemaining = isActive ? endDate - now : 0;
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <div className="offer-details-page">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <i className="fas fa-chevron-right"></i>
          <Link to="/offers">Offers</Link>
          <i className="fas fa-chevron-right"></i>
          <span>{selectedOffer.title}</span>
        </div>

        <div className="offer-header-section">
          <div className="offer-main-info">
            <div className="offer-badge-large">
              <OfferBadge variantId={selectedOffer.variants?.[0] || 0} size="large" />
            </div>
            
            <h1 className="offer-title">{selectedOffer.title}</h1>
            
            {selectedOffer.description && (
              <p className="offer-description">{selectedOffer.description}</p>
            )}
            
            <div className="offer-meta">
              <div className="meta-item">
                <i className="fas fa-calendar"></i>
                <div className="meta-content">
                  <span className="meta-label">Valid From</span>
                  <span className="meta-value">{startDate.toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="meta-item">
                <i className="fas fa-calendar-check"></i>
                <div className="meta-content">
                  <span className="meta-label">Valid Until</span>
                  <span className="meta-value">{endDate.toLocaleDateString()}</span>
                </div>
              </div>
              
              {isActive && (
                <div className="meta-item">
                  <i className="fas fa-clock"></i>
                  <div className="meta-content">
                    <span className="meta-label">Time Left</span>
                    <span className="meta-value time-remaining">
                      {daysRemaining > 0 
                        ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}` 
                        : `${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {selectedOffer.variants && selectedOffer.variants.length > 0 && (
              <div className="offer-actions">
                <button className="btn-shop-all" onClick={handleShopAll}>
                  <i className="fas fa-shopping-cart"></i> Shop All Eligible Products
                </button>
                <span className="products-count">
                  {selectedOffer.variants.length} product{selectedOffer.variants.length !== 1 ? 's' : ''} available
                </span>
              </div>
            )}
          </div>
          
          <div className="offer-card-preview">
            <OfferCard offer={selectedOffer} showActions={false} />
          </div>
        </div>

        {products.length > 0 && (
          <div className="products-section">
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">Products included in this offer</p>
            
            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    <img src={product.image} alt={product.name} />
                    <div className="product-badge">
                      <OfferBadge variantId={product.id} />
                    </div>
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-price">${product.price}</div>
                    
                    <div className="product-actions">
                      <button 
                        className={`btn-add-to-cart ${!product.inStock ? 'out-of-stock' : ''}`}
                        onClick={() => handleAddToCart(product.id)}
                        disabled={!product.inStock || addingToCart[product.id]}
                      >
                        {addingToCart[product.id] ? (
                          <>
                            <span className="loading-spinner-small"></span> Adding...
                          </>
                        ) : !product.inStock ? (
                          'Out of Stock'
                        ) : (
                          <>
                            <i className="fas fa-cart-plus"></i> Add to Cart
                          </>
                        )}
                      </button>
                      <Link to={`/products/${product.id}`} className="btn-view-details">
                        <i className="fas fa-eye"></i> Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedOffer.variants && selectedOffer.variants.length > products.length && (
              <div className="view-all-products">
                <button className="btn-view-all" onClick={handleShopAll}>
                  View All {selectedOffer.variants.length} Products
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            )}
          </div>
        )}

        {relatedOffers.length > 0 && (
          <div className="related-offers-section">
            <h2 className="section-title">Related Offers</h2>
            <p className="section-subtitle">You might also like these offers</p>
            
            <div className="related-offers-grid">
              {relatedOffers.map(offer => (
                <div key={offer.offer_id} className="related-offer-card">
                  <OfferCard offer={offer} compact={true} />
                  <Link 
                    to={`/offers/${offer.offer_id}`}
                    className="btn-view-offer"
                  >
                    View Details <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isActive && (
          <div className="offer-status-message">
            <div className={`status-alert ${isUpcoming ? 'upcoming' : 'expired'}`}>
              <i className={`fas fa-${isUpcoming ? 'clock' : 'calendar-times'}`}></i>
              <div className="alert-content">
                <h3>Offer {isUpcoming ? 'Starts Soon' : 'Has Expired'}</h3>
                <p>
                  {isUpcoming 
                    ? `This offer will be active starting ${startDate.toLocaleDateString()}`
                    : `This offer expired on ${endDate.toLocaleDateString()}`
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfferDetailsPage;