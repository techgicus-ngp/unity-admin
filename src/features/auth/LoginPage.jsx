import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/utils/format';
import { Spinner } from '@/components/ui/Spinner';
import { AuthLayout } from '@/components/layout/AuthLayout';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.email, form.password); // PublicOnly redirects on success
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={submit}>
        <span className="auth-chip">Admin Portal</span>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to continue to your dashboard.</p>

        <label className="input-icon">
          <Mail size={19} />
          <input type="email" placeholder="Email address" value={form.email} onChange={set('email')} required autoComplete="username" autoFocus />
        </label>
        <label className="input-icon">
          <Lock size={19} />
          <input type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} required autoComplete="current-password" />
          <button type="button" className="icon-btn" onClick={() => setShowPass((s) => !s)} aria-label={showPass ? 'Hide password' : 'Show password'}>
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </label>

        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy ? <Spinner size={20} light /> : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
