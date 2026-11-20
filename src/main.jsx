import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { missingEnv, env } from '@/config/env';
import '@/styles/global.css';
import '@/styles/plots.css';
import '@/styles/quotations.css';

function ConfigError() {
  return (
    <div className="empty" style={{ minHeight: '100vh', padding: 24 }}>
      <h3>Missing environment configuration</h3>
      <p className="muted">
        Add these to <code>.env</code> (see <code>.env.example</code>) and restart the dev server:
      </p>
      <pre className="code">{missingEnv.join('\n')}</pre>
    </div>
  );
}

document.title = env.appName;
const root = createRoot(document.getElementById('root'));

if (missingEnv.length) {
  root.render(<ConfigError />);
} else {
  // Import lazily so Firebase is never initialised with a broken config.
  import('./App').then(({ default: App }) =>
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  );
}
