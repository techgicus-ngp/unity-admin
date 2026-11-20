import { useEffect, useState } from 'react';

/**
 * Subscribe to a realtime source.
 * `subscribe(onData, onError)` must return an unsubscribe function.
 * Pass `null` to skip (e.g. while a dependency is not ready).
 */
export function useSubscription(subscribe, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!subscribe) return undefined;
    setState((s) => ({ ...s, loading: true, error: null }));
    const unsub = subscribe(
      (data) => setState({ data, loading: false, error: null }),
      (error) => setState({ data: null, loading: false, error }),
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
