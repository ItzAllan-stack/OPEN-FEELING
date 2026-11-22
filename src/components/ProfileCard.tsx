import React from 'react';
import { PublicUser } from '../types/index.ts';
import { formatFullDate, isSafeAvatarUrl } from '../utils/date.ts';

interface ProfileCardProps {
  user: PublicUser;
  actionSlot?: React.ReactNode;
}

export function ProfileCard({ user, actionSlot }: ProfileCardProps) {
  return (
    <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.avatarUrl && isSafeAvatarUrl(user.avatarUrl) ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover bg-[#EEE8E1] border border-[#EAE4DD] shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#F4DCE3] flex items-center justify-center text-xl font-display text-[#29272B] shrink-0">
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-display font-medium text-[#29272B]">
              {user.displayName}
            </h1>
            <p className="text-sm text-[#77727A]">@{user.username}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#77727A]">
              <span className="tabular-nums">
                <strong className="font-semibold text-[#29272B]">
                  {user.followersCount}
                </strong>{' '}
                followers
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                <strong className="font-semibold text-[#29272B]">
                  {user.followingCount}
                </strong>{' '}
                following
              </span>
              <span aria-hidden="true">·</span>
              <span>Joined {formatFullDate(user.joinedAt)}</span>
            </div>
          </div>
        </div>

        {actionSlot && <div className="flex flex-wrap items-center gap-2">{actionSlot}</div>}
      </div>

      {user.bio && (
        <p className="mt-4 pt-4 border-t border-[#EAE4DD] text-sm text-[#29272B]/90 leading-relaxed whitespace-pre-wrap">
          {user.bio}
        </p>
      )}
    </div>
  );
}
