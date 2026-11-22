import React from 'react';

interface BrandLogoProps {
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function BrandLogo({ onClick, size = 'md' }: BrandLogoProps) {
  const iconSize = size === 'sm' ? 'w-7 h-7 rounded-lg' : 'w-8 h-8 rounded-xl';
  const textSize = size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9A9B8] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
      aria-label="OPEN FEELING Home"
    >
      <img
        src="/src/assets/images/open_felling_icon_1795332091293.webp"
        alt=""
        referrerPolicy="no-referrer"
        className={`${iconSize} object-cover border border-[#EAE4DD] bg-[#F8F6F3] shrink-0`}
      />
      <span className={`font-display font-medium tracking-tight text-[#29272B] ${textSize}`}>
        OPEN FEELING
      </span>
    </button>
  );
}
