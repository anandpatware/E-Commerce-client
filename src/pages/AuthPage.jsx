import { useEffect, useRef, useState } from 'react';
import { request } from '../api/client';

export default function AuthPage({ mode, onLogin, onNavigate, onNotice, onRegistered, onVerificationRequested }) {
  const isLogin = mode === 'login';
  const googleButton = useRef(null);
  const onLoginRef = useRef(onLogin);
  const onNoticeRef = useRef(onNotice);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  onLoginRef.current = onLogin;
  onNoticeRef.current = onNotice;

  useEffect(() => {
    if (!isLogin || !googleClientId || !googleButton.current) return;
    let active = true;

    async function handleGoogleCredential(response) {
      setBusy(true);
      try {
        const result = await request('/users/auth/google', {
          method: 'POST',
          body: JSON.stringify({ credential: response.credential }),
        });
        if (active) onLoginRef.current(result);
      } catch (error) {
        if (active) onNoticeRef.current({ type: 'error', text: error.message });
      } finally {
        if (active) setBusy(false);
      }
    }

    function initializeGoogleButton() {
      if (!active || !window.google?.accounts?.id || !googleButton.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleButton.current, {
        type: 'standard', theme: 'outline', size: 'large',
        text: 'continue_with', shape: 'rectangular', width: 320,
      });
    }

    let script = document.getElementById('google-identity-services');
    if (window.google?.accounts?.id) {
      initializeGoogleButton();
    } else {
      if (!script) {
        script = document.createElement('script');
        script.id = 'google-identity-services';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', initializeGoogleButton);
    }

    return () => {
      active = false;
      script?.removeEventListener('load', initializeGoogleButton);
    };
  }, [googleClientId, isLogin]);

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
      {isLogin && <div className="google-signin"><span className="google-divider">or continue with</span>{googleClientId ? <div ref={googleButton} /> : <p>Google sign-in needs VITE_GOOGLE_CLIENT_ID in the storefront environment.</p>}</div>}
      {verificationRequired && <div className="verification-prompt"><strong>Email verification required.</strong><span>Verify your email before signing in.</span><button type="button" onClick={() => onVerificationRequested(form.email)}>Open verification page <span>→</span></button></div>}
      <p className="switch-auth">{isLogin ? 'New to Northstar?' : 'Already a member?'} <button type="button" onClick={() => onNavigate(isLogin ? 'register' : 'login')}>{isLogin ? 'Register' : 'Sign in'}</button></p>
    </form>
  </section>;
}
