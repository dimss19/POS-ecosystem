/**
 * KASIR POS — Search Bar Component
 *
 * Combined search bar for barcode and product name search.
 */

import { useState, type FormEvent, useRef, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onBarcodeSubmit: (barcode: string) => void;
}

export default function SearchBar({ onSearch, onBarcodeSubmit }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onBarcodeSubmit(query.trim());
      setQuery('');
    }
  };

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
          🔍
        </span>
        <input
          ref={inputRef}
          id="barcode-search"
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Scan barcode atau cari produk..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-600 text-surface-100 placeholder-surface-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
          autoComplete="off"
        />
      </div>
    </form>
  );
}
