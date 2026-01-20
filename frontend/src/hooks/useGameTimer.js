// url=https://github.com/nnmt2810/boardgame_web/blob/main/frontend/src/hooks/useGameTimer.js
import { useState, useRef, useEffect, useCallback } from "react";

/**
 * useGameTimer
 * - return { timeElapsed, isRunning, start, pause, reset, load }
 * timeElapsed is in milliseconds (number).
 */
export default function useGameTimer() {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startRef = useRef(null); // timestamp when timer started
  const rafRef = useRef(null);

  const tick = useCallback(() => {
    if (!isRunning) return;
    const now = Date.now();
    const delta = now - (startRef.current ?? now);
    setTimeElapsed((prev) => prev + delta);
    // set new baseline
    startRef.current = now;
    // schedule next tick
    rafRef.current = requestAnimationFrame(tick);
  }, [isRunning]);

  // start timer
  const start = useCallback(() => {
    if (isRunning) return;
    startRef.current = Date.now();
    setIsRunning(true);
    // schedule first
    rafRef.current = requestAnimationFrame(tick);
  }, [isRunning, tick]);

  // pause timer
  const pause = useCallback(() => {
    if (!isRunning) return;
    // finalize current tick
    const now = Date.now();
    const delta = now - (startRef.current ?? now);
    setTimeElapsed((prev) => prev + delta);
    startRef.current = null;
    setIsRunning(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, [isRunning]);

  // reset to zero and stop
  const reset = useCallback(() => {
    setTimeElapsed(0);
    startRef.current = null;
    setIsRunning(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // load an elapsed time (milliseconds) and optionally start
  const load = useCallback((ms = 0, autoStart = false) => {
    // set timeElapsed to ms, and if autoStart then start immediately
    setTimeElapsed(Number(ms) || 0);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startRef.current = null;
    setIsRunning(false);
    if (autoStart) {
      start();
    }
  }, [start]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // expose ms as number; can format on UI as needed
  return {
    timeElapsed,
    isRunning,
    start,
    pause,
    reset,
    load,
  };
}