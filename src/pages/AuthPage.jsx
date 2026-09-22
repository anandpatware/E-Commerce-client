import { useState } from 'react';
import { request } from '../api/client';

export default function AuthPage({ mode, onLogin, onNavigate, onNotice, onRegistered, onVerificationRequested }) {
  const isLogin = mode === 'login';
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);

  async function submit(event) {
    event.preventDefault(); setBusy(true); setVerificationRequired(false);
    try {
      const result = await request(isLogin ? '/users/auth/login' : '/users/auth/register', { method: 'POST', body: JSON.stringify(form) });
      if (isLogin) onLogin(result);
      else onRegistered(form.email);
    } catch (error) {
      const needsVerification = isLogin && error.message.toLowerCase().includes('verify your email');
      if (needsVerification) setVerificationRequired(true);
      onNotice({ type: 'error', text: error.message });
    }
    finally { setBusy(false); }
  }

  return <section className="auth-layout"><div className="auth-intro"><p className="eyebrow">Northstar Market</p><h1>{isLogin ? <>Welcome<br /><em>back.</em></> : <>Make room<br /><em>for good.</em></>}</h1><p>{isLogin ? 'Your considered collection is waiting.' : 'Create an account to save your finds and follow every order.'}</p></div>
    <form className="auth-form" onSubmit={submit}><div className="form-heading"><p className="eyebrow">{isLogin ? 'Member access' : 'New account'}</p><h2>{isLogin ? 'Sign in' : 'Register'}</h2></div>
      {!isLogin && <label>Username<input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="username" /></label>}
      <label>Email address<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
        <label>Password<div className="password-field"><input required minLength="6" type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={isLogin ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
      <button className="primary-button" disabled={busy}>{busy ? 'Working...' : isLogin ? 'Enter Northstar' : 'Create account'} <span>→</span></button>
      {verificationRequired && <div className="verification-prompt"><strong>Email verification required.</strong><span>Verify your email before signing in.</span><button type="button" onClick={() => onVerificationRequested(form.email)}>Open verification page <span>→</span></button></div>}
      <p className="switch-auth">{isLogin ? 'New to Northstar?' : 'Already a member?'} <button type="button" onClick={() => onNavigate(isLogin ? 'register' : 'login')}>{isLogin ? 'Register' : 'Sign in'}</button></p>
    </form>
  </section>;
}
