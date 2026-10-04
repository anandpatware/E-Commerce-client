export default function SiteHeader({ page, isAdmin, session, cartCount, onNavigate, onLogout }) {
  return <header className="site-header">
    <button className="brand" onClick={() => onNavigate('home')} aria-label="Northstar Market home">
      <span className="brand-mark">N</span><span>Northstar <i>Market</i></span>
    </button>
    <nav className="main-nav" aria-label="Main navigation">
      <button className={page === 'home' ? 'active' : ''} onClick={() => onNavigate('home')}>Shop</button>
      {isAdmin && <button className={page === 'add-product' ? 'active' : ''} onClick={() => onNavigate('add-product')}>Add product</button>}
    </nav>
    <div className="header-actions">
      {session ? <>
        <button className="cart-link" onClick={() => onNavigate('cart')}>Cart ({cartCount})</button>
        <button className={`text-button${page === 'orders' ? ' active' : ''}`} onClick={() => onNavigate('orders')}>My orders</button>
        <button className="text-button" onClick={onLogout}>Sign out</button>
      </> : <button className="login-link" onClick={() => onNavigate('login')}>Sign in <span>+</span></button>}
    </div>
  </header>;
}
