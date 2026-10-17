// src/pages/ForgotPassword/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { passwordResetAPI } from '../../api/passwordReset';
import '../Login/Login.css';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendEnabled, setResendEnabled] = useState(true);

  const validateEmail = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setLoading(true);

    try {
      const result = await passwordResetAPI.requestPasswordReset(email);

      if (result.success) {
        toast.success(result.message, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });

        setOtpSent(true);

        // Start 60-second countdown for resend
        let remaining = 60;
        setCountdown(remaining);
        setResendEnabled(false);

        const timer = setInterval(() => {
          remaining -= 1;
          setCountdown(remaining);

          if (remaining <= 0) {
            clearInterval(timer);
            setResendEnabled(true);
          }
        }, 1000);

      } else {
        toast.error(result.message, {
          position: "top-center",
          autoClose: 5000
        });
      }
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.', {
        position: "top-center"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!resendEnabled || countdown > 0) {
      return;
    }

    setLoading(true);

    try {
      const result = await passwordResetAPI.requestPasswordReset(email);

      if (result.success) {
        toast.success('New OTP sent successfully!', {
          position: "top-center"
        });

        // Restart countdown
        let remaining = 60;
        setCountdown(remaining);
        setResendEnabled(false);

        const timer = setInterval(() => {
          remaining -= 1;
          setCountdown(remaining);

          if (remaining <= 0) {
            clearInterval(timer);
            setResendEnabled(true);
          }
        }, 1000);
      } else {
        toast.error(result.message, {
          position: "top-center"
        });
      }
    } catch (error) {
      toast.error('Failed to resend OTP. Please try again.', {
        position: "top-center"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToReset = () => {
    navigate('/reset-password', {
      state: { email }
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper fade-in">
        {/* Left Hero Section */}
        <div className="auth-hero-new">
          <div className="logo-container-new">
            <i className="fas fa-shopping-bag logo-icon-new"></i>
            <h1 className="logo-text-new">Nexora</h1>
          </div>
          <div className="hero-content-new">
            <h2 className="hero-title-new">Reset Password</h2>
            <p className="hero-subtitle-new">
              Forgot your password? No worries! Enter your email and we'll help you get back into your account securely.
            </p>
            <div className="hero-features-new">
              <div className="feature-item-new">
                <i className="fas fa-shield-alt"></i>
                <span>Secure Verification</span>
              </div>
              <div className="feature-item-new">
                <i className="fas fa-envelope"></i>
                <span>Email Delivery</span>
              </div>
              <div className="feature-item-new">
                <i className="fas fa-lock"></i>
                <span>Privacy Protected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div className="auth-form-section">
          <div className="form-card">

            <div className="form-header">
              <h2 className="form-title-new">
                {otpSent ? 'OTP Sent!' : 'Reset Password'}
              </h2>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group">
                  <label htmlFor="email">Email Address *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-envelope input-icon"></i>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      placeholder="Enter your email address"
                      className={errors.email ? 'error' : ''}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  {errors.email && (
                    <span className="error-message">
                      <i className="fas fa-exclamation-circle"></i> {errors.email}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-submit-new"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span>Sending OTP...</span>
                      <i className="fas fa-spinner fa-spin"></i>
                    </>
                  ) : (
                    <>
                      <span>Send Reset OTP</span>
                      <i className="fas fa-paper-plane"></i>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="otp-sent-section-new">
                <div className="success-message-new">
                  <div className="success-icon-new">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div className="success-text-new">
                    <h3>OTP Sent Successfully!</h3>
                    <p>Check your email for the 6-digit verification code</p>
                  </div>
                </div>

                <div className="otp-actions-new">
                  <button
                    type="button"
                    onClick={handleNavigateToReset}
                    className="btn-submit-new primary"
                  >
                    <i className="fas fa-key"></i>
                    Enter OTP & Reset Password
                  </button>

                  <div className="resend-section-new">
                    <p className="resend-text-new">
                      Didn't receive the code?{' '}
                      {countdown > 0 && (
                        <span className="countdown-new">
                          (Resend in {countdown}s)
                        </span>
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      className="resend-btn-new"
                      disabled={!resendEnabled || countdown > 0 || loading}
                    >
                      <i className="fas fa-redo"></i>
                      {loading ? 'Sending...' : 'Resend OTP'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="form-footer">
              <p className="auth-switch">
                Remember your password? <Link to="/login" className="auth-link">Login</Link>
              </p>
              <p className="auth-switch">
                Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default ForgotPassword;