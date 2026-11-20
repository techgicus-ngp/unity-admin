import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { RotateCcw, Save, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { QUOTATION_DEFAULTS } from '@/config/constants';
import { createQuotation, getQuotation, updateQuotation } from '@/services/quotationService';
import { calcQuotation } from '@/utils/quotationCalc';
import { errorMessage, formatINR, fromDateInput, parseNum, toDateInput } from '@/utils/format';
import { PageHeader } from '@/components/layout/PageHeader';
import { Field } from '@/components/ui/Field';
import { PageLoader, Spinner } from '@/components/ui/Spinner';
import { PlotPicker } from './components/PlotPicker';

/** Loads the quotation when editing, then renders the form. */
export default function QuotationFormPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [existing, setExisting] = useState(id ? undefined : null);

  useEffect(() => {
    if (!id) return;
    getQuotation(id).then(setExisting).catch(() => setExisting(null));
  }, [id]);

  if (id && !isAdmin) return <Navigate to={`/quotations/${id}`} replace />;
  if (existing === undefined) return <PageLoader />;
  if (id && !existing) return <Navigate to="/quotations" replace />;
  return <QuotationForm existing={existing} user={user} />;
}

const Section = ({ title, children }) => (
  <section className="card form-section">
    <h3>{title}</h3>
    {children}
  </section>
);

function initialState(e) {
  if (!e) {
    return {
      customerName: '', mobileNumber: '', address: '', projectName: '', plotNumber: '',
      plotSize: '', ratePerSqFt: '',
      bookingAmount: String(QUOTATION_DEFAULTS.bookingAmount),
      stampDutyPercent: String(QUOTATION_DEFAULTS.stampDutyPercent),
      mutation: String(QUOTATION_DEFAULTS.mutation),
      societyCharges: String(QUOTATION_DEFAULTS.societyCharges),
      downPaymentOption: QUOTATION_DEFAULTS.downPaymentOption,
      manualDown: null,
      quotationDate: new Date(), bookingDate: null, downPaymentDate: null, saleDeedDate: null,
    };
  }
  const pct = e.totalPlotAmount > 0 ? Math.round(((e.downPayment + e.bookingAmount) / e.totalPlotAmount) * 100) : 20;
  const option = pct <= 12 ? '10%' : '20%';
  const auto = calcQuotation({
    plotSize: e.plotSize, rate: e.ratePerSqFt, booking: e.bookingAmount,
    stampDutyPercent: e.stampDutyPercent, mutation: e.mutation, societyCharges: e.societyCharges,
    downPaymentOption: option,
  }).autoDownPayment;
  return {
    customerName: e.customerName, mobileNumber: e.mobileNumber, address: e.address,
    projectName: e.projectName, plotNumber: e.plotNumber,
    plotSize: String(e.plotSize), ratePerSqFt: String(e.ratePerSqFt),
    bookingAmount: String(e.bookingAmount), stampDutyPercent: String(e.stampDutyPercent),
    mutation: String(e.mutation), societyCharges: String(e.societyCharges),
    downPaymentOption: option,
    // Keep a hand-edited down payment instead of silently resetting it.
    manualDown: Math.abs(auto - e.downPayment) > 1 ? String(e.downPayment) : null,
    quotationDate: e.quotationDate, bookingDate: e.bookingDate,
    downPaymentDate: e.downPaymentDate, saleDeedDate: e.saleDeederDate,
  };
}

