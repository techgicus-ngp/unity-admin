import { Suspense, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FileText, LayoutDashboard, LogOut, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { env } from '@/config/env';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageLoader } from '@/components/ui/Spinner';

const ADMIN_NAV = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/quotations', label: 'Quotations', icon: FileText },
];

/**
 * Layout for the tab pages. Admins get a sidebar (desktop) / bottom bar
 * (mobile); employees and guests only have one page so they get a header.
 */
export function AppShell() {
  const { user, isAdmin, logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const nav = isAdmin ? ADMIN_NAV : [];

  return (
    <div className={`shell ${nav.length ? 'shell-nav' : ''}`}>
      {nav.length > 0 && (
        <aside className="sidebar">
          <div className="sidebar-brand">
            <img src="/logo_icon.png" alt="" />
            <span className="badge badge-accent">ADMIN</span>
          </div>
          <nav>
            <span className="nav-label">Menu</span>
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `side-item ${isActive ? 'active' : ''}`}>
                <Icon size={20} /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-user">
            <span className="avatar">{(user.name[0] || 'A').toUpperCase()}</span>
            <div>
              <strong>{user.name}</strong>
              <small>Administrator</small>
            </div>
            <button className="icon-btn light" onClick={() => setConfirming(true)} aria-label="Sign out" title="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </aside>
      )}

      <div className="shell-body">
        <header className="topbar">
          <div className="topbar-title">
            <strong>{env.appName}</strong>
            <small>Hi, {user.name}</small>
          </div>
          <button className="icon-btn light" onClick={() => setConfirming(true)} aria-label="Sign out" title="Sign out">
            <LogOut size={20} />
          </button>
        </header>

        <main className="shell-main">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {nav.length > 0 && (
        <nav className="bottom-nav">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`}>
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}

      {confirming && (
        <ConfirmDialog
          title="Sign Out"
          message="Are you sure you want to sign out?"
          confirmLabel="Sign Out"
          danger
          onConfirm={logout}
          onClose={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
