import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { parseVoiceCommand, INTENTS, mapWordToIndex } from '../api/voiceCommands';
import { useCartContext } from './CartContext';
import { useCheckoutContext } from './CheckoutContext';
import { useProductContext } from './ProductContext';
import { useAddressContext } from './AddressContext';
import { useDeliveryContext } from './DeliveryContext';
import { useWishlistContext } from './WishlistContext'; // NEW
import { useAuth } from './AuthContext';

const VoiceAssistantContext = createContext();

export const useVoiceAssistant = () => {
    const context = useContext(VoiceAssistantContext);
    if (!context) {
        throw new Error('useVoiceAssistant must be used within VoiceAssistantProvider');
    }
    return context;
};

export const VoiceAssistantProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isListening, setIsListening] = useState(false);
    const [lastTranscript, setLastTranscript] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);

    // Contexts
    const { user, isAuthenticated, login, logout } = useAuth();
    const { addToCart, removeFromCart, updateQuantity, clearUserCart, cart } = useCartContext();
    const {
        setSelectedPayment: setSelectedPaymentHandler,
        confirmCheckout,
        verifiedAddress: selectedAddress,
        setVerifiedAddress: setSelectedAddressHandler,
        selectedPayment,
        paymentMethods,
        fetchPaymentMethods,
        applyCoupon,
        removeCoupon
    } = useCheckoutContext();
    const { products, fetchProducts } = useProductContext();
    const { addresses, fetchUserAddresses } = useAddressContext();
    const { addItemToWishlist, clearWishlist } = useWishlistContext(); // NEW
    const {
        updateDeliveryStatus,
        myAssignedOrders,
        fetchMyAssignedOrders
    } = useDeliveryContext();

    const recognitionRef = useRef(null);
    const synthesisRef = useRef(window.speechSynthesis);

    // Initialize Speech Recognition
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn("Voice Assistant: Speech API not supported");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;
            setLastTranscript(transcript);
            handleCommand(transcript);
        };

        recognition.onend = () => {
            if (isListening) {
                try {
                    recognition.start();
                } catch (e) {
                    // Already started or other error
                }
            }
        };

        recognition.onerror = (event) => {
            console.error("Voice Assistant Error:", event.error);
            if (event.error === 'not-allowed') {
                setIsListening(false);
                speak("Microphone access was denied. Please allow microphone access in your browser settings.");
            } else if (event.error === 'no-speech') {
                // Ignore
            } else {
                setIsListening(false);
                speak(`Voice error: ${event.error}`);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [isListening]);

    // Toggle Listening
    const toggleListening = useCallback(() => {
        if (isListening) {
            setIsListening(false);
            recognitionRef.current?.stop();
            speak("Voice Assistant disabled.");
        } else {
            try {
                recognitionRef.current?.start();
                setIsListening(true);
                speak("Voice Assistant active. Say a command.");
            } catch (e) {
                console.error("Start error", e);
                setIsListening(false);
                speak("Could not start voice assistant. Check permissions.");
            }
        }
    }, [isListening]);

    // Safety: Stop listening in Admin
    useEffect(() => {
        if (location.pathname.startsWith('/admin')) {
            if (isListening) {
                setIsListening(false);
                recognitionRef.current?.stop();
            }
        }
    }, [location.pathname]);

    // Speak Function
    const speak = (text) => {
        if (!synthesisRef.current) return;
        synthesisRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        synthesisRef.current.speak(utterance);
    };

    // Helper: Find Product
    const findProduct = (productName) => {
        if (!products || products.length === 0) return null;

        const search = productName.toLowerCase();
        // Exact match
        let match = products.find(p => p.product_name.toLowerCase() === search);
        if (match) return match;

        // Includes match
        match = products.find(p => p.product_name.toLowerCase().includes(search));
        if (match) return match;

        return null;
    };

    // Helper: Find Address
    const findAddress = (keyword) => {
        if (!addresses || addresses.length === 0) return null;
        const lowerKey = keyword.toLowerCase();

        return addresses.find(addr =>
            (addr.area && addr.area.toLowerCase().includes(lowerKey)) ||
            (addr.city_name && addr.city_name.toLowerCase().includes(lowerKey)) ||
            (addr.address_line_1 && addr.address_line_1.toLowerCase().includes(lowerKey))
        );
    };

    // Helper: Get Random Products
    const getRandomProducts = (count = 1) => {
        if (!products || products.length === 0) return [];
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    // Command Handler
    const handleCommand = async (transcript) => {
        console.log("🎤 Voice Command:", transcript);
        const { type, payload } = parseVoiceCommand(transcript);
        console.log("🧩 Parsed Intent:", type, "Payload:", payload);

        if (type === INTENTS.UNKNOWN) {
            console.log("⚠️ Unknown Intent Match");
            // speak("I heard you, but I didn't understand that command."); 
            // Allow silence? No, user said "not working". Let's give feedback for debug.
            // speak("Sorry, I didn't understand.");
        }

        try {
            switch (type) {
                // --- AUTHENTICATION ---
                case INTENTS.LOGIN: {
                    speak("Attempting to log in...");
                    const res = await login(payload.email, payload.password);
                    if (res.success) {
                        speak(`Login successful. Welcome back, ${res.data.user.name || 'User'}.`);
                    } else {
                        speak(`Login failed. ${res.message}`);
                    }
                    break;
                }

                case INTENTS.LOGOUT: {
                    logout();
                    speak("You are now logged out.");
                    break;
                }

                case INTENTS.EDIT_PROFILE: {
                    navigate('/profile');
                    speak("Profile edit page opened.");
                    break;
                }

                // --- NAVIGATION ---
                case INTENTS.NAVIGATE:
                    if (payload.page) {
                        const path = payload.page === 'home' ? '/' : `/${payload.page}`;
                        navigate(path);
                        speak(`We are now in ${payload.page}`);
                    }
                    break;

                case INTENTS.GO_BACK:
                    navigate(-1);
                    speak("Going back");
                    break;

                // --- CART ---
                case INTENTS.ADD_TO_CART: {
                    // Check if randomly adding
                    let targetProducts = [];

                    // Ensure products are loaded
                    let availableProducts = products;
                    if (!products || products.length === 0) {
                        speak("Loading products...");
                        const res = await fetchProducts();
                        availableProducts = res?.items || [];
                    }

                    if (payload.isRandom) {
                        // "add any five product"
                        // Use helper with availableProducts 
                        if (availableProducts.length === 0) {
                            speak("No products available to add.");
                            return;
                        }
                        const count = payload.quantity || 1;
                        const shuffled = [...availableProducts].sort(() => 0.5 - Math.random());
                        targetProducts = shuffled.slice(0, count);

                        if (targetProducts.length > 0) {
                            speak(`Adding ${targetProducts.length} random products to cart.`);
                            for (const p of targetProducts) {
                                await addToCart(p.product_id, 1);
                            }
                            speak("Done. I have added them to your cart.");
                        }
                    } else {
                        // Specific product
                        if (!payload.product) {
                            speak("What product should I add?");
                            return;
                        }

                        let product = availableProducts.find(p => p.product_name.toLowerCase().includes(payload.product.toLowerCase()));

                        if (product) {
                            await addToCart(product.product_id, payload.quantity || 1);
                            speak(`Done. ${product.product_name} has been added to your cart.`);
                        } else {
                            speak(`Sorry, I could not find a product named ${payload.product}.`);
                        }
                    }
                    break;
                }

                case INTENTS.REMOVE_FROM_CART: {
                    const cartItem = cart?.items?.find(item =>
                        item.product_name.toLowerCase().includes(payload.product)
                    );

                    if (cartItem) {
                        await removeFromCart(cartItem.product_variant_id);
                        speak(`${cartItem.product_name} removed from cart.`);
                    } else {
                        speak(`Item ${payload.product} not found in your cart.`);
                    }
                    break;
                }

                case INTENTS.CLEAR_CART:
                    await clearUserCart();
                    speak("I have cleared your cart. What would you like to do next?");
                    break;

                // --- WISHLIST ---
                case INTENTS.ADD_TO_WISHLIST: {
                    let availableProducts = products;
                    if (!products || products.length === 0) {
                        const res = await fetchProducts();
                        availableProducts = res?.items || [];
                    }

                    let productToAdd = null;
                    if (payload.isRandom || payload.product === 'any item') {
                        if (availableProducts.length > 0) {
                            productToAdd = availableProducts[Math.floor(Math.random() * availableProducts.length)];
                        }
                    } else {
                        productToAdd = availableProducts.find(p => p.product_name.toLowerCase().includes(payload.product?.toLowerCase()));
                    }

                    if (productToAdd) {
                        // addItemToWishlist needs variant_id. Assuming product_id maps 1:1 or logic handles it.
                        // Actually WishlistContext usually expects variant_id. ProductContext products usually have variants array or id.
                        // Let's assume product_id works or we take first variant.
                        // Looking at ProductContext, products have product_id.
                        // Looking at WishlistContext, it takes `variantId`.
                        // We might need to fetch details or just use product_id if API supports it.
                        // For now we try product_id, if fails we might need to update.
                        await addItemToWishlist(productToAdd.product_id);
                        speak(`Added ${productToAdd.product_name} to wishlist.`);
                    } else {
                        speak("Could not find product to add to wishlist.");
                    }
                    break;
                }

                case INTENTS.CLEAR_WISHLIST:
                    await clearWishlist();
                    speak("Wishlist cleared.");
                    break;

                // --- CHECKOUT ---
                case INTENTS.PROCEED_TO_CHECKOUT:
                    navigate('/checkout');
                    speak("Proceeding to checkout page.");
                    break;

                case INTENTS.APPLY_COUPON:
                    if (payload.code) {
                        const res = await applyCoupon(payload.code);
                        if (res.success) {
                            speak(`Coupon ${payload.code} applied successfully.`);
                        } else {
                            speak(`Failed to apply coupon. ${res.message}`);
                        }
                    }
                    break;

                case INTENTS.CLEAR_COUPON:
                    await removeCoupon();
                    speak("Coupon removed.");
                    break;

                case INTENTS.SELECT_ADDRESS: {
                    if (location.pathname !== '/checkout') {
                        navigate('/checkout');
                        // speak("Going to checkout..."); 
                        // Don't speak here to avoid double speak if successful
                    }

                    let availableAddresses = addresses;
                    if (!addresses || addresses.length === 0) {
                        const res = await fetchUserAddresses();
                        availableAddresses = res.data || [];
                    }

                    let addr = null;
                    if (payload.index !== undefined) {
                        const idx = mapWordToIndex(payload.index);
                        if (availableAddresses[idx]) addr = availableAddresses[idx];
                    } else if (payload.keyword) {
                        const lowerKey = payload.keyword.toLowerCase();
                        addr = availableAddresses.find(a =>
                            (a.area && a.area.toLowerCase().includes(lowerKey)) ||
                            (a.city_name && a.city_name.toLowerCase().includes(lowerKey)) ||
                            (a.address_line_1 && a.address_line_1.toLowerCase().includes(lowerKey))
                        );
                    }

                    if (addr) {
                        if (setSelectedAddressHandler) {
                            setSelectedAddressHandler(addr);
                            speak(`Address in ${addr.city_name} selected.`);
                        }
                    } else {
                        speak("Sorry, I could not find that address.");
                    }
                    break;
                }

                case INTENTS.SELECT_PAYMENT: {
                    if (location.pathname !== '/checkout') {
                        navigate('/checkout');
                    }

                    let methods = paymentMethods;
                    if (!methods || methods.length === 0) {
                        const res = await fetchPaymentMethods();
                        methods = res.data || [];
                    }

                    const targetMethod = payload.method;
                    const paymentObj = methods.find(m => {
                        if (targetMethod === 'COD') return m.method === 'COD' || m.name.toLowerCase().includes('cash');
                        if (targetMethod === 'RAZORPAY') return m.method === 'RAZORPAY' || m.name.toLowerCase().includes('razorpay');
                        return false;
                    });

                    if (paymentObj) {
                        setSelectedPaymentHandler(paymentObj);
                        speak(`${paymentObj.name} selected.`);
                    } else {
                        speak(`Payment method ${targetMethod} is not available.`);
                    }
                    break;
                }

                case INTENTS.PLACE_ORDER:
                    if (location.pathname !== '/checkout') {
                        speak("Please go to checkout first.");
                        navigate('/checkout');
                    } else {
                        if (!selectedAddress) {
                            speak("Please select a delivery address.");
                        } else if (!selectedPayment) {
                            speak("Please select a payment method.");
                        } else {
                            speak("Placing your order...");
                            const checkoutData = {
                                address_id: selectedAddress.address_id,
                                payment_method: selectedPayment.method,
                                items: cart.items,
                                total: cart.total_price
                            };

                            const result = await confirmCheckout(checkoutData);
                            if (result && result.success) {
                                speak("Order placed successfully! Redirecting you.");
                                navigate('/order-confirmation');
                            } else {
                                speak("Failed to place order.");
                            }
                        }
                    }
                    break;

                // --- SYSTEM ---
                case INTENTS.STOP_LISTENING:
                    setIsListening(false);
                    recognitionRef.current?.stop();
                    speak("Voice Assistant disabled.");
                    break;

                case INTENTS.HELP:
                    speak("You can say: Add product to cart, Login with email, Place order, or Clear cart.");
                    break;

                case INTENTS.UNKNOWN:
                    // Only speak if user clearly said something but we missed it? 
                    // Or silence to avoid annoyance. 
                    // speak("I didn't catch that."); 
                    break;

                default:
                    break;
            }
        } catch (err) {
            console.error("Voice Handler Error:", err);
            speak("Sorry, something went wrong.");
        }
    };

    // Keyboard shortcut handlers
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                toggleListening();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleListening]);

    const value = {
        isListening,
        toggleListening,
        speak,
        lastTranscript,
        isSpeaking
    };

    return (
        <VoiceAssistantContext.Provider value={value}>
            {children}
        </VoiceAssistantContext.Provider>
    );
};

export { VoiceAssistantContext };
