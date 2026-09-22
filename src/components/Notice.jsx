export default function Notice({ notice, onDismiss }) {
  if (!notice) return null;
  return <div className={`notice ${notice.type}`} role="status"><span>{notice.type === 'success' ? 'Done' : 'Attention'}</span>{notice.text}<button onClick={onDismiss} aria-label="Dismiss notification">x</button></div>;
}
