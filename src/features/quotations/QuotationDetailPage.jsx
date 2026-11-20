import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarCheck, FileX, Pencil, Printer, Share2, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { deleteQuotation, getQuotation } from '@/services/quotationService';
import { errorMessage, formatDate, formatDateLong, formatINR, formatNumber } from '@/utils/format';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { QuotationPrint } from './components/QuotationPrint';

const Row = ({ label, value, strong }) => (
  <div className={`amount-row ${strong ? 'strong' : ''}`}><span>{label}</span><b>{formatINR(value)}</b></div>
);
const Info = ({ rows, title }) => (
  <section className="card">
    <h3 className="card-title">{title}</h3>
    {rows.map(([k, v]) => (
      <div className="info-row" key={k}><span>{k}</span><b>{v || '—'}</b></div>
    ))}
  </section>
);

function printFileName(q) {
  const safe = q.customerName.trim().replace(/[^A-Za-z0-9 _-]/g, '') || 'Quotation';
  const d = formatDate(q.quotationDate).replace(/ /g, '');
  return `Quotation_${safe}_${q.plotNumber ? `Plot${q.plotNumber}_` : ''}${d}`;
}

export default function QuotationDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getQuotation(id).then(setQ).catch(() => setQ(null));
  }, [id]);

  if (q === undefined) return <PageLoader />;
  if (!q || (!isAdmin && q.createdByUid !== user.uid)) {
    return (
      <div className="screen">
        <PageHeader title="Quotation Preview" backTo="/quotations" />
        <EmptyState icon={FileX} title="Quotation not found" action={<Link className="btn btn-primary" to="/quotations">Back to list</Link>} />
      </div>
    );
  }

  const print = () => {
    // Browsers use document.title as the default "Save as PDF" file name.
    const prev = document.title;
    document.title = printFileName(q);
    window.print();
    setTimeout(() => { document.title = prev; }, 500);
  };

  const share = async () => {
    const text =
      `Quotation for ${q.customerName}\n${q.projectName} • Plot ${q.plotNumber} (${formatNumber(q.plotSize)} sq ft)\n` +
      `Final total: ${formatINR(q.finalTotalAmount)}`;
    try {
      if (navigator.share) await navigator.share({ title: `Quotation - ${q.customerName}`, text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success('Quotation summary copied to clipboard');
      }
    } catch (e) {
      if (e?.name !== 'AbortError') toast.error(`Share error: ${errorMessage(e)}`);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteQuotation(q.id);
      navigate('/quotations', { replace: true });
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(false);
    }
  };

  const milestones = [
    ['Booking Date', q.bookingDate, 'blue'],
    ['Down Payment Date', q.downPaymentDate, 'green'],
    ['Sale Deed Date', q.saleDeederDate, 'purple'],
  ];

  return (
    <div className="screen">
      <PageHeader
        title="Quotation Preview"
        backTo="/quotations"
        actions={
          <>
            {isAdmin && <Link to={`/quotations/${q.id}/edit`} className="icon-btn light" title="Edit" aria-label="Edit"><Pencil size={20} /></Link>}
            <button className="icon-btn light" onClick={print} title="Print / Download PDF" aria-label="Print"><Printer size={20} /></button>
            <button className="icon-btn light" onClick={share} title="Share" aria-label="Share"><Share2 size={20} /></button>
            {isAdmin && <button className="icon-btn light" onClick={() => setConfirmDelete(true)} title="Delete Quotation" aria-label="Delete"><Trash2 size={20} /></button>}
          </>
        }
      />

      <div className="detail screen-only">
        <section className="detail-hero">
          <small>QUOTATION · {q.id.slice(0, 8).toUpperCase()}</small>
          <h2>{q.customerName}</h2>
          <p>{formatDateLong(q.quotationDate)}</p>
        </section>

        <div className="grid-2">
          <Info title="Customer" rows={[['Name', q.customerName], ['Mobile', q.mobileNumber], ['Address', q.address]]} />
          <Info
            title="Project"
            rows={[
              ['Project', q.projectName],
              ['Plot No.', q.plotNumber],
              ['Plot Size', `${formatNumber(q.plotSize)} sq ft`],
              ['Rate', `${formatINR(q.ratePerSqFt)} / sq ft`],
              ['By', q.createdByName],
            ]}
          />
        </div>

        <section className="card">
          <h3 className="card-title">Plot Amount</h3>
          <Row label="Total Plot Amount" value={q.totalPlotAmount} strong />
          <Row label="Agreement Amount (20%)" value={q.totalPlotAmount * 0.2} />
          <Row label="Booking Amount" value={q.bookingAmount} />
          <Row label="Down Payment" value={q.downPayment} />
          <Row label="Balance Amount" value={q.loanAmount} />
        </section>

        <section className="card">
          <h3 className="card-title"><CalendarCheck size={18} /> Payment Milestone Dates</h3>
          <div className="grid-3">
            {milestones.map(([label, date, tone]) => (
              <div key={label} className={`milestone ${tone} ${date ? '' : 'unset'}`}>
                <small>{label}</small>
                <b>{date ? formatDate(date) : 'Not set'}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3 className="card-title">Stamp Duty &amp; Registration</h3>
          <Row label={`Stamp Duty (${q.stampDutyPercent.toFixed(0)}%)`} value={q.stampDutyAmount} />
          <Row label="Registration" value={q.registrationAmount} />
          <Row label="Sub Total" value={q.stampDutyAmount + q.registrationAmount} strong />
        </section>

        <section className="card">
          <h3 className="card-title">Administrative Charges</h3>
          <Row label="Mutation & 7/12" value={q.mutation} />
          <Row label="Maintenance (3 Years)" value={q.societyCharges} />
          <Row label="Admin Total" value={q.adminTotal} strong />
        </section>

        <div className="grand">
          <div><span>FINAL TOTAL AMOUNT</span><small>All inclusive</small></div>
          <strong>{formatINR(q.finalTotalAmount)}</strong>
        </div>

        <div className="row gap-12">
          <button className="btn btn-primary grow" onClick={print}><Printer size={18} /> Print / PDF</button>
          <button className="btn btn-outline grow" onClick={share}><Share2 size={18} /> Share</button>
        </div>
      </div>

      <QuotationPrint q={q} />

      {confirmDelete && (
        <ConfirmDialog
          danger busy={busy} title="Delete Quotation" confirmLabel="Delete"
          message={`Delete quotation for ${q.customerName}? This cannot be undone.`}
          onConfirm={remove} onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
