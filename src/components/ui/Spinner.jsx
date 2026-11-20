export function Spinner({ size = 22, light = false }) {
  return <span className={`spinner ${light ? 'spinner-light' : ''}`} style={{ width: size, height: size }} aria-label="Loading" />;
}

export function PageLoader({ label }) {
  return (
    <div className="page-loader">
      <Spinner size={32} />
      {label && <p>{label}</p>}
    </div>
  );
}
