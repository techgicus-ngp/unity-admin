// Single place that reads import.meta.env. Everything else imports from here,
// so a missing / mistyped variable fails loudly in one spot.
const e = import.meta.env;

const list = (v) =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const env = Object.freeze({
  firebase: {
    apiKey: e.VITE_FIREBASE_API_KEY,
    authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: e.VITE_FIREBASE_PROJECT_ID,
    storageBucket: e.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: e.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: e.VITE_FIREBASE_APP_ID,
    measurementId: e.VITE_FIREBASE_MEASUREMENT_ID || undefined,
  },
  appName: e.VITE_APP_NAME || 'Unity Realities Admin',
  companyName: e.VITE_COMPANY_NAME || 'Unity Realities',
  companyTagline: e.VITE_COMPANY_TAGLINE || 'Real Estate Quotation',
  defaultMapId: e.VITE_DEFAULT_MAP_ID || '',
  allowedMapIds: list(e.VITE_ALLOWED_MAP_IDS),
  employeeGroups: list(e.VITE_EMPLOYEE_GROUPS),
  seed: {
    enabled: e.VITE_SEED_DEFAULT_USERS === 'true',
    admin: { email: e.VITE_SEED_ADMIN_EMAIL, password: e.VITE_SEED_ADMIN_PASSWORD },
    guest: { email: e.VITE_SEED_GUEST_EMAIL, password: e.VITE_SEED_GUEST_PASSWORD },
  },
});

const REQUIRED = [
  ['VITE_FIREBASE_API_KEY', env.firebase.apiKey],
  ['VITE_FIREBASE_PROJECT_ID', env.firebase.projectId],
  ['VITE_FIREBASE_APP_ID', env.firebase.appId],
];

/** Names of required variables that are empty. */
export const missingEnv = REQUIRED.filter(([, v]) => !v).map(([k]) => k);