function QuotationForm({ existing, user }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [f, setF] = useState(() => initialState(existing));
  const [plot, setPlot] = useState(null); // { mapId, mapName, plot }
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setDate = (k) => (e) => setF((s) => ({ ...s, [k]: fromDateInput(e.target.value) }));

  const calc = useMemo(
    () =>
      calcQuotation({
        plotSize: f.plotSize,
        rate: f.ratePerSqFt,
        booking: f.bookingAmount,
        stampDutyPercent: f.stampDutyPercent,
        mutation: f.mutation,
        societyCharges: f.societyCharges,
        downPaymentOption: f.downPaymentOption,
        manualDownPayment: f.manualDown === null || f.manualDown === '' ? null : parseNum(f.manualDown),
      }),
    [f.plotSize, f.ratePerSqFt, f.bookingAmount, f.stampDutyPercent, f.mutation, f.societyCharges, f.downPaymentOption, f.manualDown],
  );

  const selectPlot = (m) => {
    setPlot(m);
    setF((s) => ({
      ...s,
      plotNumber: m.plot.plotNo,
      plotSize: String(Math.round(m.plot.areaSqFt)),
      projectName: m.mapName,
    }));
  };

  const clearPlot = () => {
    setPlot(null);
    setF((s) => ({ ...s, plotNumber: '', plotSize: '', projectName: '', manualDown: null }));
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!plot && !existing) {
      toast.error('Please search and select a plot first');
      return;
    }
    setSaving(true);
    try {
      const q = {
        id: existing?.id,
        extra: existing?.extra, // keep fields written by other clients
        customerName: f.customerName.trim(),
        mobileNumber: f.mobileNumber.trim(),
        address: f.address.trim(),
        projectName: f.projectName.trim(),
        plotNumber: f.plotNumber.trim(),
        plotSize: parseNum(f.plotSize),
        ratePerSqFt: parseNum(f.ratePerSqFt),
        totalPlotAmount: calc.totalPlotAmount,
        bookingAmount: parseNum(f.bookingAmount),
        downPayment: calc.downPayment,
        loanAmount: calc.loanAmount,
        stampDutyPercent: parseNum(f.stampDutyPercent, 6),
        stampDutyAmount: calc.stampDutyAmount,
        registrationPercent: 0,
        registrationAmount: calc.registrationAmount,
        mutation: parseNum(f.mutation),
        societyCharges: parseNum(f.societyCharges),
        adminTotal: calc.adminTotal,
        finalTotalAmount: calc.finalTotalAmount,
        downPaymentPercent: existing?.downPaymentPercent ?? 20,
        quotationDate: f.quotationDate ?? new Date(),
        bookingDate: f.bookingDate,
        downPaymentDate: f.downPaymentDate,
        saleDeederDate: f.saleDeedDate,
        createdByUid: existing?.createdByUid ?? user.uid,
        createdByName: existing?.createdByName ?? user.name,
      };
      const id = existing ? (await updateQuotation(existing.id, q), existing.id) : await createQuotation(q);
      navigate(`/quotations/${id}`, { replace: true });
    } catch (e) {
      toast.error(`Error saving: ${errorMessage(e)}`);
      setSaving(false);
    }
  };

  const plotLocked = !!plot;
  const isManual = f.manualDown !== null;

  return (
    <div className="screen">
      <PageHeader
        title={existing ? 'Edit Quotation' : 'New Quotation'}
        actions={
          <button form="quotation-form" className="btn btn-light" disabled={saving}>
            {saving ? <Spinner size={18} /> : <Save size={18} />} {saving ? 'Saving…' : 'Save'}
          </button>
        }
      />

      <form id="quotation-form" className="form-page" onSubmit={submit}>
        <Section title="Plot">
          <PlotPicker selected={plot} onSelect={selectPlot} onClear={clearPlot} defaultQuery={existing?.plotNumber ?? ''} />
        </Section>

        <Section title="Customer Details">
          <Field label="Customer Name"><input value={f.customerName} onChange={set('customerName')} required /></Field>
          <Field label="Mobile Number"><input value={f.mobileNumber} onChange={set('mobileNumber')} inputMode="tel" required /></Field>
          <Field label="Address"><textarea rows={2} value={f.address} onChange={set('address')} /></Field>
        </Section>

        <Section title="Project Details">
          <Field label="Project Name"><input value={f.projectName} onChange={set('projectName')} readOnly={plotLocked} required /></Field>
          <div className="grid-2">
            <Field label="Plot Number"><input value={f.plotNumber} onChange={set('plotNumber')} readOnly={plotLocked} required /></Field>
            <Field label="Quotation Date">
              <input type="date" value={toDateInput(f.quotationDate)} onChange={setDate('quotationDate')} required />
            </Field>
          </div>
        </Section>

        <Section title="Plot Amount">
          <div className="grid-2">
            <Field label="Plot Size (sq ft)"><input type="number" min="0" step="any" value={f.plotSize} onChange={set('plotSize')} readOnly={plotLocked} required /></Field>
            <Field label="Rate / sq ft"><input type="number" min="0" step="any" value={f.ratePerSqFt} onChange={set('ratePerSqFt')} required /></Field>
          </div>
          <Field label="Total Plot Amount"><input className="auto" value={formatINR(calc.totalPlotAmount)} readOnly /></Field>
          <Field label="Agreement Amount (20% of Plot Amount)"><input className="auto" value={formatINR(calc.agreementAmount)} readOnly /></Field>

          <div className="grid-2">
            <Field label="Booking Amount">
              <input type="number" min="0" step="any" value={f.bookingAmount} onChange={set('bookingAmount')} />
            </Field>
            <Field label="Down Payment %">
              <select value={f.downPaymentOption} onChange={(e) => setF((s) => ({ ...s, downPaymentOption: e.target.value, manualDown: null }))}>
                <option value="10%">Down Payment 10%</option>
                <option value="20%">Down Payment 20%</option>
              </select>
            </Field>
          </div>

          <Field label={`Down Payment (${f.downPaymentOption} of Total − Booking — editable)`}>
            <div className="input-affix">
              <input
                className="auto-green"
                type="number" min="0" step="any"
                value={isManual ? f.manualDown : calc.downPayment}
                onChange={(e) => setF((s) => ({ ...s, manualDown: e.target.value }))}
              />
              {isManual ? (
                <button type="button" className="icon-btn" title={`Reset to ${f.downPaymentOption} auto`} onClick={() => setF((s) => ({ ...s, manualDown: null }))}>
                  <RotateCcw size={16} />
                </button>
              ) : (
                <span className="icon-btn" title="Auto-calculated — type to override"><Sparkles size={14} /></span>
              )}
            </div>
          </Field>
          <Field label="Balance Amount"><input className="auto" value={formatINR(calc.loanAmount)} readOnly /></Field>
        </Section>

        <Section title="Payment Milestone Dates">
          <div className="grid-3">
            <Field label="Booking Date"><input type="date" value={toDateInput(f.bookingDate)} onChange={setDate('bookingDate')} /></Field>
            <Field label="Down Payment Date"><input type="date" value={toDateInput(f.downPaymentDate)} onChange={setDate('downPaymentDate')} /></Field>
            <Field label="Sale Deed Date"><input type="date" value={toDateInput(f.saleDeedDate)} onChange={setDate('saleDeedDate')} /></Field>
          </div>
        </Section>

        <Section title="Stamp Duty & Registration">
          <div className="grid-2">
            <Field label="Stamp Duty %"><input type="number" min="0" step="any" value={f.stampDutyPercent} onChange={set('stampDutyPercent')} /></Field>
            <Field label="Stamp Duty Amount"><input className="auto" value={formatINR(calc.stampDutyAmount)} readOnly /></Field>
          </div>
          <Field label="Registration Amount (1% if ≤ ₹30L, else ₹30,000)"><input className="auto" value={formatINR(calc.registrationAmount)} readOnly /></Field>
        </Section>

        <Section title="Administrative Charges">
          <div className="grid-2">
            <Field label="Mutation & 7/12"><input type="number" min="0" step="any" value={f.mutation} onChange={set('mutation')} /></Field>
            <Field label="Maintenance (3 Years)"><input type="number" min="0" step="any" value={f.societyCharges} onChange={set('societyCharges')} /></Field>
          </div>
          <Field label="Admin Total"><input className="auto" value={formatINR(calc.adminTotal)} readOnly /></Field>
        </Section>

        <div className="grand">
          <span>FINAL TOTAL AMOUNT</span>
          <strong>{formatINR(calc.finalTotalAmount)}</strong>
        </div>
      </form>
    </div>
  );
}
