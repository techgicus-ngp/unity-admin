import { useMemo, useState } from 'react';
import { Trash2, Users } from 'lucide-react';
import { deleteEmployee, setEmployeeAccess, subscribeEmployees } from '@/services/authService';
import { useSubscription } from '@/hooks/useSubscription';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToast } from '@/context/ToastContext';
import { errorMessage, formatDate } from '@/utils/format';
import { SearchInput } from '@/components/ui/SearchInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';

export default function EmployeeListPage() {
  const toast = useToast();
  const { data: employees, loading, error } = useSubscription(subscribeEmployees, []);
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search).trim().toLowerCase();
  const [pending, setPending] = useState(null); // { type: 'access' | 'delete', emp, next? }
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () =>
      (employees ?? [])
        .filter((e) => !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q) || e.groupName.toLowerCase().includes(q))
        .sort((a, b) => b.createdDate - a.createdDate),
    [employees, q],
  );

  const confirm = async () => {
    setBusy(true);
    try {
      if (pending.type === 'access') {
        await setEmployeeAccess(pending.emp.uid, pending.next);
        toast.success(`Access ${pending.next ? 'granted' : 'revoked'} for ${pending.emp.name}`);
      } else {
        await deleteEmployee(pending.emp.uid);
        toast.success(`${pending.emp.name} deleted`);
      }
      setPending(null);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Employee Management</h1>
      <SearchInput value={search} onChange={setSearch} placeholder="Search employees…" />
      <div className="row gap-16 legend">
        <span><i className="dot dot-green" /> Access Granted</span>
        <span><i className="dot dot-red" /> Access Revoked</span>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <p className="error-text">Error: {error.message}</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title={q ? 'No employees match your search' : 'No employees registered yet'} />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Joined</th><th>Access</th><th aria-label="Delete" /></tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.uid}>
                  <td>
                    <div className="row gap-8">
                      <span className="avatar avatar-sm">{(emp.name[0] || 'E').toUpperCase()}</span>
                      <div>
                        <strong>{emp.name}</strong>
                        {emp.groupName && <small className="block muted">{emp.groupName}</small>}
                      </div>
                    </div>
                  </td>
                  <td>{emp.email}</td>
                  <td>{formatDate(emp.createdDate)}</td>
                  <td>
                    <button
                      className={`switch ${emp.isAccessGranted ? 'on' : ''}`}
                      onClick={() => setPending({ type: 'access', emp, next: !emp.isAccessGranted })}
                      aria-pressed={emp.isAccessGranted}
                      aria-label={`${emp.isAccessGranted ? 'Revoke' : 'Grant'} access for ${emp.name}`}
                    >
                      <span>{emp.isAccessGranted ? 'ON' : 'OFF'}</span>
                    </button>
                  </td>
                  <td>
                    <button className="icon-btn danger" onClick={() => setPending({ type: 'delete', emp })} aria-label={`Delete ${emp.name}`}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pending && (
        <ConfirmDialog
          danger={pending.type === 'delete' || !pending.next}
          busy={busy}
          title={pending.type === 'delete' ? 'Delete Employee' : `${pending.next ? 'Grant' : 'Revoke'} Access`}
          message={
            pending.type === 'delete'
              ? `Delete ${pending.emp.name}? This cannot be undone.`
              : `${pending.next ? 'Grant' : 'Revoke'} app access for ${pending.emp.name}?`
          }
          confirmLabel={pending.type === 'delete' ? 'Delete' : pending.next ? 'Grant' : 'Revoke'}
          onConfirm={confirm}
          onClose={() => setPending(null)}
        />
      )}
    </div>
  );
}
