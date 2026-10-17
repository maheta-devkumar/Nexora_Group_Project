import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toastSuccess, toastError, toastInfo } from '../../utils/customToast';
import './GuestCheckout.css';

const GuestCheckout = () => {
    const [email, setEmail] = useState('');
    const [createAccount, setCreateAccount] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const navigate = useNavigate();

    const handleGuestCheckout = () => {
        if (!email) {
            toastError('Please enter your email address');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            toastError('Please enter a valid email address');
            return;
        }

        if (createAccount) {
            if (!password) {
                toastError('Please enter a password');
                return;
            }

            if (password.length < 6) {
                toastError('Password must be at least 6 characters long');
                return;
            }

            if (password !== confirmPassword) {
                toastError('Passwords do not match');
                return;
            }

            if (!acceptTerms) {
                toastError('Please accept the terms and conditions');
                return;
            }
        }

        toastSuccess(createAccount ? 'Account created successfully!' : 'Continuing as guest');
        navigate('/checkout');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <div className="guest-checkout-page">
            <div className="guest-checkout-container">
                <div className="guest-checkout-header">
                    <h1>Checkout Options</h1>
                    <p>Choose how you'd like to checkout</p>
                </div>

                <div className="checkout-options">
                    <div className="option-card guest-option">
                        <div className="option-header">
                            <div className="option-icon">
                                <i className="fas fa-user-clock"></i>
                            </div>
                            <h3>Guest Checkout</h3>
                            <span className="option-badge">Quick & Easy</span>
                        </div>
                        <div className="option-content">
                            <p>Checkout without creating an account. You can still track your order and save your information for next time.</p>
                            <ul className="option-features">
                                <li><i className="fas fa-check"></i> Fast checkout process</li>
                                <li><i className="fas fa-check"></i> Order tracking available</li>
                                <li><i className="fas fa-check"></i> Save details for next time</li>
                            </ul>
                        </div>
                    </div>

                    <div className="option-card account-option">
                        <div className="option-header">
                            <div className="option-icon">
                                <i className="fas fa-user-plus"></i>
                            </div>
                            <h3>Create Account</h3>
                            <span className="option-badge">Recommended</span>
                        </div>
                        <div className="option-content">
                            <p>Create an account to enjoy faster checkout, order history, wishlist, and exclusive offers.</p>
                            <ul className="option-features">
                                <li><i className="fas fa-check"></i> Faster future checkouts</li>
                                <li><i className="fas fa-check"></i> Order history & tracking</li>
                                <li><i className="fas fa-check"></i> Wishlist & saved items</li>
                                <li><i className="fas fa-check"></i> Exclusive member offers</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="guest-checkout-form">
                    <div className="form-section">
                        <h3>Enter Your Email</h3>
                        <div className="form-group">
                            <label htmlFor="email">Email Address *</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                            />
                        </div>
                    </div>

                    <div className="account-option-toggle">
                        <label className="toggle-label">
                            <input
                                type="checkbox"
                                checked={createAccount}
                                onChange={(e) => setCreateAccount(e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                            <span className="toggle-text">Create an account for faster checkout next time</span>
                        </label>
                    </div>

                    {createAccount && (
                        <div className="account-creation-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="password">Password *</label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Create a password"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password *</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your password"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="terms-agreement">
                                <label className="terms-label">
                                    <input
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                    />
                                    <span className="checkmark"></span>
                                    I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="guest-checkout-actions">
                        <button className="btn-login" onClick={handleLogin}>
                            <i className="fas fa-sign-in-alt"></i>
                            Already have an account? Login
                        </button>
                        <button className="btn-continue" onClick={handleGuestCheckout}>
                            Continue to Checkout
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>

                <div className="security-assurance">
                    <div className="security-badges">
                        <div className="security-badge">
                            <i className="fas fa-lock"></i>
                            <span>256-bit SSL Encryption</span>
                        </div>
                        <div className="security-badge">
                            <i className="fas fa-shield-alt"></i>
                            <span>PCI DSS Compliant</span>
                        </div>
                        <div className="security-badge">
                            <i className="fas fa-user-shield"></i>
                            <span>Your Data is Protected</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuestCheckout;