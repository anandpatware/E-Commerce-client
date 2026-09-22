const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5098/api';

export const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Books', 'Groceries', 'Beauty'];

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem('northstar_session')) || null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem('northstar_session', JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem('northstar_session');
}

export function decodeToken(token = '') {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

export function isAdminSession(session) {
  const claims = decodeToken(session?.accessToken);
  return claims.role === 'Admin' || claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] === 'Admin';
}

export async function request(path, options = {}) {
  const session = readSession();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (session?.accessToken) headers.Authorization = `Bearer ${session.accessToken}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.title || 'Something went wrong.');
  return body;
}

export function unwrapList(payload) {
  return Array.isArray(payload) ? payload : payload?.data || [];
}
