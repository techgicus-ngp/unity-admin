import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, FileText, LayoutGrid, PlusCircle, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { env } from '@/config/env';
import { subscribeEmployees } from '@/services/authService';
import { countQuotations } from '@/services/quotationService';
import { useSubscription } from '@/hooks/useSubscription';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
};

export default function OverviewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: employees } = useSubscription(subscribeEmployees, []);
  const [quoteCount, setQuoteCount] = useState(null);

  useEffect(() => {
    countQuotations().then(setQuoteCount).catch(() => setQuoteCount(null));
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const tiles = [
    { icon: Users, label: 'Employees', value: employees ? employees.length : '—', color: 'var(--primary-2)', to: '/employees' },
    { icon: FileText, label: 'Quotations', value: quoteCount ?? '—', color: 'var(--purple)', to: '/quotations' },
  ];

  const actions = [
    { icon: PlusCircle, label: 'New Quotation', sub: 'Create and share a quote', color: 'var(--primary-2)', to: '/quotations/new' },
    { icon: LayoutGrid, label: 'Layout Dashboard', sub: 'Manage plots & floor plans', color: 'var(--success)', to: '/layouts' },
  ];

  return (
    <div className="page">
      <div className="overview-head">
        <div>
          <p className="eyebrow">{today}</p>
          <h1 className="greeting">Good {greeting()}, {user.name}</h1>
          <p className="muted">Here's an overview of your workspace today.</p>
        </div>
        <div className="row gap-8">
          <span className="badge badge-soft">ADMIN</span>
          <span className="badge badge-ok"><i className="dot dot-green" /> ACTIVE</span>
        </div>
      </div>

      <div className="bento">
        <section className="hero bento-hero">
          <span className="hero-tag">{env.appName.replace(/ Admin$/, '')}</span>
          <h2>Real Estate Management</h2>
          <p>Plots, quotations and your sales team in one workspace.</p>
          <div className="row gap-8 wrap">
            <button className="btn btn-light" onClick={() => navigate('/quotations/new')}><PlusCircle size={17} /> New Quotation</button>
            <button className="btn btn-glass" onClick={() => navigate('/layouts')}><LayoutGrid size={17} /> Open Layouts</button>
          </div>
        </section>

        {tiles.map(({ icon: Icon, label, value, color, to }) => (
          <button key={to} className="stat-card" onClick={() => navigate(to)} style={{ '--c': color }}>
            <span className="stat-icon"><Icon size={20} /></span>
            <strong>{value}</strong>
            <span>{label}</span>
            <ArrowUpRight className="stat-go" size={18} />
          </button>
        ))}
      </div>

      <h3 className="section-label">Quick Actions</h3>
      <div className="grid-actions">
        {actions.map(({ icon: Icon, label, sub, color, to }) => (
          <button key={to} className="action-card" onClick={() => navigate(to)} style={{ '--c': color }}>
            <span className="action-icon"><Icon size={24} /></span>
            <span className="grow">
              <strong>{label}</strong>
              <small>{sub}</small>
            </span>
            <ArrowUpRight size={18} className="action-go" />
          </button>
        ))}
      </div>
    </div>
  );
}
