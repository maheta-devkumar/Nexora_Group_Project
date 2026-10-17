// src/pages/ResetPassword/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { passwordResetAPI } from '../../api/passwordReset';
import './ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, label: '', color: '#ff6b6b' });
  const [otpExpired, setOtpExpired] = useState(false);

  useEffect(() => {
    // Get email from location state
    const stateEmail = location.state?.email;
    
    if (!stateEmail) {
      toast.error('Please request OTP first');
      navigate('/forgot-password');
      return;
    }
    
    setEmail(stateEmail);
  }, [location, navigate]);

  const calculatePasswordStrength = (password) => {
    if (!password) return { strength: 0, label: 'Very Weak', color: '#ff6b6b' };
    
    let score = 0;
    const requirements = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[^a-zA-Z\d]/.test(password)
    ];
    
    score = requirements.filter(Boolean).length;
    
    if (score <= 1) return { strength: 20, label: 'Weak', color: '#ff6b6b' };
    if (score <= 2) return { strength: 40, label: 'Fair', color: '#ff9f43' };
    if (score <= 3) return { strength: 60, label: 'Good', color: '#feca57' };
    if (score <= 4) return { strength: 80, label: 'Strong', color: '#48dbfb' };
    return { strength: 100, label: 'Very Strong', color: '#1dd1a1' };
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
    
    // Clear error when typing
    if (errors.newPassword) {
      setErrors({...errors, newPassword: ''});
    }
    
    // Validate password match
    if (confirmPassword && value !== confirmPassword) {
      setErrors({...errors, confirmPassword: 'Passwords do not match'});
    } else if (errors.confirmPassword) {
      const newErrors = {...errors};
      delete newErrors.confirmPassword;
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // OTP validation
    if (!otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    // Password validation
    if (!newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword = 'Must contain uppercase, lowercase, and number';
    }

    // Confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const result = await passwordResetAPI.resetPassword(email, otp, newPassword);
      
      if (result.success) {
        toast.success(result.message, {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Password reset successful! Please login with your new password.',
              email: email
            } 
          });
        }, 2000);
      } else {
        toast.error(result.message, {
          position: "top-center"
        });
        
        // Check if OTP expired
        if (result.message.includes('OTP expired')) {
          setOtpExpired(true);
        }
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
    setLoading(true);
    
    try {
      const result = await passwordResetAPI.requestPasswordReset(email);
      
      if (result.success) {
        toast.success('New OTP sent successfully!', {
          position: "top-center"
        });
        
        // Reset OTP field
        setOtp('');
        setOtpExpired(false);
        
        // Clear any OTP errors
        if (errors.otp) {
          setErrors({...errors, otp: ''});
        }
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

  const handleUseDifferentEmail = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-wrapper">
          
          {/* Left Banner */}
          <div className="auth-hero">
            <div className="hero-overlay">
              <div className="logo-container">
                <i className="fas fa-shopping-bag logo-icon"></i>
                <h1 className="logo-text">Nexora</h1>
              </div>
              <div className="hero-content">
                <h2 className="hero-title">Set New Password</h2>
                <p className="hero-subtitle">
                  Enter OTP and create a secure new password
                </p>
                <div className="hero-features">
                  <div className="feature-item">
                    <i className="fas fa-lock"></i>
                    <span>Strong Password Required</span>
                  </div>
                  <div className="feature-item">
                    <i className="fas fa-clock"></i>
                    <span>OTP Valid for 10 Minutes</span>
                  </div>
                  <div className="feature-item">
                    <i className="fas fa-key"></i>
                    <span>Secure & Encrypted</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="auth-form-section">
            <div className="form-card">
              <div className="form-header">
                <p className="form-caption">CREATE NEW PASSWORD</p>
                <h2 className="form-title">Reset Password</h2>
                <p className="form-description">
                  Enter the 6-digit OTP sent to <strong>{email}</strong> and create a new password
                </p>
                
                {otpExpired && (
                  <div className="warning-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Your OTP has expired. Please request a new one.</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                {/* Email Display */}
                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-wrapper">
                    <i className="fas fa-envelope input-icon"></i>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                </div>

                {/* OTP Input */}
                <div className="input-group">
                  <label htmlFor="otp">
                    6-Digit OTP
                    <button 
                      type="button"
                      onClick={handleResendOTP}
                      className="resend-otp-btn"
                      disabled={loading}
                    >
                      <i className="fas fa-redo"></i>
                      Resend OTP
                    </button>
                  </label>
                  <div className="input-wrapper">
                    <i className="fas fa-key input-icon"></i>
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(value);
                        if (errors.otp) setErrors({...errors, otp: ''});
                        if (otpExpired) setOtpExpired(false);
                      }}
                      placeholder="Enter 6-digit OTP"
                      className={errors.otp || otpExpired ? 'error' : ''}
                      disabled={loading}
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </div>
                  {errors.otp && (
                    <span className="error-message">
                      <i className="fas fa-exclamation-circle"></i> {errors.otp}
                    </span>
                  )}
                  <div className="otp-hint">
                    <i className="fas fa-info-circle"></i>
                    Enter the 6-digit code from your email
                  </div>
                </div>

                {/* New Password */}
                <div className="input-group">
                  <label htmlFor="newPassword">New Password *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-lock input-icon"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="newPassword"
                      value={newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Create a strong password"
                      className={errors.newPassword ? 'error' : ''}
                      disabled={loading}
                    />
                    <button 
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      disabled={loading}
                    >
                      <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newPassword && (
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
                      <span className="strength-label" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                  
                  {errors.newPassword && (
                    <span className="error-message">
                      <i className="fas fa-exclamation-circle"></i> {errors.newPassword}
                    </span>
                  )}
                  
                  <div className="password-requirements">
                    <small>
                      Password must contain:
                      <ul>
                        <li className={newPassword.length >= 8 ? 'met' : ''}>
                          At least 8 characters
                        </li>
                        <li className={/[a-z]/.test(newPassword) ? 'met' : ''}>
                          One lowercase letter
                        </li>
                        <li className={/[A-Z]/.test(newPassword) ? 'met' : ''}>
                          One uppercase letter
                        </li>
                        <li className={/\d/.test(newPassword) ? 'met' : ''}>
                          One number
                        </li>
                      </ul>
                    </small>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="input-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <div className="input-wrapper">
                    <i className="fas fa-lock input-icon"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({...errors, confirmPassword: ''});
                      }}
                      placeholder="Re-enter your password"
                      className={errors.confirmPassword ? 'error' : ''}
                      disabled={loading}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <span className="error-message">
                      <i className="fas fa-exclamation-circle"></i> {errors.confirmPassword}
                    </span>
                  )}
                  
                  {newPassword && confirmPassword && (
                    <div className={`password-match ${newPassword === confirmPassword ? 'match' : 'no-match'}`}>
                      <i className={`fas fa-${newPassword === confirmPassword ? 'check' : 'times'}`}></i>
                      {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={loading || otpExpired}
                >
                  {loading ? (
                    <>
                      <span>Resetting Password...</span>
                      <i className="fas fa-spinner fa-spin"></i>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <i className="fas fa-key"></i>
                    </>
                  )}
                </button>
              </form>

              <div className="form-footer">
                <div className="divider">
                  <span>Need Help?</span>
                </div>
                
                <div className="help-actions">
                  <button 
                    type="button"
                    onClick={handleResendOTP}
                    className="help-btn"
                    disabled={loading}
                  >
                    <i className="fas fa-redo"></i>
                    Resend OTP
                  </button>
                  
                  <button 
                    type="button"
                    onClick={handleUseDifferentEmail}
                    className="help-btn"
                    disabled={loading}
                  >
                    <i className="fas fa-envelope"></i>
                    Use Different Email
                  </button>
                  
                  <Link to="/login" className="help-btn">
                    <i className="fas fa-arrow-left"></i>
                    Back to Login
                  </Link>
                </div>
                
                <div className="support-note">
                  <i className="fas fa-headset"></i>
                  <span>Having trouble? Check your spam folder or contact support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;