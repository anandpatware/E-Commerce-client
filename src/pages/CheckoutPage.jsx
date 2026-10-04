import { useState } from 'react';
import { getCartTotal } from '../services/cartService';
import './CheckoutPage.css';

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'));
    document.body.appendChild(script);
  });
}

export default function CheckoutPage({ items, payment, busy, onBack, onCheckout, onVerify, onNotice, onMockPayment }) {
  const [shippingAddress, setShippingAddress] = useState('');
  const [gatewayBusy, setGatewayBusy] = useState(false);
  const total = getCartTotal(items);
  const isMockPayment = payment?.providerOrderId?.startsWith('MOCK_ORDER_');

  async function openRazorpay() {
    setGatewayBusy(true);
    try {
      await loadRazorpay();
      const checkout = new window.Razorpay({
        key: payment.razorpayKeyId,
        amount: Math.round(Number(payment.amount) * 100),
        currency: payment.currency,
        name: 'Northstar Market',
        description: 'Order payment',
        order_id: payment.providerOrderId,
        handler: onVerify,
        theme: { color: '#d8653c' },
      });
      checkout.open();
    } catch (error) {
      onNotice({ type: 'error', text: error.message });
    } finally {
      setGatewayBusy(false);
    }
  }

  if (!items.length) {
    return <section className="checkout-page"><div className="empty-state"><h2>Your cart is quiet.</h2><p>Add a product before checking out.</p><button className="outline-button" onClick={onBack}>Return to cart</button></div></section>;
  }

  return <section className="checkout-page">
    <button className="back-link" onClick={onBack}>← Back to cart</button>
    <div className="checkout-layout">
      <div className="checkout-form-wrap">
        <p className="eyebrow">Secure checkout</p>
        <h1>Almost yours.</h1>
        {!payment ? <form className="checkout-form" onSubmit={(event) => { event.preventDefault(); onCheckout(shippingAddress).catch(() => {}); }}>
          <label htmlFor="shipping-address">Shipping address</label>
          <textarea id="shipping-address" required rows="4" maxLength="500" value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} placeholder="Street, city, postal code" />
          <button className="primary-button" disabled={busy}>{busy ? 'Preparing payment...' : 'Continue to payment'} <span>→</span></button>
        </form> : <div className="payment-ready">
          <p>Your order is ready. Complete payment to confirm it.</p>
          {isMockPayment
            ? <button className="primary-button" disabled={busy} onClick={onMockPayment}>Complete test payment <span>→</span></button>
            : <button className="primary-button" disabled={gatewayBusy} onClick={openRazorpay}>{gatewayBusy ? 'Opening payment...' : 'Pay securely'} <span>→</span></button>}
        </div>}
      </div>
      <aside className="checkout-summary">
        <p className="eyebrow">Order summary</p>
        {items.map((item) => <div className="checkout-line" key={item.id}><span>{item.name} × {item.quantity}</span><strong>${(Number(item.price) * item.quantity).toFixed(2)}</strong></div>)}
        <div className="checkout-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div>
        {payment && <p className="payment-status">Payment initialized · {payment.currency} {Number(payment.amount).toFixed(2)}</p>}
      </aside>
    </div>
  </section>;
}