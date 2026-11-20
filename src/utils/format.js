const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const num2 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export const formatINR = (n) => inr0.format(Number(n) || 0);
export const formatINR2 = (n) => inr2.format(Number(n) || 0);
export const formatNumber = (n, decimals = 0) => (decimals ? num2 : num0).format(Number(n) || 0);

const trim = (v) => v.toFixed(2).replace(/\.?0+$/, '');

/** Compact price: ₹1.25 Cr / ₹40 L / ₹5K. */
export function formatPrice(v) {
  if (!v || v <= 0) return '—';
  if (v >= 1e7) return `₹${trim(v / 1e7)} Cr`;
  if (v >= 1e5) return `₹${trim(v / 1e5)} L`;
  if (v >= 1e3) return `₹${trim(v / 1e3)}K`;
  return `₹${v.toFixed(0)}`;
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const dateLongFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

export const formatDate = (d) => (d instanceof Date && !isNaN(d) ? dateFmt.format(d) : '—');
export const formatDateLong = (d) => (d instanceof Date && !isNaN(d) ? dateLongFmt.format(d) : '—');

/** Date → value for <input type="date"> (local time, yyyy-mm-dd). */
export function toDateInput(d) {
  if (!(d instanceof Date) || isNaN(d)) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** <input type="date"> value → Date (local midnight) or null. */
export function fromDateInput(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Lenient number parse: strips commas / spaces, returns fallback on NaN. */
export function parseNum(v, fallback = 0) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  const n = parseFloat(String(v ?? '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : fallback;
}

export const errorMessage = (e) =>
  String(e?.message ?? e ?? 'Something went wrong').replace(/^Error:\s*/, '').replace(/^Exception:\s*/, '');
