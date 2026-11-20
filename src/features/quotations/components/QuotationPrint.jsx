import { env } from '@/config/env';
import { formatDate, formatINR2, formatNumber } from '@/utils/format';

const TERMS = [
  'If your accounts do not tally with our records please contact our office immediately.',
  'Please mention customer name, project name, plot no. & payment details behind your cheque or DD.',
  'Taxes as applicable by Govt. Cheque bounce charges will be applicable.',
  'In case of booking cancellation, the booking amount will be refunded within 15–30 days from the date of cancellation.',
];

const Kv = ({ k, v }) => (
  <div className="p-kv"><span>{k}</span><b>:</b><span>{v || '—'}</span></div>
);

const Table = ({ title, rows }) => (
  <>
    <div className="p-bar">{title}</div>
    <table className="p-table">
      <thead><tr><th>Description</th><th className="r">Amount</th></tr></thead>
      <tbody>
        {rows.map(([label, value, sub, strong]) => (
          <tr key={label} className={strong ? 'strong' : ''}>
            <td>{label}{sub && <small>{sub}</small>}</td>
            <td className="r">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
);

/**
 * A4 quotation, rendered only for printing (see `.print-only` in the CSS).
 * Using the browser's print engine means Marathi / Hindi text renders correctly
 * and "Save as PDF" works everywhere with no PDF library in the bundle.
 */
export function QuotationPrint({ q }) {
  const agreementPct = q.downPaymentPercent > 0 ? q.downPaymentPercent : 20;
  const agreementAmt = (q.totalPlotAmount * agreementPct) / 100;
  const stampReg = q.stampDutyAmount + q.registrationAmount;

  return (
    <div className="print-only quotation-print">
      <header className="p-head">
        <div className="row gap-12">
          <img src="/logo_icon.png" alt="" />
          <div>
            <h1>{env.companyName.toUpperCase()}</h1>
            <p>{env.companyTagline}</p>
          </div>
        </div>
        <div className="right">
          <div className="p-title">QUOTATION</div>
          <p>Date: {formatDate(q.quotationDate)}</p>
          <p>Ref: {q.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </header>

      <div className="p-cols">
        <div>
          <div className="p-sub">Customer Details</div>
          <Kv k="Name" v={q.customerName} />
          <Kv k="Mobile" v={q.mobileNumber} />
          <Kv k="Address" v={q.address} />
        </div>
        <div>
          <div className="p-sub">Project Details</div>
          <Kv k="Project" v={q.projectName} />
          <Kv k="Plot No." v={q.plotNumber} />
          <Kv k="Plot Size" v={`${formatNumber(q.plotSize)} sq ft`} />
          <Kv k="Rate" v={`${formatINR2(q.ratePerSqFt)} / sq ft`} />
          <Kv k="Prepared by" v={q.createdByName} />
        </div>
      </div>

      <div className="p-milestones">
        <div><span>Booking Date</span><b>{formatDate(q.bookingDate)}</b></div>
        <div><span>Down Payment Date</span><b>{formatDate(q.downPaymentDate)}</b></div>
        <div><span>Sale Deed Date</span><b>{formatDate(q.saleDeederDate)}</b></div>
      </div>

      <Table
        title="1. Plot Amount"
        rows={[
          ['Total Plot Amount', formatINR2(q.totalPlotAmount), `${formatNumber(q.plotSize)} sq ft × ${formatINR2(q.ratePerSqFt)}`],
          ['Booking', formatINR2(q.bookingAmount)],
          [`Agreement (${agreementPct.toFixed(0)}%)`, formatINR2(agreementAmt)],
          ['Remaining', formatINR2(q.totalPlotAmount - agreementAmt)],
        ]}
      />
      <Table
        title="2. Stamp Duty & Registration"
        rows={[
          [`Stamp Duty (${q.stampDutyPercent.toFixed(0)}%)`, formatINR2(q.stampDutyAmount)],
          ['Registration', formatINR2(q.registrationAmount)],
          ['Stamp + Reg Total', formatINR2(stampReg), null, true],
        ]}
      />
      <Table
        title="3. Administrative Charges"
        rows={[
          ['Legal & 7/12', formatINR2(q.mutation)],
          ['Maintenance (3 Years)', formatINR2(q.societyCharges)],
          ['Admin Total', formatINR2(q.adminTotal), null, true],
        ]}
      />
      <Table
        title="Payment Summary"
        rows={[
          ['Plot Amount', formatINR2(q.totalPlotAmount)],
          ['Stamp + Reg', formatINR2(stampReg)],
          ['Admin Charges', formatINR2(q.adminTotal)],
          ['GRAND TOTAL', formatINR2(q.finalTotalAmount), null, true],
        ]}
      />

      <div className="p-final"><span>FINAL TOTAL AMOUNT</span><b>{formatINR2(q.finalTotalAmount)}</b></div>

      <div className="p-terms">
        <b>TERMS &amp; CONDITIONS</b>
        <ol>{TERMS.map((t) => <li key={t}>{t}</li>)}</ol>
      </div>

      <div className="p-sign">
        <div><span />Customer Signature</div>
        <p>This is a computer-generated quotation.<br />All amounts are in Indian Rupees (₹)</p>
        <div><span />Authorized Signature</div>
      </div>
    </div>
  );
}
