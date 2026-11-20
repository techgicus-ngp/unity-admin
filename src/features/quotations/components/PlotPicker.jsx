import { useState } from 'react';
import { CheckCircle2, MapPin, Search, X } from 'lucide-react';
import { findPlotsByNumber } from '@/services/mapService';
import { errorMessage, formatNumber } from '@/utils/format';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Looks a plot up by number. The same number can exist in several projects,
 * so when more than one matches the user picks the project.
 */
export function PlotPicker({ selected, onSelect, onClear, defaultQuery = '' }) {
  const [query, setQuery] = useState(defaultQuery);
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState(null); // null = not searched yet
  const [error, setError] = useState('');

  const search = async () => {
    if (!query.trim()) return;
    setBusy(true);
    setError('');
    try {
      const hits = await findPlotsByNumber(query);
      setMatches(hits);
      if (hits.length === 1) onSelect(hits[0]);
    } catch (err) {
      setError(`Error searching plot: ${errorMessage(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setQuery('');
    setMatches(null);
    setError('');
    onClear();
  };

  return (
    <div className="plot-picker">
      {/* Not a <form>: this component lives inside the quotation <form>. */}
      <div className="row gap-8">
        <label className="search grow">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), search())}
            placeholder="Enter plot number…"
            inputMode="search"
          />
        </label>
        <button type="button" className="btn btn-primary" onClick={search} disabled={busy || !query.trim()}>
          {busy ? <Spinner size={18} light /> : 'Search'}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}
      {matches && matches.length === 0 && <p className="error-text">Plot “{query}” not found in any map.</p>}

      {matches && matches.length > 1 && !selected && (
        <div className="match-list">
          <p className="muted">Plot {query} exists in {matches.length} projects - choose one:</p>
          {matches.map((m) => (
            <button type="button" key={m.mapId} className="match" onClick={() => onSelect(m)}>
              <MapPin size={16} /> <strong>{m.mapName}</strong>
              <small>{formatNumber(m.plot.areaSqFt)} sq ft · {m.plot.status}</small>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="selected-plot">
          <CheckCircle2 size={20} />
          <div className="grow">
            <strong>Plot {selected.plot.plotNo} · {selected.mapName}</strong>
            <small className="block">{formatNumber(selected.plot.areaSqFt)} sq ft · {selected.plot.category} · {selected.plot.status}</small>
          </div>
          <button type="button" className="icon-btn" onClick={clear} aria-label="Clear plot"><X size={18} /></button>
        </div>
      )}
    </div>
  );
}
