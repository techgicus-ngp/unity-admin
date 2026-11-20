import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { FACINGS, PLOT_CATEGORIES, PLOT_STATUSES } from '@/config/constants';
import { formatINR, parseNum } from '@/utils/format';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';

const titleCase = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

export function PlotEditModal({ plot, rates, onSave, onClose }) {
  const isPlot = plot.type === 'plot';
  const [f, setF] = useState({
    srNo: plot.srNo,
    plotNo: plot.plotNo,
    title: plot.title,
    status: plot.status,
    facing: plot.facing,
    category: plot.category,
    area: plot.area.toFixed(2),
    areaSqFt: plot.areaSqFt.toFixed(2),
    dimensions: plot.dimensions,
    price: plot.price === 0 ? '' : String(plot.price),
    ownerName: plot.ownerName,
    contactPhone: plot.contactPhone,
    contactEmail: plot.contactEmail,
    notes: plot.notes,
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  // Keep an unknown / legacy status (e.g. "Reserved") selectable.
  const statuses = PLOT_STATUSES.includes(f.status) ? PLOT_STATUSES : [...PLOT_STATUSES, f.status];
  const rate = rates[f.category] ?? 0;
  const sqft = parseNum(f.areaSqFt, plot.areaSqFt);
  const categoryPrice = rate > 0 ? Math.round(rate * sqft) : 0;

  const save = async () => {
    setSaving(true);
    const ok = await onSave({
      ...plot,
      srNo: f.srNo.trim(),
      plotNo: f.plotNo.trim(),
      title: f.title.trim(),
      status: f.status,
      facing: f.facing,
      category: f.category,
      area: parseNum(f.area, plot.area),
      areaSqFt: sqft,
      dimensions: f.dimensions.trim(),
      price: parseNum(f.price), // empty => 0 => plot follows the category price
      ownerName: f.ownerName.trim(),
      contactPhone: f.contactPhone.trim(),
      contactEmail: f.contactEmail.trim(),
      notes: f.notes.trim(),
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal
      sheet width={640}
      title={`Edit ${titleCase(plot.type)}${isPlot ? ` · ${plot.plotNo}` : plot.title ? ` · ${plot.title}` : ''}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </>
      }
    >
      <div className="form-grid">
        <h4>Basic Information</h4>
        <Field label="Sr. No"><input value={f.srNo} onChange={set('srNo')} /></Field>
        {isPlot
          ? <Field label="Plot No"><input value={f.plotNo} onChange={set('plotNo')} /></Field>
          : <Field label="Title"><input value={f.title} onChange={set('title')} /></Field>}

        {isPlot && (
          <>
            <h4>Status &amp; Facing</h4>
            <Field label="Status">
              <select value={f.status} onChange={set('status')}>{statuses.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
            <Field label="Facing">
              <select value={f.facing} onChange={set('facing')}>{FACINGS.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
            <Field label="Plot Category" className="span-2">
              <select value={f.category} onChange={set('category')}>{PLOT_CATEGORIES.map((s) => <option key={s}>{s}</option>)}</select>
            </Field>
          </>
        )}

        <h4>Measurements</h4>
        <Field label="Area (m²)"><input type="number" step="any" value={f.area} onChange={set('area')} /></Field>
        <Field label="Area (ft²)"><input type="number" step="any" value={f.areaSqFt} onChange={set('areaSqFt')} /></Field>
        <Field label="Dimensions" className="span-2"><input value={f.dimensions} onChange={set('dimensions')} placeholder="e.g. 30 × 50 ft" /></Field>

        {isPlot && (
          <>
            <h4>Pricing</h4>
            <Field
              label="Price (₹)"
              className="span-2"
              hint={
                categoryPrice > 0
                  ? `Leave empty to follow the ${f.category} rate: ₹${rate.toFixed(0)}/ft² × ${Math.round(sqft)} ft² = ${formatINR(categoryPrice)}`
                  : `No ${f.category} rate set - price stays empty until you enter one.`
              }
            >
              <div className="input-affix">
                <input type="number" min="0" step="any" value={f.price} onChange={set('price')} placeholder="Follows category price" />
                {categoryPrice > 0 && (
                  <button type="button" className="icon-btn" title="Use category price" onClick={() => setF((s) => ({ ...s, price: String(categoryPrice) }))}>
                    <Wand2 size={16} />
                  </button>
                )}
              </div>
            </Field>

            <h4>Owner Information</h4>
            <Field label="Owner Name"><input value={f.ownerName} onChange={set('ownerName')} /></Field>
            <Field label="Phone"><input value={f.contactPhone} onChange={set('contactPhone')} inputMode="tel" /></Field>
            <Field label="Email" className="span-2"><input type="email" value={f.contactEmail} onChange={set('contactEmail')} /></Field>
          </>
        )}

        <Field label="Notes" className="span-2"><textarea rows={3} value={f.notes} onChange={set('notes')} /></Field>
      </div>
    </Modal>
  );
}
