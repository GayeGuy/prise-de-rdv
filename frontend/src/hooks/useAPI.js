import { useState, useEffect, useRef } from 'react';

export function useAPI(fetcher, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stocker fetcher et options dans des refs pour éviter les boucles infinies
  const fetcherRef = useRef(fetcher);
  const optionsRef = useRef(options);
  fetcherRef.current = fetcher;
  optionsRef.current = options;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcherRef.current();
        if (!cancelled) {
          setData(result);
          optionsRef.current?.onSuccess?.(result);
        }
      } catch (err) {
        if (!cancelled) {
          const e = err instanceof Error ? err : new Error(String(err));
          setError(e);
          optionsRef.current?.onError?.(e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (optionsRef.current?.enabled !== false) {
      run();
    }

    return () => { cancelled = true; };
  }, []); // tableau vide = exécution unique au montage

  const refetch = () => {
    fetcherRef.current().then(result => {
      setData(result);
      optionsRef.current?.onSuccess?.(result);
    }).catch(err => {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      optionsRef.current?.onError?.(e);
    });
  };

  return { data, error, loading, refetch };
}
