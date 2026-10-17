import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Layout from './components/Layout';

// Panels
import AdminPanel from './pages/Admin/AdminPanel';
import DeliveryPanel from './pages/DeliveryPerson/DeliveryPanel';

// Public Pages
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import ProductsList from './pages/ProductsList/ProductsList';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import GuestCheckout from './pages/GuestCheckout/GuestCheckout';

import NotAuthorized from './pages/NotAuthorized/NotAuthorized';
import ProtectedRoute from './routes/ProtectedRoute';

// Customer Pages (Protected)
import Cart from './pages/Cart/Cart';
import Wishlist from './pages/Wishlist/Wishlist';
import Profile from './pages/Profile/Profile';
import Account from './pages/Account/Account';
import AddressPage from './pages/Address/AddressPage';
import UserReviewsPage from './pages/Review/UserReviewsPage';
import SupportPage from './pages/Support/SupportPage';

// Checkout
import Checkout from './pages/Checkout/Checkout';
import Shipping from './pages/Shipping/Shipping';
import PaymentProcessing from './pages/PaymentProcessing/PaymentProcessing';
import OrderConfirmation from './pages/OrderConfirmation/OrderConfirmation';
import AddressVerification from './pages/AddressVerification/AddressVerification';

// Orders
import Orders from './pages/Orders/Orders';
import OrderDetail from './pages/OrderDetail/OrderDetail';
import TrackOrder from './pages/TrackOrder/TrackOrder';
import Invoice from './pages/Invoice/Invoice';

// Extras
import CouponsPage from './pages/Coupon/CouponsPage';
import ApplyCouponPage from './pages/Coupon/ApplyCouponPage';
import OffersPage from './pages/Offer/OffersPage';
import OfferDetailsPage from './pages/Offer/OfferDetailsPage';
import NotificationPage from './pages/Notification/NotificationPage';
import DealsPage from './pages/Deals/DealsPage';
import NewArrivalsPage from './pages/NewArrivals/NewArrivalsPage';

// Example / Debug
import Example from './pages/Example';
import DebugPage from './pages/Debug/DebugPage';
import { AvailableDeliveriesProvider } from './context/delivery_panel/AvailableDeliveriesContext';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import { VariantProvider } from './context/VariantContext';
import { ProductProvider } from './context/ProductContext';
import { InventoryProvider } from './context/InventoryContext';

