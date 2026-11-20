import { PLOT_CATEGORIES, SQM_TO_SQFT } from '@/config/constants';

export const normalizeCategory = (v) => {
  const s = String(v ?? '').trim();
  return PLOT_CATEGORIES.includes(s) ? s : 'Residential';
};

/**
 * Raw Firestore plot → plot used by the UI.
 * Geometry (corners / center) is passed through untouched; the dashboard never
 * edits it, and saves merge over the stored object so unknown fields survive.
 */
export function normalizePlot(raw) {
  const area = Number(raw.area) || 0;
  return {
    srNo: String(raw.srNo ?? ''),
    plotId: Number(raw.plotId) || 0,
    plotNo: String(raw.plotNo ?? ''),
    title: raw.title ?? '',
    status: raw.status ?? 'Available',
    area,
    areaSqFt: Number(raw.areaSqFt) || area * SQM_TO_SQFT,
    dimensions: raw.dimensions ?? '',
    ownerName: raw.ownerName ?? '',
    contactPhone: raw.contactPhone ?? '',
    contactEmail: raw.contactEmail ?? '',
    notes: raw.notes ?? '',
    type: raw.type ?? 'plot',
    facing: raw.facing ?? 'North',
    price: Number(raw.price) || 0,
    category: normalizeCategory(raw.category),
    createdDate: raw.createdDate ?? new Date().toISOString(),
  };
}

const EDITABLE_FIELDS = [
  'srNo', 'plotId', 'plotNo', 'title', 'status', 'area', 'areaSqFt', 'dimensions',
  'ownerName', 'contactPhone', 'contactEmail', 'notes', 'type', 'facing', 'price',
  'category', 'createdDate',
];

/** UI plot → the fields written back to Firestore (merged over the stored object). */
export function serializePlot(plot) {
  const out = {};
  for (const k of EDITABLE_FIELDS) out[k] = plot[k];
  return out;
}
