import { Search, X } from 'lucide-react';

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <label className={`search ${className}`}>
      <Search size={18} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && (
        <button type="button" className="icon-btn" onClick={() => onChange('')} aria-label="Clear search">
          <X size={16} />
        </button>
      )}
    </label>
  );
}
