import { memo } from 'react';
import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { PlotCell } from './PlotCell';

export const PlotGrid = memo(function PlotGrid({ plots, rates, selectMode, selected, onCellClick }) {
  if (plots.length === 0) {
    return <EmptyState icon={SearchX} title="No plots found" hint="Try changing the filters or search." />;
  }
  return (
    <div className="plot-grid">
      {plots.map((p) => (
        <PlotCell
          key={p.srNo || p.plotNo}
          plot={p}
          rates={rates}
          selectMode={selectMode}
          selected={selected.has(p.srNo)}
          onClick={onCellClick}
        />
      ))}
    </div>
  );
});
