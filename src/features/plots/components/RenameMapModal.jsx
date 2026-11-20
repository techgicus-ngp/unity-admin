import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';

export function RenameMapModal({ currentName, onSubmit, onClose }) {
  const [name, setName] = useState(currentName);
  const trimmed = name.trim();
  const submit = (e) => {
    e.preventDefault();
    if (trimmed && trimmed !== currentName) onSubmit(trimmed);
    else onClose();
  };
  return (
    <Modal
      title="Rename Map" onClose={onClose} width={400}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" form="rename-form" disabled={!trimmed}>Rename</button></>}
    >
      <form id="rename-form" onSubmit={submit}>
        <Field label="Map name"><input autoFocus value={name} onChange={(e) => setName(e.target.value)} /></Field>
      </form>
    </Modal>
  );
}