// AI Pages and Contexts
import { AddressProvider } from './context/AddressContext';
import { CheckoutProvider } from './context/CheckoutContext';
import { OrderProvider } from './context/OrderContext';
import { PaymentProvider } from './context/PaymentContext';
import { ProductReviewProvider } from './context/ProductReviewContext';
import { ChatbotProvider } from './context/ChatbotContext';
import Chatbot from './components/Chatbot/Chatbot';
import { useLocation } from 'react-router-dom';
import GlobalLanguageSwitcher from './components/GlobalLanguageSwitcher/GlobalLanguageSwitcher';
import { VoiceAssistantProvider } from './context/VoiceAssistantContext';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      <GlobalLanguageSwitcher />
      {/* Show Chatbot everywhere EXCEPT Admin routes */}
      {!isAdminRoute && <Chatbot />}

      {/* Wrap all routes with the AI-related providers */}
      <AddressProvider>
        <CheckoutProvider>
          <OrderProvider>
            <PaymentProvider>
              <ProductReviewProvider>
                {/* Voice Assistant - Only for Non-Admin Routes */}
                {!isAdminRoute ? (
                  <VoiceAssistantProvider>
                    <Routes>
                      {/* ================= PUBLIC ROUTES ================= */}
                      <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="login" element={<Login />} />
                        <Route path="signup" element={<Signup />} />
                        <Route path="forgot-password" element={<ForgotPassword />} />
                        <Route path="reset-password" element={<ResetPassword />} />
                        <Route path="guest-checkout" element={<GuestCheckout />} />
                        <Route path="products" element={<ProductsList />} />
                        <Route path="products/:id" element={<ProductDetail />} />
                        <Route path="not-authorized" element={<NotAuthorized />} />
                      </Route>

                      {/* ================= ADMIN PANEL ================= */}
                      <Route
                        path="/admin/*"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <AdminPanel />
                          </ProtectedRoute>
                        }
                      />

                      {/* ================= DELIVERY PANEL ================= */}
                      <Route
                        path="/delivery/*"
                        element={
                          <ProtectedRoute allowedRoles={["delivery"]}>
                            <AvailableDeliveriesProvider>
                              <DeliveryPanel />
                            </AvailableDeliveriesProvider>
                          </ProtectedRoute>
                        }
                      />

                      {/* ================= USER PROTECTED ROUTES ================= */}
                      <Route element={<Layout />}>
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

                        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                        <Route path="/addresses" element={<ProtectedRoute><AddressPage /></ProtectedRoute>} />

                        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                        <Route path="/shipping" element={<ProtectedRoute><Shipping /></ProtectedRoute>} />
                        <Route path="/payment-processing" element={<ProtectedRoute><PaymentProcessing /></ProtectedRoute>} />
                        <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
                        <Route path="/address-verification" element={<ProtectedRoute><AddressVerification /></ProtectedRoute>} />

                        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                        <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                        <Route path="/orders/:orderId/track" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
                        <Route path="/invoice/:orderId" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
                        <Route path="/support" element={<SupportPage />} />

                        <Route path="/reviews" element={<ProtectedRoute><UserReviewsPage /></ProtectedRoute>} />
                        <Route path="/notifications" element={<NotificationPage />} />
                        <Route path="/deals" element={<DealsPage />} />
                        <Route path="/new-arrivals" element={<NewArrivalsPage />} />
                        <Route path="/coupons" element={<CouponsPage />} />
                        <Route path="/coupons/apply" element={<ApplyCouponPage />} />
                        <Route path="/offers" element={<OffersPage />} />
                        <Route path="/offers/:offerId" element={<OfferDetailsPage />} />
                      </Route>

                      {/* Delivery Example */}
                      <Route element={<Layout />}>
                        <Route
                          path="/example"
                          element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                              <InventoryProvider>
                                <Example />
                              </InventoryProvider>
                            </ProtectedRoute>
                          }
                        />
                      </Route>

                      {/* Debug */}
                      <Route path="/debug" element={<DebugPage />} />

                    </Routes>
                  </VoiceAssistantProvider>
                ) : (
                  /* Admin Routes don't get Voice Context */
                  <Routes>
                    {/* ================= PUBLIC ROUTES ================= */}
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Home />} />
                      <Route path="login" element={<Login />} />
                      <Route path="signup" element={<Signup />} />
                      <Route path="forgot-password" element={<ForgotPassword />} />
                      <Route path="reset-password" element={<ResetPassword />} />
                      <Route path="guest-checkout" element={<GuestCheckout />} />
                      <Route path="products" element={<ProductsList />} />
                      <Route path="products/:id" element={<ProductDetail />} />
                      <Route path="not-authorized" element={<NotAuthorized />} />
                    </Route>

                    {/* ================= ADMIN PANEL ================= */}
                    <Route
                      path="/admin/*"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <AdminPanel />
                        </ProtectedRoute>
                      }
                    />

                    {/* ================= DELIVERY PANEL ================= */}
                    <Route
                      path="/delivery/*"
                      element={
                        <ProtectedRoute allowedRoles={["delivery"]}>
                          <AvailableDeliveriesProvider>
                            <DeliveryPanel />
                          </AvailableDeliveriesProvider>
                        </ProtectedRoute>
                      }
                    />

                    {/* ================= USER PROTECTED ROUTES ================= */}
                    <Route element={<Layout />}>
                      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                      <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />

                      <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                      <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                      <Route path="/addresses" element={<ProtectedRoute><AddressPage /></ProtectedRoute>} />

                      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                      <Route path="/shipping" element={<ProtectedRoute><Shipping /></ProtectedRoute>} />
                      <Route path="/payment-processing" element={<ProtectedRoute><PaymentProcessing /></ProtectedRoute>} />
                      <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
                      <Route path="/address-verification" element={<ProtectedRoute><AddressVerification /></ProtectedRoute>} />

                      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                      <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                      <Route path="/orders/:orderId/track" element={<ProtectedRoute><TrackOrder /></ProtectedRoute>} />
                      <Route path="/invoice/:orderId" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
                      <Route path="/support" element={<SupportPage />} />

                      <Route path="/reviews" element={<ProtectedRoute><UserReviewsPage /></ProtectedRoute>} />
                      <Route path="/notifications" element={<NotificationPage />} />
                      <Route path="/deals" element={<DealsPage />} />
                      <Route path="/new-arrivals" element={<NewArrivalsPage />} />
                      <Route path="/coupons" element={<CouponsPage />} />
                      <Route path="/coupons/apply" element={<ApplyCouponPage />} />
                      <Route path="/offers" element={<OffersPage />} />
                      <Route path="/offers/:offerId" element={<OfferDetailsPage />} />
                    </Route>

                    {/* Delivery Example */}
                    <Route element={<Layout />}>
                      <Route
                        path="/example"
                        element={
                          <ProtectedRoute allowedRoles={["admin"]}>
                            <InventoryProvider>
                              <Example />
                            </InventoryProvider>
                          </ProtectedRoute>
                        }
                      />
                    </Route>

                    {/* Debug */}
                    <Route path="/debug" element={<DebugPage />} />

                  </Routes>
                )}
              </ProductReviewProvider>
            </PaymentProvider>
          </OrderProvider>
        </CheckoutProvider>
      </AddressProvider>
    </>
  );
}

function App() {
  return (
    <ChatbotProvider>
      <ToastContainer
        autoClose={2000}
        position="top-center"
        theme="colored"
        transition={Slide}
      />
      <AppContent />
    </ChatbotProvider>
  );
}

export default App;