// src/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const TOKEN_KEY = "token";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token for every request (read fresh from localStorage)
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Error reading token in request interceptor:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to detect if a URL is customer-only
const isCustomerEndpoint = (url = "") => {
  if (!url) return false;
  // Consider the patterns used in your backend
  return url.includes("/profile") || url.includes("/account") || url.includes("/customer");
};

// Response interceptor: handle 401 / 403 centrally (role-aware)
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    // If no response (network), just rethrow
    if (!error.response) return Promise.reject(error);

    const status = error.response.status;
    const reqUrl = error.config?.url || "";

    // Determine if current stored user is admin
    let isAdminUser = false;
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        isAdminUser = Array.isArray(parsed.roles) && parsed.roles.includes("admin");
      }
    } catch (e) {
      isAdminUser = false;
    }

    // If it's a customer-only endpoint and the logged-in user is admin, DO NOT force logout
    if (isAdminUser && isCustomerEndpoint(reqUrl)) {
      console.warn(`API: ${status} on customer endpoint (${reqUrl}) — ignoring logout because user is admin.`);
      // Let the caller handle the error, do not clear token
      return Promise.reject(error);
    }

    // For other users/endpoints: handle 401 as auth failure
    if (status === 401) {
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("user");
      } catch (e) {
        console.error("Error clearing auth keys on 401:", e);
      }

      // Redirect to login if not already there
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    // For 403, treat similarly for non-admin-customer mismatch
    if (status === 403) {
      // If admin hit an admin endpoint and got 403, it might still be an auth issue: force logout.
      // But if admin hit customer endpoint, we've already returned above.
      try {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("user");
      } catch (e) {
        console.error("Error clearing auth keys on 403:", e);
      }

      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Safely parse JWT payload (returns null on error)
 */
export function parseJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    // handle unicode properly
    const json = decodeURIComponent(
      Array.prototype.map
        .call(decoded, (c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(json);
  } catch (e) {
    console.error("parseJwt error:", e);
    return null;
  }
}

/**
 * Return current user info inferred from JWT (does NOT replace real profile API)
 */
export function getCurrentUserFromToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const payload = parseJwt(token);
    if (!payload) return null;
    return {
      user_id: payload.user_id ?? null,
      email: payload.email ?? null,
      roles: payload.roles ?? [],
    };
  } catch (e) {
    console.error("getCurrentUserFromToken error:", e);
    return null;
  }
}

export default api;
