import EmptyState from '../components/EmptyState';
import ProductCard from '../components/ProductCard';

export default function HomePage({ products, categories, selectedCategory, onCategoryChange, loading, onProductSelect }) {
  const availableCategories = ['All', ...categories.filter((item) => item !== 'All')];
  return <>
    <section className="hero">
      <div className="hero-copy"><p className="eyebrow">The edit · 04 / 26</p><h1>Small things.<br /><em>Well chosen.</em></h1><p className="hero-description">A quiet collection of useful, beautiful things for the way you live now.</p><a href="#catalog" className="outline-button">Explore the edit <span>↓</span></a></div>
      <div className="hero-art" aria-label="Featured home goods"><div className="sun-disc"></div><div className="vase vase-tall"></div><div className="vase vase-round"></div><div className="leaf leaf-one"></div><div className="leaf leaf-two"></div><p>FEATURED<br /><strong>OBJECTS</strong></p></div>
    </section>
    <section className="catalog" id="catalog">
      <div className="section-heading"><div><p className="eyebrow">Browse the collection</p><h2>Find your next favourite.</h2></div><span className="result-count">{loading ? 'Loading...' : `${products.length} pieces`}</span></div>
      <div className="category-tabs" role="tablist">{availableCategories.map((item) => <button key={item} className={selectedCategory === item ? 'selected' : ''} onClick={() => onCategoryChange(item)}>{item}</button>)}</div>
      {loading ? <div className="loading-grid"><span></span><span></span><span></span></div> : products.length ? <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id || index} product={product} onSelect={onProductSelect} />)}</div> : <EmptyState title="Nothing here yet" text="Try another category or check back soon." />}
    </section>
  </>;
}
