import { useEffect, useMemo, useState } from 'react';
import AddProductPage from './pages/AddProductPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import EmptyState from './components/EmptyState';
import Notice from './components/Notice';
import SiteHeader from './components/SiteHeader';
import { CATEGORIES, clearSession, isAdminSession, readSession, request, saveSession, unwrapList } from './api/client';

function initialPage() {
  const path = window.location.pathname;
  if (path === '/register' || path === '/login' || path === '/add-product' || path === '/verify' || path === '/cart') return path.slice(1);
  if (path.startsWith('/products/')) return 'product';
  return 'home';
}

export default function App() {
  const [page, setPage] = useState(initialPage);
  const [verificationEmail, setVerificationEmail] = useState(() => localStorage.getItem('northstar_pending_verification') || '');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('northstar_cart') || '[]'); } catch { return []; }
  });
  const [session, setSession] = useState(readSession);
  const [category, setCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES.slice(1));
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
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
    saveSession(nextSession); setSession(nextSession); navigate('home');
  }

  function logout() { clearSession(); setSession(null); navigate('home'); }

  function updateCart(product, quantity) {
    const nextCart = [...cart];
    const existing = nextCart.find((item) => item.id === product.id);
    const nextQuantity = Math.min(product.stock, (existing?.quantity || 0) + quantity);
    if (existing) existing.quantity = nextQuantity;
    else if (nextQuantity > 0) nextCart.push({ ...product, quantity: nextQuantity });
    setCart(nextCart);
    localStorage.setItem('northstar_cart', JSON.stringify(nextCart));
    setNotice({ type: 'success', text: `${product.name} added to your cart.` });
  }

  function updateCartQuantity(productId, quantity) {
    const nextCart = cart.map((item) => item.id === productId ? { ...item, quantity: Math.min(item.stock, quantity) } : item).filter((item) => item.quantity > 0);
    setCart(nextCart); localStorage.setItem('northstar_cart', JSON.stringify(nextCart));
  }

  function removeFromCart(productId) {
    const nextCart = cart.filter((item) => item.id !== productId);
    setCart(nextCart); localStorage.setItem('northstar_cart', JSON.stringify(nextCart));
  }

  function openProduct(product) { setSelectedProduct(product); navigate(`products/${product.id}`); }

  function buyNow(product, quantity = 1) {
    if (Array.isArray(product)) setNotice({ type: 'success', text: 'Your cart is ready for checkout.' });
    else { updateCart(product, quantity); setNotice({ type: 'success', text: 'Your item is ready for checkout.' }); }
    navigate('cart');
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
    if (page === 'product') return selectedProduct ? <ProductDetailsPage product={selectedProduct} onBack={() => navigate('home')} onAddToCart={updateCart} onBuyNow={buyNow} /> : <div className="empty-state"><h2>Loading product...</h2></div>;
    if (page === 'cart') return <CartPage items={cart} onBack={() => navigate('home')} onRemove={removeFromCart} onUpdateQuantity={updateCartQuantity} onBuyNow={buyNow} />;
    if (page === 'add-product' && isAdmin) return <AddProductPage categories={categories} onCreated={() => { loadProducts(category); navigate('home'); }} onNotice={setNotice} />;
    return <EmptyState title="Admin access required" text="Sign in with an administrator account to add products." action="Sign in" onClick={() => navigate('login')} />;
  }

  return <div className="app-shell"><SiteHeader page={page} isAdmin={isAdmin} session={session} cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} onNavigate={navigate} onLogout={logout} /><Notice notice={notice} onDismiss={() => setNotice(null)} /><main>{pageContent()}</main><footer><span>Northstar Market</span><span>Considered goods for everyday living.</span><span>{new Date().getFullYear()}</span></footer></div>;
}
