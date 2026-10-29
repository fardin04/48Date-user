import { useEffect, useState } from "react";

/**
 * Reads a value from a service on the client. `value` is undefined until the first read settles
 * (or when it failed: then `error` is set); `reload` reads it again (after a decision, a reset, a
 * retry). `load` must be stable between renders unless its inputs change (the React Compiler
 * memoises inline loaders). A read that finishes after unmount is ignored.
 */
export function useLoaded<T>(load: () => Promise<T>) {
  const [state, setState] = useState<{ value: T } | { error: unknown } | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    load().then(
      (value) => {
        if (active) setState({ value });
      },
      (error: unknown) => {
        if (active) setState({ error });
      },
    );
    return () => {
      active = false;
    };
  }, [load, version]);

  return {
    value: state && "value" in state ? state.value : undefined,
    error: state && "error" in state ? state.error : undefined,
    /** Reads again; the last value stays on screen meanwhile. */
    reload: () => setVersion((current) => current + 1),
  };
}
