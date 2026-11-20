import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ImagePlus, Trash2, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { deleteImage, subscribeGallery, uploadImage } from '@/services/galleryService';
import { fetchMap } from '@/services/mapService';
import { useSubscription } from '@/hooks/useSubscription';
import { errorMessage } from '@/utils/format';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader, Spinner } from '@/components/ui/Spinner';

const MAX_MB = 15;

export default function GalleryPage() {
  const { mapId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const fileInput = useRef(null);
  const [mapName, setMapName] = useState('');
  const [progress, setProgress] = useState(null); // { done, total }
  const [viewer, setViewer] = useState(null); // index
  const [toDelete, setToDelete] = useState(null);

  const { data: images, loading, error } = useSubscription((d, e) => subscribeGallery(mapId, d, e), [mapId]);

  useEffect(() => {
    fetchMap(mapId).then((m) => setMapName(m?.name ?? '')).catch(() => {});
  }, [mapId]);

  const onFiles = async (e) => {
    const files = [...e.target.files].filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    if (!files.length) return;
    setProgress({ done: 0, total: files.length });
    let done = 0;
    for (const file of files) {
      if (file.size > MAX_MB * 1024 * 1024) toast.error(`${file.name} is larger than ${MAX_MB} MB`);
      else {
        try {
          await uploadImage({ mapId, file, uploadedBy: user.name });
        } catch (err) {
          toast.error(`Failed to upload ${file.name}: ${errorMessage(err)}`);
        }
      }
      setProgress({ done: ++done, total: files.length });
    }
    setProgress(null);
  };

  const remove = async () => {
    try {
      await deleteImage(mapId, toDelete);
    } catch (err) {
      toast.error(`Delete failed: ${errorMessage(err)}`);
    }
    setToDelete(null);
  };

  const list = useMemo(() => images ?? [], [images]);

  // Keyboard navigation in the viewer.
  useEffect(() => {
    if (viewer === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setViewer(null);
      if (e.key === 'ArrowRight') setViewer((i) => Math.min(i + 1, list.length - 1));
      if (e.key === 'ArrowLeft') setViewer((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewer, list.length]);

  return (
    <div className="screen">
      <PageHeader
        title="Gallery"
        subtitle={mapName}
        backTo={`/layouts?map=${mapId}`}
        actions={
          <button className="btn btn-light" onClick={() => fileInput.current.click()} disabled={!!progress}>
            {progress ? <Spinner size={18} /> : <ImagePlus size={18} />}
            {progress ? `Uploading ${progress.done} / ${progress.total}…` : 'Upload images'}
          </button>
        }
      />
      <input ref={fileInput} type="file" accept="image/*" multiple hidden onChange={onFiles} />

      <div className="page">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <p className="error-text">Error: {error.message}</p>
        ) : list.length === 0 ? (
          <EmptyState icon={ImagePlus} title="No images yet" hint="Upload site photos, brochures or layouts for this map." />
        ) : (
          <div className="gallery-grid">
            {list.map((img, i) => (
              <figure key={img.id} className="gallery-item">
                <button className="gallery-thumb" onClick={() => setViewer(i)} aria-label={`Open ${img.name}`}>
                  <img src={img.url} alt={img.name} loading="lazy" decoding="async" />
                </button>
                <figcaption>
                  <span className="grow ellipsis" title={img.name}>{img.name}</span>
                  <button className="icon-btn danger" onClick={() => setToDelete(img)} aria-label={`Delete ${img.name}`}><Trash2 size={16} /></button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      {viewer !== null && list[viewer] && (
        <div className="lightbox" onClick={() => setViewer(null)}>
          <button className="icon-btn light lb-close" aria-label="Close"><X size={24} /></button>
          {viewer > 0 && (
            <button className="icon-btn light lb-prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); setViewer(viewer - 1); }}><ChevronLeft size={28} /></button>
          )}
          <img src={list[viewer].url} alt={list[viewer].name} onClick={(e) => e.stopPropagation()} />
          {viewer < list.length - 1 && (
            <button className="icon-btn light lb-next" aria-label="Next" onClick={(e) => { e.stopPropagation(); setViewer(viewer + 1); }}><ChevronRight size={28} /></button>
          )}
          <p>{list[viewer].name} · {viewer + 1}/{list.length}</p>
        </div>
      )}

      {toDelete && (
        <ConfirmDialog danger title="Delete image?" message={toDelete.name} confirmLabel="Delete" onConfirm={remove} onClose={() => setToDelete(null)} />
      )}
    </div>
  );
}
