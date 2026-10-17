import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from "@react-oauth/google";
import api from '../../api/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../Login/Login.css';

const Signup = () => {
  const navigate = useNavigate();
  const { register, persistAuth } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleOverlay, setShowGoogleOverlay] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("🔧 SIGNUP PAGE LOADED");
    console.log("🌐 Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID ? "✓ Present" : "✗ Missing");
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username || formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 50) {
      newErrors.username = 'Username must be less than 50 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }



    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Generate first_name and last_name from username
      const username = formData.username.trim();
      const firstName = username.charAt(0).toUpperCase() + username.slice(1);

      const payload = {
        username: username,
        email: formData.email.trim(),
        password: formData.password,
        first_name: firstName,  // Generate from username
        last_name: "User",      // Default value
        phone: null             // Optional field as null
      };

      console.log('🔐 SIGNUP: Sending registration data:', payload);

      const result = await register(payload);

      if (result.success) {
        toast.success('Registration successful! Redirecting to login...', {
          position: "top-center",
          autoClose: 3000,
          onClose: () => navigate('/login')
        });
      } else {
        toast.error(result.message || 'Registration failed. Please try again.');
        console.error('🔐 SIGNUP: Registration failed:', result.message);
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error('🔐 SIGNUP: Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async (credentialResponse) => {
    try {
      setIsGoogleLoading(true);
      setShowGoogleOverlay(true);
      console.log("🔑 Google signup successful, sending token to backend...");

      const res = await api.post("/auth/google-signup", {
        token: credentialResponse.credential,
      });

      console.log("✅ Backend response:", res.data);
      const { access_token, user } = res.data;

      persistAuth(access_token, user);

      console.log("🔄 Google signup successful, redirecting...");

      toast.success('Google signup successful! Welcome!', {
        position: "top-center",
        autoClose: 2000
      });

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);

    } catch (error) {
      console.error("❌ Google signup failed:", error);
      setIsGoogleLoading(false);
      setShowGoogleOverlay(false);

      let errorMessage = "Google signup failed. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        // Check if user already exists
        if (errorMessage.toLowerCase().includes('already exists') ||
          errorMessage.toLowerCase().includes('already registered')) {
          errorMessage = "This Google account is already registered. Please try logging in instead.";
        }
      } else if (error.response?.status === 409) {
        errorMessage = "This Google account is already registered. Please log in instead.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid Google account. Please try again.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }

      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000
      });
    }
  };

  const handleGoogleError = () => {
    console.error("❌ Google Signup Failed");
    setIsGoogleLoading(false);
    setShowGoogleOverlay(false);
    toast.error("Google signup was cancelled or failed. Please try again.", {
      position: "top-center"
    });
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { strength: 33, label: 'Weak', color: '#ff6b9d' };
    if (strength <= 4) return { strength: 66, label: 'Medium', color: '#ffd93d' };
    return { strength: 100, label: 'Strong', color: '#00b894' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="auth-container">
      <ToastContainer />

      {/* Google Loading Overlay */}
      {showGoogleOverlay && (
        <div className="google-loading-overlay">
          <div className="text-center">
            <div className="google-loading-spinner"></div>
            <div className="google-loading-text">Creating account with Google...</div>
          </div>
        </div>
      )}

      <div className="auth-wrapper fade-in">


        {/* Left Hero Section */}
        {/* Left Hero Section */}
        <div className="auth-hero-new">
          <div className="logo-container-new">
            <i className="fas fa-shopping-bag logo-icon-new"></i>
            <h1 className="logo-text-new">Nexora</h1>
          </div>
          <div className="hero-content-new">
            <h2 className="hero-title-new">Join Nexora!</h2>
            <p className="hero-subtitle-new">
              Create your account to unlock exclusive deals, personalized recommendations, and faster checkout.
            </p>
            <div className="hero-features-new">
              <div className="feature-item-new">
                <i className="fas fa-rocket"></i>
                <span>Fast & Easy Setup</span>
              </div>
              <div className="feature-item-new">
                <i className="fas fa-tags"></i>
                <span>Exclusive Offers</span>
              </div>
              <div className="feature-item-new">
                <i className="fas fa-heart"></i>
                <span>Wishlist & Favorites</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="auth-form-section">
          <div className="form-card">

            <div className="form-header">
              <h2 className="form-title">Create Account</h2>
            </div>

            {/* Google Signup Button - At the top for better UX */}
            <div className="google-login-container">
              {isGoogleLoading && <div className="google-loading"></div>}
              <GoogleLogin
                onSuccess={handleGoogleSignup}
                onError={handleGoogleError}
                theme="filled_blue"
                size="large"
                shape="rectangular"
                text="signup_with" // Changed from continue_with to signup_with
                useOneTap={false}
                width="400"
              />
            </div>


            <div className="divider">
              <span>OR SIGN UP WITH EMAIL</span>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">

              {/* Username Field */}
              <div className="input-group">
                <label htmlFor="username">Username *</label>
                <div className="input-wrapper">
                  <i className="fas fa-user input-icon"></i>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="johndoe"
                    className={errors.username ? 'error' : ''}
                    disabled={loading || isGoogleLoading}
                    maxLength={50}
                  />
                </div>
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>

              {/* Email Address Field */}
              <div className="input-group">
                <label htmlFor="email">Email Address *</label>
                <div className="input-wrapper">
                  <i className="fas fa-envelope input-icon"></i>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="johndoe@example.com"
                    className={errors.email ? 'error' : ''}
                    disabled={loading || isGoogleLoading}
                  />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              {/* Password Field */}
              <div className="input-group">
                <label htmlFor="password">Password *</label>
                <div className="input-wrapper">
                  <i className="fas fa-lock input-icon"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    className={errors.password ? 'error' : ''}
                    disabled={loading || isGoogleLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePasswordVisibility}
                    disabled={loading || isGoogleLoading}
                  >
                    <i className={showPassword ? 'fas fa-eye' : 'fas fa-eye-slash'}></i>
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className="strength-fill"
                        style={{
                          width: `${passwordStrength.strength}%`,
                          backgroundColor: passwordStrength.color
                        }}
                      ></div>
                    </div>
                    <span
                      className="strength-label"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
                {errors.password && <span className="error-message">{errors.password}</span>}
                <div className="password-requirements">
                  <small>Password must contain at least 8 characters with uppercase, lowercase, and number</small>
                </div>
              </div>



              <div className="terms-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (errors.terms) {
                        setErrors(prev => ({ ...prev, terms: '' }));
                      }
                    }}
                    disabled={loading || isGoogleLoading}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span>
                    I agree to the <a href="/terms" style={{ color: '#667eea', textDecoration: 'none' }}>Terms & Conditions</a> and <a href="/privacy" style={{ color: '#667eea', textDecoration: 'none' }}>Privacy Policy</a>
                  </span>
                </label>
                {errors.terms && <span className="error-message" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.terms}</span>}
              </div>

              <button
                type="submit"
                className="btn-submit-new"
                disabled={loading || isGoogleLoading}
              >
                {loading ? (
                  <>
                    <span>Creating Account...</span>
                    <i className="fas fa-spinner fa-spin"></i>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <i className="fas fa-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account? <Link to="/login" className="auth-link">Log In</Link>
            </p>

            {/* Terms & Privacy */}
            <div className="legal-links">
              By continuing, you agree to our{" "}
              <Link to="/terms">Terms</Link>{" "}
              and{" "}
              <Link to="/privacy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Signup;