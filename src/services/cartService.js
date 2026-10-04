const CART_STORAGE_KEY = 'northstar_cart';

function isCartItem(item) {
  return item && item.id != null && Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0;
}

function persist(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  return cart;
}

export function getCart() {
  try {
    const storedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    return Array.isArray(storedCart) ? storedCart.filter(isCartItem) : [];
  } catch {
    return [];
  }
}

export function addToCart(cart, product, quantity = 1) {
  const requestedQuantity = Math.max(0, Number(quantity) || 0);
  const existingItem = cart.find((item) => item.id === product.id);
  const currentQuantity = existingItem?.quantity || 0;
  const nextQuantity = Math.min(product.stock, currentQuantity + requestedQuantity);
  const nextCart = existingItem
    ? cart.map((item) => item.id === product.id ? { ...item, quantity: nextQuantity } : item)
    : nextQuantity > 0 ? [...cart, { ...product, quantity: nextQuantity }] : cart;

  return persist(nextCart);
}

export function updateCartItemQuantity(cart, productId, quantity) {
  const nextQuantity = Math.max(0, Number(quantity) || 0);
  const nextCart = cart
    .map((item) => item.id === productId
      ? { ...item, quantity: Math.min(item.stock, nextQuantity) }
      : item)
    .filter((item) => item.quantity > 0);

  return persist(nextCart);
}

export function removeFromCart(cart, productId) {
  return persist(cart.filter((item) => item.id !== productId));
}

export function getCartCount(cart) {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

export function getCartTotal(cart) {
  return cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
}
