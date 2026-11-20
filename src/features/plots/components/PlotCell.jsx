import { memo } from 'react';
import { Check } from 'lucide-react';
import { CATEGORY_COLORS, CATEGORY_SHORT, STATUS_COLORS } from '@/config/constants';
import { formatPrice } from '@/utils/format';
import { effectivePrice, isCategoryPrice } from '@/utils/plot';

export const PlotCell = memo(function PlotCell({ plot, rates, selectMode, selected, onClick }) {
  const color = STATUS_COLORS[plot.status] ?? STATUS_COLORS.Available;
  const price = effectivePrice(plot, rates);
  const fromCat = isCategoryPrice(plot, rates);
  const catColor = CATEGORY_COLORS[plot.category];

  return (
    <button
      type="button"
      className={`plot-cell ${selected ? 'selected' : ''} ${plot.status === 'Sold' ? 'sold' : ''}`}
      style={{ '--s': color, '--k': catColor }}
      onClick={() => onClick(plot)}
      title={`Plot ${plot.plotNo} · ${plot.status} · ${plot.category} · ${fromCat ? '~' : ''}${formatPrice(price)}${fromCat ? ' (category rate)' : ''}`}
      aria-pressed={selectMode ? selected : undefined}
    >
      {selectMode && <span className="plot-check">{selected && <Check size={12} strokeWidth={3} />}</span>}
      <span className="plot-top">
        <span className="plot-dot" />
        <span className="plot-cat">{CATEGORY_SHORT[plot.category]}</span>
      </span>
      <span className="plot-no">{plot.plotNo}</span>
      <span className="plot-price">{fromCat ? '~' : ''}{formatPrice(price)}</span>
      <span className="plot-status">{plot.status}</span>
    </button>
  );
});
