import { useState } from 'react';
import { request } from '../api/client';

export default function AddProductPage({ categories, onCreated, onNotice }) {
  const [form, setForm] = useState({ name: '', description: '', category: categories[0] || 'Electronics', price: '', stock: '' });
  const [busy, setBusy] = useState(false);
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });
  async function submit(event) {
    event.preventDefault(); setBusy(true);
    try { await request('/products/Create', { method: 'POST', body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) }) }); onCreated(); }
    catch (error) { onNotice({ type: 'error', text: error.message }); }
    finally { setBusy(false); }
  }
  return <section className="admin-layout"><div><p className="eyebrow">Admin workspace</p><h1>Add a new<br /><em>object.</em></h1><p className="admin-note">Give the collection something worth discovering. Keep the details clear and human.</p></div>
    <form className="product-form" onSubmit={submit}><label>Product name<input required value={form.name} onChange={update('name')} /></label><label>Description<textarea required rows="4" value={form.description} onChange={update('description')} /></label>
      <div className="two-fields"><label>Category<select value={form.category} onChange={update('category')}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>Price<input required min="0" step="0.01" type="number" value={form.price} onChange={update('price')} /></label></div>
      <label>Stock<input required min="0" step="1" type="number" value={form.stock} onChange={update('stock')} /></label><button className="primary-button" disabled={busy}>{busy ? 'Adding...' : 'Add to collection'} <span>→</span></button>
    </form>
  </section>;
}
