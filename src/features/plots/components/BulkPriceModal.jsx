import { useState } from 'react';
import { CATEGORY_COLORS, PLOT_CATEGORIES } from '@/config/constants';
import { parseNum } from '@/utils/format';
import { Modal } from '@/components/ui/Modal';

const MODES = { rate: 'By category rate', sqft: '₹ per ft²', total: 'Fixed price' };

export function BulkPriceModal({ count, rates, onApply, onClose }) {
  const hasRates = Object.values(rates).some((v) => v > 0);
  const [mode, setMode] = useState(hasRates ? 'rate' : 'sqft');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const apply = () => {
    if (mode === 'rate') {
      if (!hasRates) return setError('No category rates set. Use the ₹ Rates button first.');
      return onApply('rate', 0);
    }
    const v = parseNum(value);
    if (v <= 0) return setError('Enter a valid amount');
    return onApply(mode, v);
  };

  return (
    <Modal
      title={`Set Price · ${count} plot${count !== 1 ? 's' : ''}`}
      onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={apply}>Apply</button></>}
    >
      <div className="chip-row">
        {Object.entries(MODES).map(([k, label]) => (
          <button key={k} type="button" className={`fchip ${mode === k ? 'active' : ''}`} onClick={() => { setMode(k); setError(''); }}>{label}</button>
        ))}
      </div>

      {mode === 'rate' ? (
        <div className="stack-8">
          <p className="muted">Each selected plot gets: its category rate × its area (ft²).</p>
          {PLOT_CATEGORIES.map((c) => (
            <div className="kv" key={c}>
              <b style={{ color: CATEGORY_COLORS[c] }}>{c}</b>
              <span>{(rates[c] ?? 0) > 0 ? `₹${rates[c].toFixed(0)} / ft²` : 'not set'}</span>
            </div>
          ))}
        </div>
      ) : (
        <label className="field">
          <span className="field-label">{mode === 'sqft' ? 'Rate (₹ per ft²)' : 'Price for each plot (₹)'}</span>
          <input
            type="number" min="0" step="any" autoFocus value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
          />
        </label>
      )}
      {error && <p className="error-text">{error}</p>}
    </Modal>
  );
}
