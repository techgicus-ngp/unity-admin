import { Building2, LayoutGrid, ShieldCheck, FileText } from 'lucide-react';
import { env } from '@/config/env';

const FEATURES = [
  { icon: LayoutGrid, title: 'Live plot layouts', text: 'Track every plot status in real time.' },
  { icon: FileText, title: 'Instant quotations', text: 'Create, print and share in seconds.' },
  { icon: ShieldCheck, title: 'Team access control', text: 'Approve and manage your associates.' },
];

/** Split-screen wrapper shared by the login and registration pages. */
export function AuthLayout({ children }) {
  return (
    <div className="auth-split">
      <aside className="auth-aside">
        <div className="auth-aside-inner">
          <img className="auth-brand-logo" src="/logo_icon.png" alt="" />
          <span className="auth-eyebrow"><Building2 size={14} /> Real Estate Management</span>
          <h2>Manage plots, quotations and your team — all in one place.</h2>
          <ul className="auth-features">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="auth-feature-icon"><Icon size={18} /></span>
                <div><strong>{title}</strong><small>{text}</small></div>
              </li>
            ))}
          </ul>
          <small className="auth-copy">© {new Date().getFullYear()} {env.appName}</small>
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-wrap">{children}</div>
      </main>
    </div>
  );
}
