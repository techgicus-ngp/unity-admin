import { memo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, IndianRupee, Ruler, User } from 'lucide-react';
import { formatDate, formatINR, formatNumber } from '@/utils/format';

const Chip = ({ icon: Icon, children }) => (
  <span className="chip"><Icon size={12} />{children}</span>
);

export const QuotationCard = memo(function QuotationCard({ quotation: q, showCreator }) {
  return (
    <Link to={`/quotations/${q.id}`} className="q-card">
      <div className="row gap-12">
        <span className="q-icon"><FileText size={22} /></span>
        <div className="grow">
          <strong>{q.customerName}</strong>
          <small className="block muted">{q.projectName} • Plot {q.plotNumber}</small>
        </div>
        <div className="right">
          <strong className="text-primary">{formatINR(q.finalTotalAmount)}</strong>
          <small className="block muted">{formatDate(q.quotationDate)}</small>
        </div>
      </div>
      <hr />
      <div className="row gap-8">
        <Chip icon={Ruler}>{formatNumber(q.plotSize)} sq ft</Chip>
        <Chip icon={IndianRupee}>{formatNumber(q.ratePerSqFt)}/sq ft</Chip>
        {showCreator && <span className="chip push-right"><User size={12} />{q.createdByName}</span>}
      </div>
    </Link>
  );
});
