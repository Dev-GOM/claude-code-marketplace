'use client';

import { useState } from 'react';

interface SearchBarProps {
  readonly onSearch: (query: string) => void;
  readonly onCategoryFilter: (category: string | null) => void;
}

const categories = [
  { id: null, label: 'All', emoji: '✨' },
  { id: 'hooks', label: 'Hooks', emoji: '🎣' },
  { id: 'productivity', label: 'Productivity', emoji: '⚡' },
  { id: 'game-development', label: 'Game Dev', emoji: '🎮' },
  { id: '3d-development', label: '3D Dev', emoji: '🎨' },
];

export function SearchBar({ onSearch, onCategoryFilter }: SearchBarProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleSearchChange = (query: string): void => {
    setSearchQuery(query);
    onSearch(query);
  };

  const handleCategoryClick = (categoryId: string | null): void => {
    setActiveCategory(categoryId);
    onCategoryFilter(categoryId);
  };

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-400 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-75 blur transition-all duration-300" />
        <div className="relative flex items-center">
          <label htmlFor="plugin-search" className="sr-only">
            Search plugins
          </label>
          <input
            id="plugin-search"
            type="text"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleSearchChange(e.target.value)
            }
            placeholder="Search plugins... 🔍"
            aria-label="Search plugins by name or description"
            className="w-full px-6 py-4 bg-white/10 backdrop-blur-md text-white placeholder-white/50 rounded-2xl border border-white/20 focus:border-white/40 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all duration-300"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-4 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all duration-300 hover:scale-105"
              aria-label="Clear search"
              title="Clear search"
            >
              <span aria-hidden="true">Clear ✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div
        role="group"
        aria-label="Filter plugins by category"
        className="flex flex-wrap gap-3"
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id ?? 'all'}
              onClick={() => handleCategoryClick(category.id)}
              aria-pressed={isActive}
              aria-label={`Filter by ${category.label}`}
              title={`Filter by ${category.label}`}
              className={`
                group relative px-5 py-2.5 rounded-full font-medium transition-all duration-300 hover:scale-105
                ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-lg'
                    : 'bg-white/10 backdrop-blur-md text-white/80 hover:bg-white/20 border border-white/20'
                }
              `}
            >
              <span className="inline-block group-hover:animate-wiggle mr-2" aria-hidden="true">
                {category.emoji}
              </span>
              {category.label}
              {isActive && (
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-50 blur -z-10 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
