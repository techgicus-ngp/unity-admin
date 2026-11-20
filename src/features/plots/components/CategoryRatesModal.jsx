import { useState } from 'react';
import { PLOT_CATEGORIES } from '@/config/constants';
import { parseNum } from '@/utils/format';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';

export function CategoryRatesModal({ rates, onSave, onClose }) {
  const [vals, setVals] = useState(() =>
    Object.fromEntries(PLOT_CATEGORIES.map((c) => [c, (rates[c] ?? 0) > 0 ? String(rates[c]) : ''])),
  );
  const read = () => Object.fromEntries(PLOT_CATEGORIES.map((c) => [c, parseNum(vals[c])]));

  return (
    <Modal
      title="Category Rates"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-outline" onClick={() => onSave(read(), false)}>Save only</button>
          <button className="btn btn-primary" onClick={() => onSave(read(), true)}>Save &amp; apply</button>
        </>
      }
    >
      <p className="muted">Set price per ft² for each category. Plot price = rate × plot area (ft²).</p>
      {PLOT_CATEGORIES.map((c) => (
        <Field key={c} label={`${c} (₹ / ft²)`}>
          <input type="number" min="0" step="any" value={vals[c]} onChange={(e) => setVals((v) => ({ ...v, [c]: e.target.value }))} />
        </Field>
      ))}
      <p className="muted small">
        Plots with no price of their own automatically show their category price (rate × area). “Save only” keeps it that way.
        “Save &amp; apply” writes the category price onto all Available / Booked plots; plots at Token, Part Payment, Agreement or Sold stage are not changed.
      </p>
    </Modal>
  );
}
