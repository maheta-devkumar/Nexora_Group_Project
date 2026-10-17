import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import api from "../../api/api";
import "./Login.css";

const Login = () => {
    const { login, persistAuth, isLoading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [showGoogleOverlay, setShowGoogleOverlay] = useState(false);

    useEffect(() => {
        console.log("🔧 LOGIN PAGE LOADED");
        console.log("🌐 Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID ? "✓ Present" : "✗ Missing");
    }, []);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
        setApiError("");
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.password) newErrors.password = "Password is required";

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("🚀 FORM SUBMITTED");

        if (!validateForm()) {
            console.log("❌ Form validation failed");
            return;
        }

        setApiError("");
        console.log("📤 Attempting login...");
        const result = await login(formData.email, formData.password);

        if (!result?.success) {
            console.log("❌ Login failed:", result?.message);
            setApiError(result?.message || "Invalid email or password.");
        } else {
            console.log("✅ Login success");
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            setIsGoogleLoading(true);
            setShowGoogleOverlay(true);
            console.log("🔑 Google login successful, sending token to backend...");

            const res = await api.post("/auth/google-login", {
                token: credentialResponse.credential,
            });

            console.log("✅ Backend response:", res.data);
            const { access_token, user } = res.data;

            persistAuth(access_token, user);

            console.log("🔄 Google login successful, redirecting...");
            setTimeout(() => {
                window.location.href = "/";
            }, 1000);

        } catch (error) {
            console.error("❌ Google login failed:", error);
            setIsGoogleLoading(false);
            setShowGoogleOverlay(false);

            let errorMessage = "Google login failed. Please try again.";
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.status === 401) {
                errorMessage = "Google authentication failed. Please try again.";
            } else if (error.response?.status === 500) {
                errorMessage = "Server error. Please try again later.";
            }

            setApiError(errorMessage);
            setTimeout(() => {
                alert(errorMessage);
            }, 300);
        }
    };

    const handleGoogleError = () => {
        console.error("❌ Google Login Failed");
        setIsGoogleLoading(false);
        setShowGoogleOverlay(false);
        setApiError("Google login was cancelled or failed. Please try again.");
    };

    return (
        <div className="auth-container">
            {/* Google Loading Overlay */}
            {showGoogleOverlay && (
                <div className="google-loading-overlay">
                    <div className="text-center">
                        <div className="google-loading-spinner"></div>
                        <div className="google-loading-text">Signing in with Google...</div>
                    </div>
                </div>
            )}

            <div className="auth-wrapper fade-in">

                {/* Left Hero Section */}
                <div className="auth-hero-new">
                    <div className="logo-container-new">
                        <i className="fas fa-shopping-bag logo-icon-new"></i>
                        <h1 className="logo-text-new">Nexora</h1>
                    </div>
                    <div className="hero-content-new">
                        <h2 className="hero-title-new">Welcome Back!</h2>
                        <p className="hero-subtitle-new">
                            Sign in to access your personalized dashboard, track orders, and explore exclusive member-only deals.
                        </p>
                        <div className="hero-features-new">
                            <div className="feature-item-new">
                                <i className="fas fa-lock"></i>
                                <span>Secure Login</span>
                            </div>
                            <div className="feature-item-new">
                                <i className="fas fa-truck"></i>
                                <span>Track Orders</span>
                            </div>
                            <div className="feature-item-new">
                                <i className="fas fa-gift"></i>
                                <span>Member Rewards</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Form */}
                <div className="auth-form-section">
                    <div className="form-card">

                        <div className="form-header">
                            <h2 className="form-title">Log In</h2>
                            {apiError && (
                                <div className="error-message api-error">
                                    <i className="fas fa-exclamation-circle"></i> {apiError}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">

                            {/* Email */}
                            <div className="input-group">
                                <label htmlFor="email">Email Address</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-envelope input-icon"></i>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="johndoe@example.com"
                                        className={errors.email ? "error" : ""}
                                        disabled={isLoading || isGoogleLoading}
                                    />
                                </div>
                                {errors.email && (
                                    <span className="error-message">
                                        <i className="fas fa-exclamation-triangle"></i> {errors.email}
                                    </span>
                                )}
                            </div>

                            {/* Password with Forgot Password Link */}
                            <div className="input-group">
                                <div className="password-label-row">
                                    <label htmlFor="password">Password</label>
                                </div>
                                <div className="input-wrapper">
                                    <i className="fas fa-lock input-icon"></i>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        className={errors.password ? "error" : ""}
                                        disabled={isLoading || isGoogleLoading}
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={togglePasswordVisibility}
                                        title={showPassword ? "Hide password" : "Show password"}
                                        disabled={isLoading || isGoogleLoading}
                                    >
                                        <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                    </button>
                                </div>
                                <Link to="/forgot-password" className="forgot-password-link">
                                    Forgot Password?
                                </Link>
                                {errors.password && (
                                    <span className="error-message">
                                        <i className="fas fa-exclamation-triangle"></i> {errors.password}
                                    </span>
                                )}
                            </div>

                            {/* Remember Me */}
                            <div className="form-options">
                                <label className="checkbox-container">
                                    <input type="checkbox" />
                                    <span>Remember me</span>
                                </label>
                            </div>

                            {/* Login Button */}
                            <button
                                type="submit"
                                className="btn-submit-new"
                                disabled={isLoading || isGoogleLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span>Logging In...</span>
                                        <i className="fas fa-spinner fa-spin"></i>
                                    </>
                                ) : (
                                    <>
                                        <span>Log In</span>
                                        <i className="fas fa-arrow-right"></i>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="divider">
                            <span>OR CONTINUE WITH</span>
                        </div>

                        {/* Google Login Button */}
                        <div className="google-login-container">

                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme="filled_blue"
                                size="large"
                                shape="rectangular"
                                text="continue_with"
                                useOneTap={false}
                                width="400"
                            />
                        </div>

                        {/* Alternative Social Logins (Optional) */}
                        {false && (
                            <div className="social-login">
                                <button className="btn-social google" disabled={isLoading || isGoogleLoading}>
                                    <i className="fab fa-google"></i>
                                </button>
                                <button className="btn-social facebook" disabled={isLoading || isGoogleLoading}>
                                    <i className="fab fa-facebook-f"></i>
                                </button>
                                <button className="btn-social apple" disabled={isLoading || isGoogleLoading}>
                                    <i className="fab fa-apple"></i>
                                </button>
                            </div>
                        )}

                        {/* Sign Up Link */}
                        <p className="auth-switch">
                            Don't have an account?{" "}
                            <Link to="/signup" className="auth-link">Create Account</Link>
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

export default Login;