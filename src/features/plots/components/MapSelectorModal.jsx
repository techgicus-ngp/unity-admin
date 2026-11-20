import { useEffect, useMemo, useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { listMaps } from '@/services/mapService';
import { Modal } from '@/components/ui/Modal';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';

export function MapSelectorModal({ currentId, onSelect, onClose }) {
  const [maps, setMaps] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    listMaps().then(setMaps).catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (maps ?? []).filter((m) => !q || m.name.toLowerCase().includes(q));
  }, [maps, search]);

  return (
    <Modal title="Select Map" onClose={onClose} width={500}>
      <SearchInput value={search} onChange={setSearch} placeholder="Search maps…" />
      {error ? (
        <p className="error-text">Error: {error}</p>
      ) : !maps ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon={MapIcon} title="No maps found" />
      ) : (
        <ul className="map-list">
          {filtered.map((m) => (
            <li key={m.id}>
              <button className={`map-item ${m.id === currentId ? 'current' : ''}`} onClick={() => onSelect(m)}>
                <MapIcon size={20} />
                <span className="grow">
                  <strong>{m.name}</strong>
                  <small className="block muted">{m.plotCount} plots</small>
                </span>
                {!m.isEnabled && <span className="badge badge-muted">Disabled</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
