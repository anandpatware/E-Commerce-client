import { useState } from 'react';

export default function ProductDetailsPage({ product, onBack, onAddToCart, onBuyNow }) {
  const [quantity, setQuantity] = useState(1);
  if (!product) return null;

  return <section className="product-details">
    <button className="back-link" onClick={onBack}>← Back to collection</button>
    <div className="product-detail-grid">
      <div className={`detail-image tone-${product.category?.toLowerCase() === 'fashion' ? 'clay' : 'sage'}`}><span>{product.category}</span><div className="detail-shape"></div></div>
      <div className="detail-copy"><p className="eyebrow">Product detail</p><h1>{product.name}</h1><p className="detail-price">${Number(product.price).toFixed(2)}</p><p className="detail-description">{product.description}</p><p className="detail-stock">{product.stock > 0 ? `${product.stock} available` : 'Currently unavailable'}</p>
        <div className="quantity-control"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))} aria-label="Increase quantity">+</button></div>
        <div className="purchase-actions"><button className="primary-button" disabled={!product.stock} onClick={() => onBuyNow(product, quantity)}>Buy now <span>→</span></button><button className="secondary-button" disabled={!product.stock} onClick={() => onAddToCart(product, quantity)}>Add to cart</button></div>
      </div>
    </div>
  </section>;
}
