import { useState } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { BrandLogo } from './BrandLogo.tsx';
import { Search } from './Search.tsx';

export function Header() {
  const { firebaseUser, publicUser, currentPath, navigate } = useApp();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const isLanding = currentPath === '/';

  return (
    <header className="sticky top-0 z-40 bg-[#FCFBFA]/92 backdrop-blur-sm border-b border-[#EAE4DD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 xl:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <BrandLogo onClick={() => navigate(firebaseUser && publicUser ? '/home' : '/')} />

        {/* Zone 2: Concise single-line nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-4 lg:gap-5 xl:gap-6 text-sm font-medium text-[#6B6770]"
        >
          <button
            type="button"
            onClick={() => navigate(firebaseUser && publicUser ? '/home' : '/explore')}
            className={`hover:text-[#29272B] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentPath === '/home' || currentPath === '/explore' ? 'text-[#29272B] underline underline-offset-8 decoration-[#E9A9B8] decoration-2' : ''
            }`}
          >
            {firebaseUser && publicUser ? 'Home Feed' : 'Explore'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/communities')}
            className={`hover:text-[#29272B] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentPath.startsWith('/community') || currentPath === '/communities'
                ? 'text-[#29272B] underline underline-offset-8 decoration-[#E9A9B8] decoration-2'
                : ''
            }`}
          >
            Communities
          </button>
          <button
            type="button"
            onClick={() => navigate('/journal')}
            className={`hover:text-[#29272B] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentPath === '/journal'
                ? 'text-[#29272B] underline underline-offset-8 decoration-[#E9A9B8] decoration-2'
                : ''
            }`}
          >
            Personal Space
          </button>
          <button
            type="button"
            onClick={() => navigate('/guidelines')}
            className={`hover:text-[#29272B] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              currentPath === '/guidelines'
                ? 'text-[#29272B] underline underline-offset-8 decoration-[#E9A9B8] decoration-2'
                : ''
            }`}
          >
            Guidelines
          </button>
          {!firebaseUser && !isLanding && (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="hover:text-[#29272B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          )}
        </nav>

        {/* Zone 3: Global Search + Single Primary Action */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Search
            variant="header"
            className="hidden lg:block w-44 xl:w-64"
          />

          <button
            type="button"
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            aria-label={mobileSearchOpen ? 'Close global search' : 'Open global search'}
            aria-expanded={mobileSearchOpen}
            className="lg:hidden p-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-[#6B6770] hover:text-[#29272B] transition-colors cursor-pointer"
          >
            {mobileSearchOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <SearchIcon className="w-4 h-4" />
            )}
          </button>

          {firebaseUser && publicUser ? (
            <button
              type="button"
              onClick={() => navigate('/create')}
              className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-sm font-medium hover:bg-[#3E3B41] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Share Feelings
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-sm font-medium hover:bg-[#3E3B41] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Share Your Feelings
            </button>
          )}
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="lg:hidden border-t border-[#EAE4DD] bg-[#FCFBFA] px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto">
            <Search
              variant="inline"
              autoFocus
              onClose={() => setMobileSearchOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
}
