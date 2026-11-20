import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/** Header for pushed (non-tab) pages: back button, title, right-side actions. */
export function PageHeader({ title, subtitle, actions, backTo }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      <button className="icon-btn light" onClick={() => (backTo ? navigate(backTo) : navigate(-1))} aria-label="Back">
        <ArrowLeft size={22} />
      </button>
      <div className="page-header-title">
        <h1>{title}</h1>
        {subtitle && <small>{subtitle}</small>}
      </div>
      <div className="page-header-actions">{actions}</div>
    </header>
  );
}
