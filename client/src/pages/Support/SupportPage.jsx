import React, { useState } from 'react';
import { toastInfo } from '../../utils/customToast';
import './SupportPage.css';

const SupportPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setActiveCategory('all'); // Reset category on search
    };

    const handleContact = (type) => {
        switch (type) {
            case 'chat':
                toastInfo("Live Chat agent connecting...");
                break;
            case 'email':
                window.location.href = "mailto:support@nexora.com";
                break;
            case 'phone':
                window.location.href = "tel:+1234567890";
                break;
            default:
                break;
        }
    };

    const faqData = [
        {
            category: 'orders',
            question: "Where is my order?",
            answer: "You can check the status of your order in the 'My Orders' section of your account. Once shipped, you'll receive a tracking number via email."
        },
        {
            category: 'returns',
            question: "What is your return policy?",
            answer: "We offer a 30-day return policy for all unused items in their original packaging. Refunds are processed within 5-7 business days after we receive the return."
        },
        {
            category: 'payments',
            question: "What payment methods do you accept?",
            answer: "We accept Visa, MasterCard, American Express, PayPal, and Apple Pay. All transactions are secure and encrypted."
        },
        {
            category: 'account',
            question: "How do I reset my password?",
            answer: "Go to the Login page and click 'Forgot Password'. Follow the instructions sent to your email to reset it."
        },
        {
            category: 'orders',
            question: "Can I change my shipping address?",
            answer: "You can change your shipping address if your order hasn't been processed yet. Go to 'My Orders' and select the order to see if it's editable."
        },
        {
            category: 'products',
            question: "Are your products authentic?",
            answer: "Yes, we guarantee 100% authenticity for all products sold on Nexora. We source directly from authorized distributors."
        }
    ];

    const filteredFaqs = faqData.filter(faq => {
        const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="support-page">
            {/* Hero Section */}
            <div className="support-hero">
                <h1>How can we help you?</h1>
                <p>Search for answers or contact our team directly</p>
                <div className="support-search-wrapper">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Type your question here..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            <div className="support-container">
                {/* Contact Cards */}
                <div className="contact-cards-grid">
                    <div className="contact-card" onClick={() => handleContact('chat')}>
                        <div className="contact-icon">
                            <i className="fas fa-comments"></i>
                        </div>
                        <h3>Live Chat</h3>
                        <p>Chat with our support team in real-time.</p>
                        <span className="contact-action">Start Chat <i className="fas fa-arrow-right"></i></span>
                    </div>

                    <div className="contact-card" onClick={() => handleContact('email')}>
                        <div className="contact-icon">
                            <i className="fas fa-envelope"></i>
                        </div>
                        <h3>Email Support</h3>
                        <p>Get a response within 24 hours.</p>
                        <span className="contact-action">Send Email <i className="fas fa-arrow-right"></i></span>
                    </div>

                    <div className="contact-card" onClick={() => handleContact('phone')}>
                        <div className="contact-icon">
                            <i className="fas fa-phone-alt"></i>
                        </div>
                        <h3>Phone Support</h3>
                        <p>Call us directly for urgent issues.</p>
                        <span className="contact-action">Call Now <i className="fas fa-arrow-right"></i></span>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="faq-section">
                    <div className="faq-header">
                        <h2>Frequently Asked Questions</h2>
                        <div className="faq-categories">
                            {['all', 'orders', 'returns', 'payments', 'account'].map(cat => (
                                <button
                                    key={cat}
                                    className={`faq-category-btn ${activeCategory === cat ? 'active' : ''}`}
                                    onClick={() => setActiveCategory(cat)}
                                >
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="faq-list">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, index) => (
                                <div key={index} className={`faq-item ${openFaq === index ? 'open' : ''}`}>
                                    <div className="faq-question" onClick={() => toggleFaq(index)}>
                                        {faq.question}
                                        <i className="fas fa-chevron-down"></i>
                                    </div>
                                    <div className="faq-answer">
                                        {faq.answer}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                                No results found for "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportPage;
