const tones = ['tone-sage', 'tone-clay', 'tone-sky', 'tone-butter'];

export default function ProductCard({ product, onSelect }) {
    return <article className="product-card">
        {onSelect ? <button className="product-select" onClick={() => onSelect(product)} aria-label={`View ${product.name}`}><div className={`product-image ${tones[(product.id || 0) % tones.length]}`}><span>{product.category}</span><div className="product-shape"></div></div></button> : <div className={`product-image ${tones[(product.id || 0) % tones.length]}`}><span>{product.category}</span><div className="product-shape"></div></div>}
        <div className="product-meta"><div><h3>{product.name}</h3><p>{product.description}</p></div><strong>${Number(product.price).toFixed(2)}</strong></div>
        <div className="stock-line">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</div>
    </article>;
}
