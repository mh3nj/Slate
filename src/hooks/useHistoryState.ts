/**
 * Slate — history hook.
 *
 * A lightweight undo/redo state container with input batching: rapid updates
 * within a 500ms window collapse into a single history entry (e.g. dragging a
 * hue slider), while discrete actions like loading a preset or project push
 * their own entries.
 */

import { useCallback, useReducer, useRef, useState } from 'react';

export interface HistoryState<T> {
  present: T;
  apply: (mutator: (prev: T) => T) => void;
  replace: (next: T) => void;
  loadWithoutHistory: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const HISTORY_LIMIT = 30;
const BATCH_WINDOW_MS = 500;

export function useHistoryState<T>(initial: T): HistoryState<T> {
  const [present, setPresentRaw] = useState<T>(initial);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const batchOpenRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, forceTick] = useReducer((c: number) => c + 1, 0);

  const closeBatch = useCallback(() => {
    batchOpenRef.current = false;
    forceTick();
  }, []);

  const apply = useCallback(
    (mutator: (prev: T) => T) => {
      setPresentRaw((prev) => {
        if (!batchOpenRef.current) {
          pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), prev];
          futureRef.current = [];
          batchOpenRef.current = true;
        }
        return mutator(prev);
      });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(closeBatch, BATCH_WINDOW_MS);
    },
    [closeBatch],
  );

  const replace = useCallback(
    (next: T) => {
      setPresentRaw((prev) => {
        pastRef.current = [...pastRef.current.slice(-(HISTORY_LIMIT - 1)), prev];
        futureRef.current = [];
        return next;
      });
      batchOpenRef.current = false;
      forceTick();
    },
    [],
  );

  const loadWithoutHistory = useCallback((next: T) => {
    setPresentRaw(next);
    pastRef.current = [];
    futureRef.current = [];
    batchOpenRef.current = false;
    forceTick();
  }, []);

  // The "anything to undo/redo?" check must happen *inside* the functional
  // updater, not before setPresentRaw is called. React 18 batches state updates
  // and may not run the updater synchronously, so a guard checked beforehand
  // could read a stale pastRef/futureRef length if undo() fires again before
  // the first updater has actually run (e.g. holding ⌘Z). Checking inside keeps
  // every call safe and idempotent even when several are queued in one batch.
  const undo = useCallback(() => {
    setPresentRaw((prev) => {
      if (!pastRef.current.length) return prev;
      const p = pastRef.current[pastRef.current.length - 1];
      pastRef.current = pastRef.current.slice(0, -1);
      futureRef.current = [prev, ...futureRef.current];
      return p;
    });
    batchOpenRef.current = false;
    forceTick();
  }, []);

  const redo = useCallback(() => {
    setPresentRaw((prev) => {
      if (!futureRef.current.length) return prev;
      const f = futureRef.current[0];
      futureRef.current = futureRef.current.slice(1);
      pastRef.current = [...pastRef.current, prev];
      return f;
    });
    batchOpenRef.current = false;
    forceTick();
  }, []);

  return {
    present,
    apply,
    replace,
    loadWithoutHistory,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
