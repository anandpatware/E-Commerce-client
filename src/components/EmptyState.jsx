export default function EmptyState({ title, text, action, onClick }) {
  return <div className="empty-state"><h2>{title}</h2><p>{text}</p>{action && <button className="outline-button" onClick={onClick}>{action}</button>}</div>;
}
