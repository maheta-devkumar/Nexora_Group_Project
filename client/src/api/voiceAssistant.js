/**
 * Voice Assistant Command Logic
 * 
 * Handles parsing of voice commands and mapping them to actions
 */

export const parseCommand = (transcript) => {
  const text = transcript.toLowerCase().trim();
  
  // ================= NAVIGATION =================
  if (text.includes("go to home") || text.includes("open home") || text.includes("go home")) {
    return { type: "NAVIGATE", payload: "/" };
  }
  
  if (text.includes("go to cart") || text.includes("open cart") || text.includes("show cart")) {
    return { type: "NAVIGATE", payload: "/cart" };
  }
  
  if (text.includes("go to checkout") || text.includes("open checkout")) {
    return { type: "NAVIGATE", payload: "/checkout" };
  }
  
  if (text.includes("open wishlist") || text.includes("go to wishlist")) {
    return { type: "NAVIGATE", payload: "/wishlist" };
  }
  
  if (text.includes("go back") || text.includes("back page")) {
    return { type: "GO_BACK" };
  }

  if (text.includes("go to profile") || text.includes("open profile")) {
    return { type: "NAVIGATE", payload: "/profile" };
  }

  if (text.includes("go to orders") || text.includes("my orders")) {
    return { type: "NAVIGATE", payload: "/orders" };
  }

  // ================= CART ACTIONS =================
  if (text.includes("clear cart") || text.includes("empty cart")) {
    return { type: "CLEAR_CART" };
  }

  // ================= CHECKOUT / ORDER =================
  if (text.includes("place order") || text.includes("confirm order") || text.includes("buy now")) {
    return { type: "PLACE_ORDER" };
  }

  if (text.includes("select razorpay") || text.includes("pay with razorpay")) {
    return { type: "SELECT_PAYMENT", payload: "RAZORPAY" };
  }

  if (text.includes("select cash") || text.includes("cash on delivery") || text.includes("cod")) {
    return { type: "SELECT_PAYMENT", payload: "COD" };
  }

  if (text.includes("select first payment") || text.includes("first payment method")) {
    return { type: "SELECT_PAYMENT", payload: "FIRST" };
  }

  // ================= SYSTEM =================
  if (text.includes("stop listening") || text.includes("turn off voice")) {
    return { type: "STOP_LISTENING" };
  }

  if (text.includes("help") || text.includes("what can you do")) {
    return { type: "HELP" };
  }

  // Debug/Test
  if (text.includes("hello") || text.includes("hi")) {
    return { type: "SPEAK", payload: "Hello! I am your voice assistant. You can ask me to navigate, clear cart, or place an order." };
  }

  return { type: "UNKNOWN", transcript: text };
};
