/**
 * KASIR POS — Barcode Scanner Hook
 *
 * Detects HID barcode scanner input (keyboard emulation).
 * Barcode scanners typically send characters rapidly followed by Enter.
 *
 * Detection logic:
 * - Characters arriving within 50ms intervals = barcode scanner
 * - Finalized by Enter key
 * - Minimum 3 characters to be considered a barcode
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseBarcodeOptions {
  onBarcodeScanned: (barcode: string) => void;
  enabled?: boolean;
  minLength?: number;
  maxIntervalMs?: number;
}

export function useBarcodeScanner({
  onBarcodeScanned,
  enabled = true,
  minLength = 3,
  maxIntervalMs = 50,
}: UseBarcodeOptions): void {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetBuffer = useCallback(() => {
    bufferRef.current = '';
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is on an input/textarea (let user type normally)
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea') {
        // Only process Enter on the search bar for barcode
        if (e.key === 'Enter' && target.id === 'barcode-search') {
          // Let the search bar handle its own enter
          return;
        }
        if (e.key !== 'Enter') return;
      }

      const now = Date.now();
      const timeDelta = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Enter key = finalize barcode
      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim();
        if (barcode.length >= minLength) {
          e.preventDefault();
          e.stopPropagation();
          onBarcodeScanned(barcode);
        }
        resetBuffer();
        return;
      }

      // Only accept printable characters
      if (e.key.length !== 1) return;

      // If too much time has passed, start a new buffer
      if (timeDelta > maxIntervalMs && bufferRef.current.length > 0) {
        resetBuffer();
      }

      bufferRef.current += e.key;

      // Set a timeout to clear the buffer if no more keys come
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(resetBuffer, 200);
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      resetBuffer();
    };
  }, [enabled, minLength, maxIntervalMs, onBarcodeScanned, resetBuffer]);
}
