import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query, updateDoc, where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { env } from '@/config/env';
import { COLLECTIONS, ROLES, SESSION_KEY } from '@/config/constants';
import { hasAccess, isAdmin, normalizeUser } from '@/models/user';

const users = () => collection(db, COLLECTIONS.users);

const storage = {
  get: () => { try { return localStorage.getItem(SESSION_KEY); } catch { return null; } },
  set: (v) => { try { localStorage.setItem(SESSION_KEY, v); } catch { /* private mode */ } },
  clear: () => { try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } },
};

async function findByEmail(email) {
  const snap = await getDocs(query(users(), where('email', '==', email.trim()), limit(1)));
  return snap.empty ? null : snap.docs[0];
}

/**
 * Optional first-run bootstrap. Controlled by VITE_SEED_DEFAULT_USERS so it
 * never runs (and never costs reads) on a normal start-up.
 */
export async function seedDefaultUsers() {
  if (!env.seed.enabled) return;
  const seeds = [
    { ...env.seed.admin, name: 'Admin', role: ROLES.admin },
    { ...env.seed.guest, name: 'Guest', role: ROLES.guest },
  ];
  for (const s of seeds) {
    if (!s.email || !s.password) continue;
    if (await findByEmail(s.email)) continue;
    const ref = await addDoc(users(), {
      email: s.email,
      password: s.password,
      name: s.name,
      groupName: '',
      role: s.role,
      createdDate: new Date().toISOString(),
      isAccessGranted: true,
    });
    await updateDoc(ref, { uid: ref.id });
  }
}

/** Restore the saved session; re-validated against Firestore every time. */
export async function loadSession() {
  const uid = storage.get();
  if (!uid) return null;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
    if (!snap.exists()) throw new Error('missing');
    const user = normalizeUser(snap.data(), snap.id);
    if (!hasAccess(user)) throw new Error('revoked');
    return user;
  } catch {
    storage.clear();
    return null;
  }
}

export async function signIn(email, password) {
  const snap = await getDocs(
    query(users(), where('email', '==', email.trim()), where('password', '==', password.trim()), limit(1)),
  );
  if (snap.empty) throw new Error('Invalid email or password.');
  const user = normalizeUser(snap.docs[0].data(), snap.docs[0].id);
  if (!hasAccess(user)) throw new Error('Access not granted. Please contact your administrator.');
  storage.set(user.uid);
  return user;
}

export const signOut = () => storage.clear();

export async function registerEmployee({ email, name, groupName, password }) {
  if (await findByEmail(email)) throw new Error('Email already registered.');
  const ref = await addDoc(users(), {
    email: email.trim(),
    name: name.trim(),
    groupName: groupName.trim(),
    password: password.trim(),
    role: ROLES.employee,
    createdDate: new Date().toISOString(),
    isAccessGranted: false, // blocked until an admin grants access
  });
  await updateDoc(ref, { uid: ref.id });
}

export const setEmployeeAccess = (uid, granted) =>
  updateDoc(doc(db, COLLECTIONS.users, uid), { isAccessGranted: granted });

export const deleteEmployee = (uid) => deleteDoc(doc(db, COLLECTIONS.users, uid));

/** Live employee list (admin screens). Returns the unsubscribe function. */
export function subscribeEmployees(onData, onError) {
  return onSnapshot(
    query(users(), where('role', '==', ROLES.employee)),
    (snap) => onData(snap.docs.map((d) => normalizeUser(d.data(), d.id))),
    onError,
  );
}

export { isAdmin };
