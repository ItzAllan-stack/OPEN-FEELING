import React from 'react';
import { Users } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { toggleCommunityMembership } from '../services/firestoreService.ts';
import { Community } from '../types/index.ts';

interface CommunityCardProps {
  community: Community;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const { publicUser, joinedCommunityIds, navigate, showToast } = useApp();
  const isMember = joinedCommunityIds.includes(community.id);

  const handleToggleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!publicUser) {
      showToast('Sign in to join community spaces.', 'info');
      navigate('/login');
      return;
    }
    try {
      await toggleCommunityMembership(community, publicUser.uid, isMember);
      showToast(
        isMember
          ? `Left ${community.name}.`
          : `Joined ${community.name}.`,
        'success'
      );
    } catch {
      showToast('Could not update community membership.', 'error');
    }
  };

  return (
    <div
      onClick={() => navigate(`/community/${community.id}`)}
      className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-[#D5CCC3] transition-colors cursor-pointer"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: community.accentTone || '#F4DCE3' }}
          >
            <Users className="w-4 h-4 text-[#29272B]" />
          </div>
          <span className="text-xs text-[#6B6770] tabular-nums">
            {community.memberCount} members
          </span>
        </div>
        <h3 className="text-base font-display font-medium text-[#29272B]">
          {community.name}
        </h3>
        <p className="text-sm text-[#6B6770] leading-relaxed line-clamp-2">
          {community.description}
        </p>
      </div>

      <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#EAE4DD]/70">
        <span className="text-xs font-medium text-[#9F4E65]">Open space</span>
        <button
          type="button"
          onClick={handleToggleJoin}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            isMember
              ? 'bg-[#F8F6F3] border border-[#EAE4DD] text-[#29272B]'
              : 'bg-[#29272B] text-[#FCFBFA] hover:bg-[#3E3B41]'
          }`}
        >
          {isMember ? 'Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
}
