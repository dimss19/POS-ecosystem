import { useState, type FormEvent, useRef, useEffect } from 'react';
import { SearchIcon } from '../icons';

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
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400">
          <SearchIcon size={18} />
        </span>
        <input
          ref={inputRef}
          id="barcode-search"
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Scan barcode atau cari produk..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700/80 text-surface-100 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none transition-all text-sm shadow-2xs"
          autoComplete="off"
        />
      </div>
    </form>
  );
}
