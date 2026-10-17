/**
 * Voice Command Parser & Intent Matcher
 * 
 * Uses regex-based pattern matching to identify intents and extract entities.
 * NO external AI APIs used.
 */

// ==========================================
// INTENT DEFINITIONS
// ==========================================
export const INTENTS = {
    // Navigation
    NAVIGATE: 'NAVIGATE',
    GO_BACK: 'GO_BACK',

    // Auth
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    EDIT_PROFILE: 'EDIT_PROFILE',

    // Cart
    ADD_TO_CART: 'ADD_TO_CART',
    REMOVE_FROM_CART: 'REMOVE_FROM_CART',
    UPDATE_QUANTITY: 'UPDATE_QUANTITY',
    CLEAR_CART: 'CLEAR_CART',

    // Wishlist
    ADD_TO_WISHLIST: 'ADD_TO_WISHLIST',
    CLEAR_WISHLIST: 'CLEAR_WISHLIST',

    // Checkout
    PROCEED_TO_CHECKOUT: 'PROCEED_TO_CHECKOUT',
    SELECT_ADDRESS: 'SELECT_ADDRESS',
    SELECT_PAYMENT: 'SELECT_PAYMENT',
    PLACE_ORDER: 'PLACE_ORDER',
    APPLY_COUPON: 'APPLY_COUPON',
    CLEAR_COUPON: 'CLEAR_COUPON',

    // Delivery Person
    DELIVERY_ACCEPT: 'DELIVERY_ACCEPT',
    DELIVERY_PICKUP: 'DELIVERY_PICKUP',
    DELIVERY_COMPLETE: 'DELIVERY_COMPLETE',

    // System
    STOP_LISTENING: 'STOP_LISTENING',
    HELP: 'HELP',
    UNKNOWN: 'UNKNOWN'
};

// ==========================================
// REGEX PATTERNS
// ==========================================
// Order matters! More specific patterns first.

const PATTERNS = [
    // --- Navigation ---
    { intent: INTENTS.NAVIGATE, regex: /go to (cart|checkout|home|wishlist|profile|account|orders|login|signup)/i, extract: (m) => ({ page: m[1] }) },
    { intent: INTENTS.GO_BACK, regex: /go back/i },

    // --- Authentication ---
    {
        intent: INTENTS.LOGIN,
        regex: /login with email (.+?) password (.+)/i,
        extract: (m) => ({ email: m[1].trim(), password: m[2].trim() })
    },
    { intent: INTENTS.LOGOUT, regex: /logout|sign out/i },
    { intent: INTENTS.EDIT_PROFILE, regex: /edit profile/i },

    // --- Cart Operations ---
    {
        intent: INTENTS.ADD_TO_CART,
        regex: /add (?:any )?(\d+|one|two|three|four|five)?\s*(.+?) (?:in|to|into) cart/i,
        extract: (m) => {
            const qtyStr = m[1] ? m[1].toLowerCase() : '1';
            const map = { one: 1, two: 2, three: 3, four: 4, five: 5 };
            const quantity = map[qtyStr] || parseInt(qtyStr) || 1;
            return { quantity, product: m[2].trim(), isRandom: m[2].includes('any') };
        }
    },
    {
        intent: INTENTS.REMOVE_FROM_CART,
        regex: /remove (.+?) from cart/i,
        extract: (m) => ({ product: m[1].trim() })
    },
    { intent: INTENTS.CLEAR_CART, regex: /clear (cart|card)/i }, // Handles "clear card" typo

    // --- Wishlist Operations ---
    {
        intent: INTENTS.ADD_TO_WISHLIST,
        regex: /add (?:any )?(.+?) (?:in|to|into) wishlist/i,
        extract: (m) => ({ product: m[1].trim(), isRandom: m[0].includes('any') })
    },
    { intent: INTENTS.CLEAR_WISHLIST, regex: /clear wishlist/i },

    // --- Checkout Operations ---
    { intent: INTENTS.PROCEED_TO_CHECKOUT, regex: /proceed to checkout|checkout|go to checkout/i },
    { intent: INTENTS.PLACE_ORDER, regex: /place order|confirm order/i },
    {
        intent: INTENTS.APPLY_COUPON,
        regex: /apply coupon (.+)/i,
        extract: (m) => ({ code: m[1].trim() })
    },
    { intent: INTENTS.CLEAR_COUPON, regex: /clear coupon|remove coupon/i },

    // Address & Payment
    {
        intent: INTENTS.SELECT_ADDRESS,
        regex: /select address with (.+)/i,
        extract: (m) => ({ keyword: m[1].trim() })
    },
    {
        intent: INTENTS.SELECT_ADDRESS,
        regex: /select (first|second|third) address/i,
        extract: (m) => ({ index: m[1] })
    },
    {
        intent: INTENTS.SELECT_PAYMENT,
        regex: /select (razorpay|cash on delivery|cod)/i,
        extract: (m) => {
            const val = m[1].toLowerCase();
            return { method: (val === 'cod' || val === 'cash on delivery') ? 'COD' : 'RAZORPAY' };
        }
    },

    // --- System ---
    { intent: INTENTS.STOP_LISTENING, regex: /stop listening|disable voice/i },
    { intent: INTENTS.HELP, regex: /help|what can i say/i },
];

/**
 * Main Parser Function
 * @param {string} transcript 
 * @returns {object} { type: INTENT, payload: {} }
 */
export const parseVoiceCommand = (transcript) => {
    const text = transcript.toLowerCase().trim();

    for (const pattern of PATTERNS) {
        const match = text.match(pattern.regex);
        if (match) {
            const payload = pattern.extract ? pattern.extract(match) : {};
            return { type: pattern.intent, payload };
        }
    }

    return { type: INTENTS.UNKNOWN, payload: { text } };
};

// Helper to map index words to numbers
export const mapWordToIndex = (word) => {
    switch (word.toLowerCase()) {
        case 'first': return 0;
        case 'second': return 1;
        case 'third': return 2;
        default: return 0;
    }
};
