import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import { db, getStorageInstance } from '@/config/firebase';
import { COLLECTIONS } from '@/config/constants';

// Metadata: maps/{mapId}/gallery/{imageId}   Files: map_gallery/{mapId}/{millis}_{safeName}
const col = (mapId) => collection(db, COLLECTIONS.maps, mapId, COLLECTIONS.gallery);

export function subscribeGallery(mapId, onData, onError) {
  return onSnapshot(
    query(col(mapId), orderBy('uploadedAt', 'desc')),
    (snap) =>
      onData(
        snap.docs.map((d) => {
          const m = d.data();
          return {
            id: d.id,
            name: m.name ?? '',
            url: m.url ?? '',
            storagePath: m.path ?? '',
            sizeBytes: Number(m.size) || 0,
            uploadedAt: m.uploadedAt?.toDate?.() ?? null,
            uploadedBy: m.uploadedBy ?? '',
          };
        }),
      ),
    onError,
  );
}

export async function uploadImage({ mapId, file, uploadedBy, onProgress }) {
  const { storage, ref, uploadBytesResumable, getDownloadURL } = await getStorageInstance();
  const safe = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
  const path = `map_gallery/${mapId}/${Date.now()}_${safe}`;
  const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type || 'image/jpeg' });

  await new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (s) => s.totalBytes && onProgress?.(s.bytesTransferred / s.totalBytes),
      reject,
      resolve,
    );
  });
  const url = await getDownloadURL(task.snapshot.ref);
  await addDoc(col(mapId), {
    name: file.name, url, path, size: file.size, uploadedAt: serverTimestamp(), uploadedBy,
  });
}

export async function deleteImage(mapId, image) {
  try {
    if (image.storagePath) {
      const { storage, ref, deleteObject } = await getStorageInstance();
      await deleteObject(ref(storage, image.storagePath));
    }
  } catch {
    /* file already gone - still drop the metadata */
  }
  await deleteDoc(doc(db, COLLECTIONS.maps, mapId, COLLECTIONS.gallery, image.id));
}
