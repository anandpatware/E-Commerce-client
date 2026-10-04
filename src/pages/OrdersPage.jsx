import { useEffect, useState } from 'react';
import { request } from '../api/client';
import './OrdersPage.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    request('/orders')
      .then((result) => {
        if (active) setOrders(Array.isArray(result) ? result : result?.data || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  return <section className="orders-page">
    <div className="section-heading">
      <div><p className="eyebrow">Your account</p><h2>My orders</h2></div>
      <span className="result-count">{loading ? 'Loading...' : `${orders.length} orders`}</span>
    </div>
    {loading ? <p className="orders-message">Loading your orders...</p>
      : error ? <div className="empty-state"><h2>Orders unavailable</h2><p>{error}</p></div>
        : orders.length === 0 ? <div className="empty-state"><h2>No orders yet.</h2><p>Your confirmed purchases will appear here.</p></div>
          : <div className="orders-list">{orders.map((order) => <article className="order-entry" key={order.id}>
            <div className="order-heading">
              <div><p className="eyebrow">Placed {new Date(order.createdAt).toLocaleDateString()}</p><h3>Order {String(order.id).slice(0, 8).toUpperCase()}</h3></div>
              <span className={`order-status status-${String(order.status).toLowerCase()}`}>{order.status}</span>
            </div>
            <div className="order-items">{(order.items || []).map((item) => <div className="order-item" key={item.id}>
              <span>Product {item.productId}</span><span>Qty {item.quantity}</span><strong>${Number(item.totalPrice).toFixed(2)}</strong>
            </div>)}</div>
            <div className="order-footer"><span>{order.shippingAddress}</span><strong>Total ${Number(order.totalAmount).toFixed(2)}</strong></div>
          </article>)}</div>}
  </section>;
}