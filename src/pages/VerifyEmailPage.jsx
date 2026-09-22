import { useState } from 'react';
import { request } from '../api/client';

export default function VerifyEmailPage({ email, onNavigate, onNotice }) {
  const [busy, setBusy] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  async function resendVerification() {
    setBusy(true);
    setResendMessage('');
    try {
      await request('/users/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setResendMessage('A fresh verification link has been sent.');
    } catch (error) {
      onNotice({ type: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  return <section className="auth-layout verification-layout">
    <div className="auth-intro"><p className="eyebrow">One last step</p><h1>Check your<br /><em>inbox.</em></h1><p>We sent a verification link to <strong>{email}</strong>. Verify your email before signing in.</p></div>
    <div className="auth-form verification-card">
      <div className="verification-icon">@</div>
      <div className="form-heading"><p className="eyebrow">Email verification</p><h2>Confirm your email</h2></div>
      <p className="verification-copy">The link is valid for 24 hours. After verification, return here and sign in to your new account.</p>
      {resendMessage && <p className="verification-success" role="status">{resendMessage}</p>}
      <button className="primary-button" onClick={() => onNavigate('login')}>I&apos;ve verified my email <span>→</span></button>
      <button className="secondary-button" disabled={busy} onClick={resendVerification}>{busy ? 'Sending...' : 'Resend verification email'}</button>
      <p className="switch-auth">Wrong email? <button type="button" onClick={() => onNavigate('register')}>Register again</button></p>
    </div>
  </section>;
}
