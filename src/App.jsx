import { useEffect, useMemo, useState } from 'react';
import AddProductPage from './pages/AddProductPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import EmptyState from './components/EmptyState';
import Notice from './components/Notice';
import SiteHeader from './components/SiteHeader';
import { CATEGORIES, clearSession, isAdminSession, readSession, request, saveSession, unwrapList } from './api/client';
import { addToCart, getCart, getCartCount, removeFromCart as removeCartItem, updateCartItemQuantity } from './services/cartService';

function initialPage() {
  const path = window.location.pathname;
  if (path === '/register' || path === '/login' || path === '/add-product' || path === '/verify' || path === '/cart' || path === '/checkout' || path === '/orders') return path.slice(1);
  if (path.startsWith('/products/')) return 'product';
  return 'home';
}

export default function App() {
  const [page, setPage] = useState(initialPage);
  const [verificationEmail, setVerificationEmail] = useState(() => localStorage.getItem('northstar_pending_verification') || '');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState(getCart);
  const [session, setSession] = useState(readSession);
  const [category, setCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES.slice(1));
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [postLoginPage, setPostLoginPage] = useState('home');
  const isAdmin = useMemo(() => isAdminSession(session), [session]);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (window.location.pathname === '/verify-email' && token) {
      request(`/users/auth/verify-email?token=${encodeURIComponent(token)}`)
        .then(() => setNotice({ type: 'success', text: 'Your email is verified. You can sign in now.' }))
        .catch((error) => setNotice({ type: 'error', text: error.message }));
      navigate('login');
    }
  }, []);

  useEffect(() => { loadProducts(category); }, [category]);

  useEffect(() => {
    const productId = window.location.pathname.startsWith('/products/') ? window.location.pathname.split('/').pop() : null;
    if (productId && page === 'product') {
      request(`/products/${productId}`).then(setSelectedProduct).catch((error) => setNotice({ type: 'error', text: error.message }));
    }
  }, [page]);

  async function loadProducts(selectedCategory) {
    setLoading(true);
    try {
      const [productData, categoryData] = await Promise.all([
        request(selectedCategory === 'All' ? '/products' : `/products/category/${encodeURIComponent(selectedCategory)}`),
        request('/products/categories').catch(() => null),
      ]);
      setProducts(unwrapList(productData));
      if (categoryData) setCategories(unwrapList(categoryData));
    } catch (error) { setNotice({ type: 'error', text: error.message }); }
    finally { setLoading(false); }
  }

  function navigate(nextPage) {
    window.history.pushState({}, '', nextPage === 'home' ? '/' : `/${nextPage}`);
    setPage(nextPage);
    setNotice(null);
  }

  function handleLogin(result) {
    const data = result?.data || result;
    const nextSession = { accessToken: data.accessToken, refreshToken: data.refreshToken };
    saveSession(nextSession);
    setSession(nextSession);
    navigate(postLoginPage);
    if (pendingAction?.type === 'add') updateCart(pendingAction.product, pendingAction.quantity);
    if (pendingAction?.type === 'buy') beginCheckout(pendingAction.product, pendingAction.quantity);
    setPendingAction(null);
    setPostLoginPage('home');
  }

  function logout() { clearSession(); setSession(null); navigate('home'); }

  function requestSignIn(action, returnPage = 'home') {
    setPendingAction(action || null);
    setPostLoginPage(returnPage);
    navigate('login');
    setNotice({ type: 'error', text: 'Please sign in to continue.' });
  }

  function updateCart(product, quantity) {
    const nextCart = addToCart(cart, product, quantity);
    setCart(nextCart);
    setNotice({ type: 'success', text: `${product.name} added to your cart.` });
  }

  function addToCartOrSignIn(product, quantity) {
    if (!session?.accessToken) {
      requestSignIn({ type: 'add', product, quantity });
      return;
    }
    updateCart(product, quantity);
  }

  function beginCheckout(product, quantity = 1) {
    if (product) {
      const nextCart = addToCart(cart, product, quantity);
      setCart(nextCart);
    }
    setPendingPayment(null);
    navigate('checkout');
  }

  function updateCartQuantity(productId, quantity) {
    setCart(updateCartItemQuantity(cart, productId, quantity));
  }

  function removeFromCart(productId) {
    setCart(removeCartItem(cart, productId));
  }

  function openProduct(product) {
    setSelectedProduct(product);
    window.history.pushState({}, '', `/products/${product.id}`);
    setPage('product');
    setNotice(null);
  }

  function buyNow(product, quantity = 1) {
    if (!session?.accessToken) {
      requestSignIn(Array.isArray(product) ? null : { type: 'buy', product, quantity }, Array.isArray(product) ? 'cart' : 'home');
      return;
    }
    if (Array.isArray(product)) navigate('checkout');
    else beginCheckout(product, quantity);
  }

  async function createPayment(shippingAddress) {
    setCheckoutBusy(true);
    setNotice(null);
    try {
      const order = await request('/orders', {
        method: 'POST',
        body: JSON.stringify({
          shippingAddress,
          items: cart.map((item) => ({
            productId: toOrderProductId(item.id),
            quantity: item.quantity,
            unitPrice: Number(item.price),
          })),
        }),
      });
      const idempotencyKey = crypto.randomUUID();
      const payment = await request('/payments', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ orderId: order.id, idempotencyKey }),
      });
      setPendingPayment(payment);
      return payment;
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
      throw error;
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function verifyPayment(details) {
    if (!pendingPayment) return;
    setCheckoutBusy(true);
    try {
      await request(`/payments/${pendingPayment.paymentId}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          providerOrderId: details.razorpay_order_id,
          providerPaymentId: details.razorpay_payment_id,
          signature: details.razorpay_signature,
        }),
      });
      localStorage.removeItem('northstar_cart');
      setCart([]);
      setPendingPayment(null);
      navigate('home');
      setNotice({ type: 'success', text: 'Payment complete. Your order is confirmed.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setCheckoutBusy(false);
    }
  }

  function toOrderProductId(id) {
    const hexId = BigInt(id).toString(16).padStart(32, '0');
    return `${hexId.slice(0, 8)}-${hexId.slice(8, 12)}-${hexId.slice(12, 16)}-${hexId.slice(16, 20)}-${hexId.slice(20)}`;
  }

  function handleRegistration(email) {
    localStorage.setItem('northstar_pending_verification', email);
    setVerificationEmail(email);
    navigate('verify');
    setNotice({ type: 'success', text: 'Account created. Verify your email before signing in.' });
  }

  function handleVerificationRequested(email) {
    localStorage.setItem('northstar_pending_verification', email);
    setVerificationEmail(email);
    navigate('verify');
  }

  function pageContent() {
    if (page === 'home') return <HomePage products={products} categories={categories} selectedCategory={category} onCategoryChange={setCategory} loading={loading} onProductSelect={openProduct} />;
    if (page === 'login' || page === 'register') return <AuthPage mode={page} onLogin={handleLogin} onNavigate={navigate} onNotice={setNotice} onRegistered={handleRegistration} onVerificationRequested={handleVerificationRequested} />;
    if (page === 'verify') return <VerifyEmailPage email={verificationEmail} onNavigate={navigate} onNotice={setNotice} />;
    if (page === 'product') return selectedProduct ? <ProductDetailsPage product={selectedProduct} onBack={() => navigate('home')} onAddToCart={addToCartOrSignIn} onBuyNow={buyNow} /> : <div className="empty-state"><h2>Loading product...</h2></div>;
    if (page === 'cart') return session ? <CartPage items={cart} onBack={() => navigate('home')} onRemove={removeFromCart} onUpdateQuantity={updateCartQuantity} onBuyNow={buyNow} /> : <EmptyState title="Sign in to view your cart" text="Your cart is available after you sign in." action="Sign in" onClick={() => requestSignIn(null, 'cart')} />;
    if (page === 'checkout') return session ? <CheckoutPage items={cart} payment={pendingPayment} busy={checkoutBusy} onBack={() => navigate('cart')} onCheckout={createPayment} onVerify={verifyPayment} onNotice={setNotice} onMockPayment={() => verifyPayment({ razorpay_order_id: pendingPayment?.providerOrderId, razorpay_payment_id: `MOCK_PAYMENT_${pendingPayment?.paymentId}`, razorpay_signature: 'mock-signature' })} /> : <EmptyState title="Sign in to check out" text="Sign in to continue with your purchase." action="Sign in" onClick={() => requestSignIn(null, 'checkout')} />;
    if (page === 'orders') return session ? <OrdersPage /> : <EmptyState title="Sign in to view orders" text="Your order history is available after you sign in." action="Sign in" onClick={() => requestSignIn(null, 'orders')} />;
    if (page === 'add-product' && isAdmin) return <AddProductPage categories={categories} onCreated={() => { loadProducts(category); navigate('home'); }} onNotice={setNotice} />;
    return <EmptyState title="Admin access required" text="Sign in with an administrator account to add products." action="Sign in" onClick={() => navigate('login')} />;
  }

  return <div className="app-shell"><SiteHeader page={page} isAdmin={isAdmin} session={session} cartCount={getCartCount(cart)} onNavigate={(nextPage) => {
    if ((nextPage === 'cart' || nextPage === 'checkout' || nextPage === 'orders') && !session?.accessToken) {
      requestSignIn(null, nextPage);
      return;
    }
    navigate(nextPage);
  }} onLogout={logout} /><Notice notice={notice} onDismiss={() => setNotice(null)} /><main>{pageContent()}</main><footer><span>Northstar Market</span><span>Considered goods for everyday living.</span><span>{new Date().getFullYear()}</span></footer></div>;
}
