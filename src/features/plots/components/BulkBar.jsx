import { PLOT_CATEGORIES, PLOT_STATUSES, STATUS_COLORS } from '@/config/constants';
import { IndianRupee } from 'lucide-react';

export function BulkBar({ count, total, busy, onSelectAll, onClear, onStatus, onCategory, onPrice, onDone }) {
  const disabled = busy || count === 0;
  return (
    <div className="bulk-bar">
      <strong>{count} selected</strong>
      <button className="btn btn-ghost btn-sm" onClick={onSelectAll}>Select all ({total})</button>
      <button className="btn btn-ghost btn-sm" onClick={onClear} disabled={count === 0}>Clear</button>

      <div className="bulk-group">
        <span className="muted">Mark as:</span>
        {PLOT_STATUSES.map((s) => (
          <button key={s} className="fchip active" style={{ '--c': STATUS_COLORS[s] }} disabled={disabled} onClick={() => onStatus(s)}>{s}</button>
        ))}
      </div>

      <label className="bulk-group">
        <span className="muted">Set Category</span>
        <select className="select-sm" disabled={disabled} value="" onChange={(e) => e.target.value && onCategory(e.target.value)}>
          <option value="">Choose…</option>
          {PLOT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>

      <button className="btn btn-outline btn-sm" disabled={disabled} onClick={onPrice}><IndianRupee size={14} /> Set Price</button>
      <span className="grow" />
      <button className="btn btn-primary btn-sm" onClick={onDone}>Done</button>
    </div>
  );
}
