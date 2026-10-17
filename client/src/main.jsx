import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { ProfileProvider } from "./context/ProfileContext.jsx";
import { AccountProvider } from "./context/AccountContext.jsx";
import { AddressProvider } from "./context/AddressContext";
import { OrderProvider } from "./context/OrderContext";
import { CheckoutProvider } from "./context/CheckoutContext";
import { PaymentProvider } from "./context/PaymentContext";
import { CouponProvider } from "./context/CouponContext";
import { OfferProvider } from "./context/OfferContext";
import { DeliveryProvider } from "./context/DeliveryContext";

// Product Catalog Context Providers
import { ProductProvider } from "./context/ProductContext";
import { CategoryProvider } from "./context/CategoryContext";
import { BrandProvider } from "./context/BrandContext";
import { CatalogProvider } from "./context/CatalogContext";
import { AttributeProvider } from "./context/AttributeContext.jsx";

// ADDED: Google OAuth Provider
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <ProfileProvider>
              <AccountProvider>
                <CartProvider>
                  <CouponProvider>
                    <OfferProvider>
                      <WishlistProvider>
                        <AddressProvider>
                          <OrderProvider>
                            <CheckoutProvider>
                              <PaymentProvider>
                                <DeliveryProvider>
                                  {/* Product Catalog Providers */}
                                  <ProductProvider>
                                    <CategoryProvider>
                                      <BrandProvider>
                                        <AttributeProvider>
                                          <CatalogProvider>
                                            <App />
                                          </CatalogProvider>
                                        </AttributeProvider>
                                      </BrandProvider>
                                    </CategoryProvider>
                                  </ProductProvider>
                                </DeliveryProvider>
                              </PaymentProvider>
                            </CheckoutProvider>
                          </OrderProvider>
                        </AddressProvider>
                      </WishlistProvider>
                    </OfferProvider>
                  </CouponProvider>
                </CartProvider>
              </AccountProvider>
            </ProfileProvider>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);