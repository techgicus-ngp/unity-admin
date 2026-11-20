import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { env } from '@/config/env';
import { registerEmployee } from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/utils/format';
import { Field } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/Spinner';
import { AuthLayout } from '@/components/layout/AuthLayout';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', groupName: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Enter name';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter valid email';
    if (!form.groupName) e.groupName = 'Please select a group';
    if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      await registerEmployee(form);
      toast.success('Registration successful! Please wait for admin approval, then login.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
        <form className="auth-card" onSubmit={submit} noValidate>
          <span className="auth-chip">New associate</span>
          <h1>Create your account</h1>
          <p className="muted">Fill in your details to register.</p>

          <Field label="Full Name" error={errors.name}>
            <input value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Email Address" error={errors.email}>
            <input type="email" value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Group Name" error={errors.groupName}>
            <select value={form.groupName} onChange={set('groupName')}>
              <option value="">Select Group</option>
              {env.employeeGroups.map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Password" error={errors.password}>
            <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
          </Field>
          <Field label="Confirm Password" error={errors.confirm}>
            <input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
          </Field>

          <button className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? <Spinner size={20} light /> : 'Register'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/login')}>Back to login</button>
        </form>
    </AuthLayout>
  );
}
