// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api"; // single axios instance used across app

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [authUser, setAuthUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Failed to parse stored user:", e);
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Add serverStatus so AccountContext can rely on it (default to 'online')
  const [serverStatus, setServerStatus] = useState("online");

  // Restore token & user on mount and set axios header
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);

    if (token) {
      // ensure api will send token for subsequent requests
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    if (user) {
      try {
        setAuthUser(JSON.parse(user));
      } catch (err) {
        console.error("Invalid user in localStorage, clearing auth:", err);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setAuthUser(null);
      }
    }
  }, []);

  // Helper: persist token + user and set header
  const persistAuth = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user || {}));
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setAuthUser(user || null);
  };

  // Helper: isAdmin check
  const isAdmin = () => {
    try {
      const u = authUser || JSON.parse(localStorage.getItem(USER_KEY) || "null");
      return !!(u && Array.isArray(u.roles) && u.roles.includes("admin"));
    } catch (e) {
      return false;
    }
  };
  const isDeliveryPerson = () => {
    try {
      const u = authUser || JSON.parse(localStorage.getItem(USER_KEY) || "null");
      return !!(u && Array.isArray(u.roles) && u.roles.includes("delivery"));
    } catch (e) {
      return false;
    }
  };

  // Login: uses centralized api instance
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const data = response.data;

      if (!data || data.success !== true) {
        return { success: false, message: data?.message || "Login failed" };
      }

      const token = data.access_token || data.token || null;
      const user = data.user || null;

      if (!token || !user) {
        return { success: false, message: "Missing token or user in response" };
      }

      // Persist and set header immediately
      persistAuth(token, user);

      // Get user roles
      const userRoles = user.roles || [];
      console.log("🔄 Login successful. User roles:", userRoles);

      // FIXED: Use "delivery" (lowercase) to match database
      if (userRoles.includes("admin")) {
        console.log("🔐 Redirecting admin to /admin/dashboard");
        navigate("/admin/dashboard", { replace: true });
      } else if (userRoles.includes("delivery")) { // Changed to "delivery"
        console.log("🛵 Redirecting delivery person to /delivery/dashboard");
        navigate("/delivery/dashboard", { replace: true });
      } else {
        console.log("👤 Redirecting regular user to home");
        navigate("/", { replace: true });
      }

      return { success: true, data: { token, user } };
    } catch (error) {
      console.error("LOGIN ERROR:", error);
      let message = "Login failed. Please try again.";
      if (error.response?.data?.detail) message = error.response.data.detail;
      else if (error.response?.data?.message) message = error.response.data.message;
      else if (error.message) message = error.message;
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", userData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("REGISTER ERROR:", error);
      let message = "Registration failed.";
      if (error.response?.data?.detail) message = error.response.data.detail;
      else if (error.response?.data?.message) message = error.response.data.message;
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (redirect = true) => {
    console.log("Auth: logging out");
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common["Authorization"];
    setAuthUser(null);

    if (redirect) navigate("/login", { replace: true });
  };

  // Expose simple helper to refresh user (if you need to fetch profile again)
  const refreshUser = (user) => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setAuthUser(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: authUser,
        isAuthenticated: !!authUser,
        isAdmin,
        isDeliveryPerson,
        serverStatus,
        setServerStatus,
        login,
        register,
        logout,
        refreshUser,
        persistAuth,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
