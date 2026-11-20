import { LayoutGrid } from 'lucide-react';
import { CATEGORY_COLORS, PLOT_CATEGORIES, PLOT_STATUSES, STATUS_COLORS } from '@/config/constants';
import { formatPrice } from '@/utils/format';

export function StatusStats({ summary }) {
  const rows = [{ label: 'Total', count: summary.total, color: '#3B7BF6' }, ...PLOT_STATUSES.map((s) => ({ label: s, count: summary.byStatus[s], color: STATUS_COLORS[s] }))];
  return (
    <div className="stat-list">
      {rows.map((r) => {
        const pct = summary.total ? (r.count / summary.total) * 100 : 0;
        return (
          <div className="stat-row" key={r.label} style={{ '--c': r.color }}>
            <div className="row between">
              <span className="stat-name">{r.label === 'Total' && <LayoutGrid size={14} />} {r.label}</span>
              <strong>{r.count}</strong>
            </div>
            <div className="bar"><i style={{ width: `${pct}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

export function CategorySummary({ summary, rates }) {
  return (
    <div className="cat-summary">
      <h4>CATEGORY PRICES</h4>
      {PLOT_CATEGORIES.map((c) => {
        const s = summary.cats[c];
        if (!s) return null;
        const rate = rates[c] ?? 0;
        const avg = s.priced ? s.priceSum / s.priced : 0;
        return (
          <div className="cat-card" key={c} style={{ '--c': CATEGORY_COLORS[c] }}>
            <div className="row between">
              <strong className="cat-name">{c}</strong>
              <small className="muted">{s.count} plot{s.count !== 1 ? 's' : ''}</small>
            </div>
            <div className="kv"><span>Rate</span><b>{rate > 0 ? `₹${rate.toFixed(0)} / ft²` : 'not set'}</b></div>
            <div className="kv"><span>Avg price</span><b>{formatPrice(avg)}</b></div>
            <div className="kv"><span>Available value</span><b>{formatPrice(s.availableValue)}</b></div>
          </div>
        );
      })}
    </div>
  );
}

/** Stacked bar + legend showing how plots split across statuses. */
export function StatusDistribution({ summary }) {
  const total = summary.total || 0;
  return (
    <div className="dist">
      <div className="dist-head">
        <div><span className="dist-total">{total}</span><span className="muted"> total plots</span></div>
        <span className="muted small">{summary.byStatus.Available ?? 0} available</span>
      </div>
      <div className="dist-bar" role="img" aria-label="Plot status distribution">
        {PLOT_STATUSES.map((st) => {
          const n = summary.byStatus[st] ?? 0;
          return n ? <i key={st} style={{ width: `${(n / total) * 100}%`, background: STATUS_COLORS[st] }} title={`${st}: ${n}`} /> : null;
        })}
      </div>
      <div className="dist-legend">
        {PLOT_STATUSES.map((st) => (
          <span key={st}><i style={{ background: STATUS_COLORS[st] }} />{st} <b>{summary.byStatus[st] ?? 0}</b></span>
        ))}
      </div>
    </div>
  );
}
