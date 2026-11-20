import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, FileText, IndianRupee, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { subscribeAllQuotations, subscribeEmployeeQuotations } from '@/services/quotationService';
import { useSubscription } from '@/hooks/useSubscription';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatINR } from '@/utils/format';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { QuotationCard } from './components/QuotationCard';

/** Admins see every quotation; employees / guests see only their own. */
export default function QuotationListPage() {
  const { user, isAdmin } = useAuth();
  const { data, loading, error } = useSubscription(
    (onData, onError) =>
      isAdmin ? subscribeAllQuotations(onData, onError) : subscribeEmployeeQuotations(user.uid, onData, onError),
    [isAdmin, user.uid],
  );
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search).trim().toLowerCase();

  const list = useMemo(() => {
    if (!data) return [];
    if (!q) return data;
    return data.filter(
      (x) =>
        x.customerName.toLowerCase().includes(q) ||
        x.plotNumber.toLowerCase().includes(q) ||
        x.projectName.toLowerCase().includes(q) ||
        x.createdByName.toLowerCase().includes(q),
    );
  }, [data, q]);

  const totalValue = useMemo(() => (data ?? []).reduce((s, x) => s + x.finalTotalAmount, 0), [data]);

  return (
    <div className="page">
      <div className="row between">
        <h1 className="page-title">{isAdmin ? 'All Quotations' : 'My Quotations'}</h1>
        <Link to="/quotations/new" className="btn btn-primary"><Plus size={18} /> New Quotation</Link>
      </div>

      {!isAdmin && (
        <div className="pill-row">
          <div className="pill"><FileText size={18} /><div><small>Quotations</small><strong>{data?.length ?? 0}</strong></div></div>
          <div className="pill"><IndianRupee size={18} /><div><small>Total Value</small><strong>{formatINR(totalValue)}</strong></div></div>
        </div>
      )}

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={isAdmin ? 'Search by customer, plot, project or employee…' : 'Search quotations…'}
      />

      {loading ? (
        <PageLoader />
      ) : error ? (
        <p className="error-text">Error: {error.message}</p>
      ) : list.length === 0 ? (
        <EmptyState
          icon={FilePlus2}
          title={q ? 'No quotations match your search' : 'No quotations yet'}
          hint={q ? undefined : 'Create your first quotation to see it here.'}
        />
      ) : (
        <div className="q-list">
          {list.map((x) => <QuotationCard key={x.id} quotation={x} showCreator={isAdmin} />)}
        </div>
      )}
    </div>
  );
}
