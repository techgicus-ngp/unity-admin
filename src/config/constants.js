// Domain constants. Environment-specific values live in config/env.js.

export const COLLECTIONS = Object.freeze({
  users: 'unity_user',
  quotations: 'quotations_unity',
  maps: 'maps',
  gallery: 'gallery', // maps/{mapId}/gallery
});

export const ROLES = Object.freeze({ admin: 'admin', employee: 'employee', guest: 'guest' });

export const SESSION_KEY = 'unity_session_uid';

// ── Plots ────────────────────────────────────────────────────────────────────
export const SQM_TO_SQFT = 10.7639;

export const PLOT_CATEGORIES = ['Residential', 'Commercial', 'Semi-Commercial', 'Corner'];

/** Sales-pipeline order. */
export const PLOT_STATUSES = ['Available', 'Booked', 'Token', 'Part Payment', 'Agreement', 'Sold'];

/** Price is already agreed with a buyer - bulk rate updates must not touch it. */
export const PRICE_LOCKED_STATUSES = new Set(['Token', 'Part Payment', 'Agreement', 'Sold']);

export const FACINGS = [
  'North', 'South', 'East', 'West',
  'North-East', 'North-West', 'South-East', 'South-West',
];

export const STATUS_COLORS = {
  Available: '#3B7BF6',
  Booked: '#F59E0B',
  Token: '#111827',
  'Part Payment': '#10B981',
  Agreement: '#EF4444',
  Sold: '#64748B',
};

export const CATEGORY_COLORS = {
  Residential: '#3B7BF6',
  Commercial: '#8B5CF6',
  'Semi-Commercial': '#06B6D4',
  Corner: '#EC4899',
};

export const CATEGORY_SHORT = {
  Residential: 'R',
  Commercial: 'C',
  'Semi-Commercial': 'SC',
  Corner: 'CR',
};

export const PLOT_SORTS = [
  { value: 'plotNo', label: 'Plot No (1, 2, 3…)' },
  { value: 'area', label: 'Area' },
  { value: 'price', label: 'Price (high → low)' },
  { value: 'status', label: 'Status' },
];

// ── Quotations ───────────────────────────────────────────────────────────────
export const QUOTATION_DEFAULTS = Object.freeze({
  bookingAmount: 51000,
  stampDutyPercent: 6,
  mutation: 15000,
  societyCharges: 13500,
  downPaymentOption: '20%',
});

/** Registration: 1% up to ₹30 L, flat ₹30,000 above it. */
export const REGISTRATION_CAP_THRESHOLD = 3_000_000;
export const REGISTRATION_CAP_AMOUNT = 30_000;
