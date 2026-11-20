export function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="empty">
      {Icon && <Icon size={56} strokeWidth={1.4} />}
      <h3>{title}</h3>
      {hint && <p className="muted">{hint}</p>}
      {action}
    </div>
  );
}
