import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import {
  fetchDefaultMap, fetchMap, renameMap, saveCategoryRates, savePlots, setMapEnabled,
} from '@/services/mapService';
import { errorMessage } from '@/utils/format';
import { isHiddenType, isPriceLocked } from '@/utils/plot';

const plural = (n, w) => `${n} ${w}${n !== 1 ? 's' : ''}`;

/**
 * All server-facing state for the layout dashboard: the loaded map, and every
 * mutation (single edit, bulk edit, rates, enable / rename).
 */
export function useMapDashboard(mapId) {
  const toast = useToast();
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const mapRef = useRef(null);
  mapRef.current = map;

  // ── Load ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    setLoading(true);
    (mapId ? fetchMap(mapId) : fetchDefaultMap())
      .then((m) => {
        if (!alive) return;
        setMap(m);
        if (!m) toast.error('Map not found');
      })
      .catch((e) => alive && toast.error(`Error loading map: ${errorMessage(e)}`))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [mapId, toast]);

  const patchMap = useCallback((patch) => setMap((m) => (m ? { ...m, ...patch } : m)), []);

  /** Run a mutation with a shared busy flag and toast handling. */
  const run = useCallback(
    async (job, okMessage) => {
      if (busy || !mapRef.current) return false;
      setBusy(true);
      try {
        const msg = await job(mapRef.current);
        toast.success(msg ?? okMessage);
        return true;
      } catch (e) {
        toast.error(`Error: ${errorMessage(e)}`);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [busy, toast],
  );

  /** Persist `changes` ([{ srNo, plot }]) and mirror them into local state. */
  const persist = useCallback(
    async (m, changes) => {
      await savePlots(m.id, changes);
      const bySr = new Map(changes.map((c) => [c.srNo, c.plot]));
      setMap((cur) => (cur ? { ...cur, plots: cur.plots.map((p) => bySr.get(p.srNo) ?? p) } : cur));
    },
    [],
  );

  // ── Map-level actions ──────────────────────────────────────────────────────
  const toggleEnabled = () =>
    run(async (m) => {
      const next = !m.isEnabled;
      await setMapEnabled(m.id, next);
      patchMap({ isEnabled: next });
      return `Map "${m.name}" ${next ? 'enabled' : 'disabled'}`;
    });

  const rename = (name) =>
    run(async (m) => {
      await renameMap(m.id, name);
      patchMap({ name });
      return `Map renamed to "${name}"`;
    });

  // ── Plot actions ───────────────────────────────────────────────────────────
  const updatePlot = (updated) =>
    run(async (m) => {
      await persist(m, [{ srNo: updated.srNo, plot: updated }]);
      return 'Plot updated successfully';
    });

  const bulkUpdate = (srNos, makePatch, message) =>
    run(async (m) => {
      const changes = [];
      for (const p of m.plots) {
        if (!srNos.has(p.srNo)) continue;
        changes.push({ srNo: p.srNo, plot: { ...p, ...makePatch(p, m) } });
      }
      await persist(m, changes);
      return message(changes.length);
    });

  const bulkStatus = (srNos, status) =>
    bulkUpdate(srNos, () => ({ status }), (n) => `${plural(n, 'plot')} marked ${status}`);

  /** Price follows the category rate unless the plot's price is already locked. */
  const bulkCategory = (srNos, category) =>
    bulkUpdate(
      srNos,
      (p, m) => {
        const rate = m.categoryRates[category] ?? 0;
        return {
          category,
          price: rate > 0 && !isPriceLocked(p.status) ? Math.round(rate * p.areaSqFt) : p.price,
        };
      },
      (n) => `${plural(n, 'plot')} set to ${category}`,
    );

  /** mode: 'rate' (category rate) | 'sqft' (₹ per ft²) | 'total' (fixed price). */
  const bulkPrice = (srNos, mode, value) =>
    bulkUpdate(
      srNos,
      (p, m) => {
        if (mode === 'rate') {
          const r = m.categoryRates[p.category] ?? 0;
          return { price: r > 0 ? Math.round(r * p.areaSqFt) : p.price };
        }
        return { price: mode === 'sqft' ? Math.round(value * p.areaSqFt) : value };
      },
      (n) => `Price updated on ${plural(n, 'plot')}`,
    );

  /** Save category rates; optionally write them onto every unlocked plot. */
  const saveRates = (rates, apply) =>
    run(async (m) => {
      await saveCategoryRates(m.id, rates);
      patchMap({ categoryRates: rates });
      if (!apply) return 'Category rates saved';

      const changes = [];
      for (const p of m.plots) {
        const r = rates[p.category] ?? 0;
        if (!isHiddenType(p) && !isPriceLocked(p.status) && r > 0) {
          changes.push({ srNo: p.srNo, plot: { ...p, price: Math.round(r * p.areaSqFt) } });
        }
      }
      if (changes.length) await persist(m, changes);
      return `Rates saved · price updated on ${plural(changes.length, 'plot')} (Token / Part Payment / Agreement / Sold skipped)`;
    });

  return { map, loading, busy, toggleEnabled, rename, updatePlot, bulkStatus, bulkCategory, bulkPrice, saveRates };
}
