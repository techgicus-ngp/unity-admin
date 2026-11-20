import { PLOT_STATUSES, PRICE_LOCKED_STATUSES } from '@/config/constants';

export const isPriceLocked = (status) => PRICE_LOCKED_STATUSES.has(status);

/** Roads / open spaces are not sellable plots and are hidden everywhere. */
export function isHiddenType(p) {
  const t = p.type.toLowerCase().trim();
  if (t === 'road' || t === 'open space' || t === 'openspace' || t.startsWith('road') || t.startsWith('open')) {
    return true;
  }
  const n = p.plotNo.toLowerCase().trim();
  return n.startsWith('road') || n.startsWith('open') || n.includes('open space') || n.includes('openspace');
}

/** The plot's own price, otherwise category rate × area (ft²). */
export function effectivePrice(p, rates) {
  if (p.price > 0) return p.price;
  const r = rates[p.category] ?? 0;
  return r > 0 ? Math.round(r * p.areaSqFt) : 0;
}

export const isCategoryPrice = (p, rates) => p.price <= 0 && (rates[p.category] ?? 0) > 0;

const numericPlotNo = (s) => {
  const v = parseInt(s.trim(), 10);
  return Number.isNaN(v) ? 999999 : v;
};

/** Filter + sort (pure; memoise at the call site). */
export function filterAndSortPlots(plots, { search, status, category, sortBy, rates }) {
  const q = search.trim().toLowerCase();
  const list = plots.filter(
    (p) =>
      !isHiddenType(p) &&
      (!q || p.plotNo.toLowerCase().includes(q)) &&
      (status === 'All' || p.status === status) &&
      (category === 'All' || p.category === category),
  );

  const statusRank = (s) => {
    const i = PLOT_STATUSES.indexOf(s);
    return i === -1 ? 999 : i;
  };

  list.sort((a, b) => {
    switch (sortBy) {
      case 'area':
        return b.area - a.area;
      case 'price':
        return effectivePrice(b, rates) - effectivePrice(a, rates);
      case 'status':
        return statusRank(a.status) - statusRank(b.status);
      default: {
        const d = numericPlotNo(a.plotNo) - numericPlotNo(b.plotNo);
        return d || a.plotNo.localeCompare(b.plotNo);
      }
    }
  });
  return list;
}

/** Status counts + per-category price summary for the visible plots. */
export function summarisePlots(visible, rates) {
  const byStatus = Object.fromEntries(PLOT_STATUSES.map((s) => [s, 0]));
  const cats = {};
  for (const p of visible) {
    if (p.status in byStatus) byStatus[p.status] += 1;
    const c = (cats[p.category] ??= { count: 0, priceSum: 0, priced: 0, availableValue: 0 });
    c.count += 1;
    const price = effectivePrice(p, rates);
    if (price > 0) {
      c.priceSum += price;
      c.priced += 1;
    }
    if (p.status === 'Available') c.availableValue += price;
  }
  return { total: visible.length, byStatus, cats };
}
