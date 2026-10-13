import { useEffect, useState } from 'react';

/** Current time in ms, re-rendering every `intervalMs`. */
export const useNow = (intervalMs: number = 30000) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
};
