import { X } from 'lucide-react';
import { PLOT_CATEGORIES, PLOT_SORTS, PLOT_STATUSES, STATUS_COLORS, CATEGORY_COLORS } from '@/config/constants';
import { SearchInput } from '@/components/ui/SearchInput';

const Chip = ({ active, color, onClick, children }) => (
  <button type="button" className={`fchip ${active ? 'active' : ''}`} style={{ '--c': color }} onClick={onClick}>
    {children}
  </button>
);

export function FilterBar({ filters, setFilters, resultCount, hasFilters, onClear }) {
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  return (
    <div className="filter-bar">
      <div className="row gap-8 wrap">
        <SearchInput className="grow" value={filters.search} onChange={set('search')} placeholder="Search plot number…" />
        <select className="select-sm" value={filters.sortBy} onChange={(e) => set('sortBy')(e.target.value)} aria-label="Sort plots">
          {PLOT_SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="chip-row" aria-label="Filter by status">
        {['All', ...PLOT_STATUSES].map((s) => (
          <Chip key={s} active={filters.status === s} color={STATUS_COLORS[s] ?? '#3B7BF6'} onClick={() => set('status')(s)}>{s}</Chip>
        ))}
      </div>
      <div className="chip-row" aria-label="Filter by category">
        {['All', ...PLOT_CATEGORIES].map((c) => (
          <Chip key={c} active={filters.category === c} color={CATEGORY_COLORS[c] ?? '#3B7BF6'} onClick={() => set('category')(c)}>{c}</Chip>
        ))}
        <span className="grow" />
        <span className="muted results">{resultCount} plot{resultCount !== 1 ? 's' : ''}</span>
        {hasFilters && <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}><X size={14} /> Clear</button>}
      </div>
    </div>
  );
}
