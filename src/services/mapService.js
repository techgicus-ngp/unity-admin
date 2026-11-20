import {
  collection, doc, documentId, getDoc, getDocs, limit, orderBy, query, runTransaction, updateDoc, where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { env } from '@/config/env';
import { COLLECTIONS } from '@/config/constants';
import { normalizePlot, serializePlot } from '@/models/plot';
import { isHiddenType } from '@/utils/plot';

const mapRef = (id) => doc(db, COLLECTIONS.maps, id);

function toMap(snap) {
  const d = snap.data() ?? {};
  const rates = {};
  for (const [k, v] of Object.entries(d.categoryRates ?? {})) rates[k] = Number(v) || 0;
  return {
    id: snap.id,
    name: d.name ?? 'Unnamed Map',
    isEnabled: d.isEnabled ?? true,
    categoryRates: rates,
    plots: (d.plots ?? []).map(normalizePlot),
  };
}

export async function fetchMap(mapId) {
  const snap = await getDoc(mapRef(mapId));
  return snap.exists() ? toMap(snap) : null;
}

/** The configured default map, or the most recently created one. */
export async function fetchDefaultMap() {
  if (env.defaultMapId) {
    const m = await fetchMap(env.defaultMapId);
    if (m) return m;
  }
  const snap = await getDocs(query(collection(db, COLLECTIONS.maps), orderBy('createdDate', 'desc'), limit(1)));
  return snap.empty ? null : toMap(snap.docs[0]);
}

/** Maps offered in the selector (lightweight: no plot normalisation). */
export async function listMaps() {
  const ids = [...new Set([env.defaultMapId, ...env.allowedMapIds].filter(Boolean))];
  let docs;
  if (ids.length === 0) {
    docs = (await getDocs(collection(db, COLLECTIONS.maps))).docs;
  } else {
    // Firestore `in` accepts at most 30 values per query.
    const chunks = [];
    for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
    const snaps = await Promise.all(
      chunks.map((c) => getDocs(query(collection(db, COLLECTIONS.maps), where(documentId(), 'in', c)))),
    );
    docs = snaps.flatMap((s) => s.docs);
  }
  return docs
    .map((d) => {
      const x = d.data();
      const plots = (x.plots ?? []).filter((p) => !isHiddenType(normalizePlot(p)));
      return { id: d.id, name: x.name ?? 'Unnamed Map', isEnabled: x.isEnabled ?? true, plotCount: plots.length };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const setMapEnabled = (mapId, isEnabled) => updateDoc(mapRef(mapId), { isEnabled });
export const renameMap = (mapId, name) => updateDoc(mapRef(mapId), { name });
export const saveCategoryRates = (mapId, categoryRates) => updateDoc(mapRef(mapId), { categoryRates });

/**
 * Apply plot changes atomically. The plots live in one array on the map doc, so
 * a transaction avoids clobbering concurrent edits from another admin.
 * `changes` = [{ srNo, plot }] where plot is the full UI plot to write.
 * Stored objects are merged (not replaced) so unknown fields survive.
 */
export async function savePlots(mapId, changes) {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(mapRef(mapId));
    if (!snap.exists()) throw new Error('Map not found');
    const stored = [...(snap.data().plots ?? [])];
    const bySr = new Map(stored.map((p, i) => [String(p.srNo ?? ''), i]));
    for (const { srNo, plot } of changes) {
      const i = bySr.get(String(srNo));
      if (i === undefined) continue;
      stored[i] = { ...stored[i], ...serializePlot(plot) };
    }
    tx.update(mapRef(mapId), { plots: stored });
  });
}

// ── Plot lookup for the quotation form ───────────────────────────────────────
let mapsCache = { at: 0, docs: null };
const CACHE_MS = 5 * 60 * 1000;

async function allMapDocs() {
  if (mapsCache.docs && Date.now() - mapsCache.at < CACHE_MS) return mapsCache.docs;
  const snap = await getDocs(collection(db, COLLECTIONS.maps));
  mapsCache = { at: Date.now(), docs: snap.docs.map((d) => ({ id: d.id, data: d.data() })) };
  return mapsCache.docs;
}

/**
 * Find plots by plot number (or sr. no.) across all maps. The same number can
 * exist in several projects, so every match is returned.
 */
export async function findPlotsByNumber(rawQuery) {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];
  const maps = await allMapDocs();
  const hits = [];

  for (const m of maps) {
    for (const p of m.data.plots ?? []) {
      if (String(p.plotNo ?? '').toLowerCase() === q) {
        const plot = normalizePlot(p);
        if (!isHiddenType(plot)) hits.push({ mapId: m.id, mapName: m.data.name ?? m.id, plot });
      }
    }
  }
  if (hits.length) return hits;

  // Legacy layout: plots stored as a `plots` sub-collection.
  const subs = await Promise.all(
    maps.map(async (m) => {
      const snap = await getDocs(collection(db, COLLECTIONS.maps, m.id, 'plots'));
      return snap.docs
        .filter((d) => {
          const x = d.data();
          return String(x.plotNo ?? '').toLowerCase() === q || String(x.srNo ?? '').toLowerCase() === q;
        })
        .map((d) => ({ mapId: m.id, mapName: m.data.name ?? m.id, plot: normalizePlot(d.data()) }));
    }),
  );
  return subs.flat();
}
