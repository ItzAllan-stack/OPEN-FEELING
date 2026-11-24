import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search feelings, topics, tags, or people...',
}: SearchBarProps) {
  return (
    <div className="relative flex items-center">
      <Search className="w-4 h-4 text-[#6B6770] absolute left-3.5 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        aria-keyshortcuts="Control+K Meta+K"
        data-search-input
        className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-sm text-[#29272B] placeholder:text-[#6B6770] focus:outline-none focus:border-[#E9A9B8] focus:bg-[#FCFBFA] transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 p-1 text-[#6B6770] hover:text-[#29272B] cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
