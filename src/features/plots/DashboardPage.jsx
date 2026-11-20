import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckSquare, IndianRupee, Image as ImageIcon, Map as MapIcon, Pencil, Power } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { filterAndSortPlots, isHiddenType, summarisePlots } from '@/utils/plot';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageLoader, Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMapDashboard } from './hooks/useMapDashboard';
import { FilterBar } from './components/FilterBar';
import { PlotGrid } from './components/PlotGrid';
import { CategorySummary, StatusDistribution } from './components/StatsPanel';
import { BulkBar } from './components/BulkBar';
import { PlotEditModal } from './components/PlotEditModal';
import { BulkPriceModal } from './components/BulkPriceModal';
import { CategoryRatesModal } from './components/CategoryRatesModal';
import { MapSelectorModal } from './components/MapSelectorModal';
import { RenameMapModal } from './components/RenameMapModal';

const DEFAULT_FILTERS = { search: '', status: 'All', category: 'All', sortBy: 'plotNo' };

export default function DashboardPage() {
  const toast = useToast();
  const isDesktop = useIsDesktop();
  const [params, setParams] = useSearchParams();
  const mapId = params.get('map') || '';

  const dash = useMapDashboard(mapId);
  const { map, loading, busy } = dash;

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search, 150);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [dialog, setDialog] = useState(null); // 'maps' | 'rates' | 'rename' | 'toggle' | 'bulkPrice'
  const [editing, setEditing] = useState(null);

  const rates = map?.categoryRates ?? {};
  const plots = map?.plots;

  const visible = useMemo(() => (plots ?? []).filter((p) => !isHiddenType(p)), [plots]);
  const summary = useMemo(() => summarisePlots(visible, rates), [visible, rates]);
  const filtered = useMemo(
    () => filterAndSortPlots(plots ?? [], { ...filters, search: debouncedSearch, rates }),
    [plots, filters.status, filters.category, filters.sortBy, debouncedSearch, rates], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const hasFilters = !!(filters.search || filters.status !== 'All' || filters.category !== 'All');

  const resetSelection = () => { setSelectMode(false); setSelected(new Set()); };

  const chooseMap = (m) => {
    setDialog(null);
    resetSelection();
    setFilters(DEFAULT_FILTERS);
    setParams({ map: m.id });
  };

  const enabled = map?.isEnabled ?? true;

  const onCellClick = useCallback(
    (plot) => {
      if (!enabled) return toast.error('Enable the map first to edit plots');
      if (selectMode) {
        setSelected((s) => {
          const n = new Set(s);
          if (!n.delete(plot.srNo)) n.add(plot.srNo);
          return n;
        });
      } else {
        setEditing(plot);
      }
    },
    [enabled, selectMode, toast],
  );

  const toggleSelectMode = () => {
    if (!enabled) return toast.error('Enable the map first to edit plots');
    setSelectMode((m) => !m);
    setSelected(new Set());
  };

  const requestToggleEnabled = async () => {
    if (enabled) return setDialog('toggle'); // confirm before disabling
    await dash.toggleEnabled();
  };

  const confirmDisable = async () => {
    setDialog(null);
    if (await dash.toggleEnabled()) resetSelection();
  };

  const afterBulk = (ok) => ok && setSelected(new Set());

  return (
    <div className="screen plots-screen">
      <PageHeader
        backTo="/overview"
        title={map ? map.name : 'Plot Dashboard'}
        subtitle={map ? `${summary.total} plots${enabled ? '' : ' · disabled'}` : 'Select a map'}
        actions={
          <>
            <button className="icon-btn light" onClick={() => setDialog('maps')} title="Select map" aria-label="Select map"><MapIcon size={20} /></button>
            {map && (
              <>
                <button className="icon-btn light" onClick={() => setDialog('rates')} title="Category rates" aria-label="Category rates"><IndianRupee size={20} /></button>
                <button className="icon-btn light" onClick={() => setDialog('rename')} title="Rename map" aria-label="Rename map"><Pencil size={20} /></button>
                <Link className="icon-btn light" to={`/layouts/${map.id}/gallery`} title="Gallery" aria-label="Gallery"><ImageIcon size={20} /></Link>
                <button className={`icon-btn light ${selectMode ? 'on' : ''}`} onClick={toggleSelectMode} title="Select plots" aria-label="Select plots" aria-pressed={selectMode}><CheckSquare size={20} /></button>
                <button className={`icon-btn light ${enabled ? '' : 'off'}`} onClick={requestToggleEnabled} disabled={busy} title={enabled ? 'Disable map' : 'Enable map'} aria-label={enabled ? 'Disable map' : 'Enable map'}>
                  {busy ? <Spinner size={18} light /> : <Power size={20} />}
                </button>
              </>
            )}
          </>
        }
      />

      {loading ? (
        <PageLoader label="Loading map…" />
      ) : !map ? (
        <EmptyState icon={MapIcon} title="No map selected" hint="Pick a map to manage its plots." action={<button className="btn btn-primary" onClick={() => setDialog('maps')}>Select Map</button>} />
      ) : (
        <div className={`plots-layout ${isDesktop ? 'desktop' : ''}`}>
          <main className="plots-main">
            {!enabled && (
              <div className="banner-disabled">
                <span><b>“{map.name}”</b> is currently disabled. Plots are read-only.</span>
                <button className="btn btn-sm btn-primary" onClick={requestToggleEnabled} disabled={busy}>Enable Now</button>
              </div>
            )}

            <StatusDistribution summary={summary} />

            <FilterBar
              filters={filters} setFilters={setFilters} hasFilters={hasFilters}
              resultCount={filtered.length} onClear={() => setFilters(DEFAULT_FILTERS)}
            />

            {selectMode && (
              <BulkBar
                count={selected.size} total={filtered.length} busy={busy}
                onSelectAll={() => setSelected(new Set(filtered.map((p) => p.srNo)))}
                onClear={() => setSelected(new Set())}
                onStatus={async (s) => afterBulk(await dash.bulkStatus(selected, s))}
                onCategory={async (c) => afterBulk(await dash.bulkCategory(selected, c))}
                onPrice={() => setDialog('bulkPrice')}
                onDone={resetSelection}
              />
            )}

            <PlotGrid plots={filtered} rates={rates} selectMode={selectMode} selected={selected} onCellClick={onCellClick} />
          </main>

          {isDesktop && (
            <aside className="plots-aside">
              <CategorySummary summary={summary} rates={rates} />
            </aside>
          )}
          {!isDesktop && <div className="plots-aside-mobile"><CategorySummary summary={summary} rates={rates} /></div>}
        </div>
      )}

      {dialog === 'maps' && <MapSelectorModal currentId={map?.id} onSelect={chooseMap} onClose={() => setDialog(null)} />}
      {dialog === 'rename' && (
        <RenameMapModal currentName={map.name} onClose={() => setDialog(null)} onSubmit={async (n) => { setDialog(null); await dash.rename(n); }} />
      )}
      {dialog === 'rates' && (
        <CategoryRatesModal rates={rates} onClose={() => setDialog(null)} onSave={async (r, apply) => { setDialog(null); await dash.saveRates(r, apply); }} />
      )}
      {dialog === 'bulkPrice' && (
        <BulkPriceModal
          count={selected.size} rates={rates} onClose={() => setDialog(null)}
          onApply={async (mode, value) => { setDialog(null); afterBulk(await dash.bulkPrice(selected, mode, value)); }}
        />
      )}
      {dialog === 'toggle' && (
        <ConfirmDialog
          danger title="Disable map?" confirmLabel="Disable"
          message={`Disabling “${map.name}” makes all its plots read-only. You can enable it again at any time.`}
          onConfirm={confirmDisable} onClose={() => setDialog(null)}
        />
      )}
      {editing && (
        <PlotEditModal plot={editing} rates={rates} onClose={() => setEditing(null)} onSave={(p) => dash.updatePlot(p)} />
      )}
    </div>
  );
}
