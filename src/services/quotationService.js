import {
  addDoc, collection, deleteDoc, doc, getCountFromServer, getDoc, onSnapshot, query, updateDoc, where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config/constants';
import { normalizeQuotation, serializeQuotation } from '@/models/quotation';

const col = () => collection(db, COLLECTIONS.quotations);

const byDateDesc = (a, b) => b.quotationDate - a.quotationDate;

/**
 * Sorting happens client-side so no composite Firestore index is needed
 * (the Flutter app required `createdByUid + quotationDate`).
 */
function subscribe(q, onData, onError) {
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => normalizeQuotation(d.data(), d.id)).sort(byDateDesc)),
    onError,
  );
}

export const subscribeAllQuotations = (onData, onError) => subscribe(query(col()), onData, onError);

export const subscribeEmployeeQuotations = (uid, onData, onError) =>
  subscribe(query(col(), where('createdByUid', '==', uid)), onData, onError);

export async function createQuotation(quotation) {
  const ref = await addDoc(col(), serializeQuotation(quotation));
  return ref.id;
}

export const updateQuotation = (id, quotation) =>
  updateDoc(doc(db, COLLECTIONS.quotations, id), serializeQuotation(quotation));

export const deleteQuotation = (id) => deleteDoc(doc(db, COLLECTIONS.quotations, id));

/** Cheap aggregate count (1 read) for the overview card. */
export async function countQuotations() {
  const snap = await getCountFromServer(col());
  return snap.data().count;
}

export async function getQuotation(id) {
  const snap = await getDoc(doc(db, COLLECTIONS.quotations, id));
  return snap.exists() ? normalizeQuotation(snap.data(), snap.id) : null;
}
