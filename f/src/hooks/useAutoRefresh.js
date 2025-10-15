import { useEffect, useRef } from "react";

/**
 * Auto-refresh hook - Polls for updates at regular intervals
 * @param {Function} fetchFunction - Function to call for updates
 * @param {number} interval - Polling interval in milliseconds (default: 30000 = 30 seconds)
 * @param {boolean} enabled - Whether polling is enabled (default: true)
 */
const useAutoRefresh = (fetchFunction, interval = 30000, enabled = true) => {
  const savedCallback = useRef();
  const intervalId = useRef();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = fetchFunction;
  }, [fetchFunction]);

  // Set up the interval
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    // Set up polling (no initial call to avoid unnecessary renders)
    intervalId.current = setInterval(tick, interval);

    // Cleanup
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [interval, enabled]);

  // Manual refresh function
  const refresh = () => {
    if (savedCallback.current) {
      savedCallback.current();
    }
  };

  return refresh;
};

export default useAutoRefresh;
