import { useEffect, useState } from 'react';
import { MEANINGFUL_REACTIONS } from '../constants/emotions.ts';
import { useApp } from '../context/AppContext.tsx';
import {
  subscribePostReactions,
  togglePostReaction,
} from '../services/firestoreService.ts';
import { Post, ReactionType } from '../types/index.ts';

interface ReactionBarProps {
  post: Post;
  compact?: boolean;
}

export function ReactionBar({ post, compact = false }: ReactionBarProps) {
  const { publicUser, navigate, showToast } = useApp();
  const [userReactionsMap, setUserReactionsMap] = useState<
    Record<string, ReactionType[]>
  >({});
  const [busyType, setBusyType] = useState<ReactionType | null>(null);

  useEffect(() => {
    if (post.isStarterSample) return;
    const unsub = subscribePostReactions(post.id, setUserReactionsMap);
    return () => unsub();
  }, [post.id, post.isStarterSample]);

  const myReactions = publicUser ? userReactionsMap[publicUser.uid] || [] : [];

  const handleToggle = async (type: ReactionType) => {
    if (!publicUser) {
      showToast('Please sign in to send support to others.', 'info');
      navigate('/login');
      return;
    }
    if (post.isStarterSample) {
      showToast('Publish or open a community post to persist reactions.', 'info');
      return;
    }
    if (busyType) return;

    const currentlyActive = myReactions.includes(type);
    setBusyType(type);
    try {
      await togglePostReaction({
        post,
        actor: publicUser,
        type,
        currentlyActive,
      });
    } catch {
      showToast('Could not update your reaction right now.', 'error');
    } finally {
      setBusyType(null);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label="Supportive reactions"
    >
      {MEANINGFUL_REACTIONS.map((item) => {
        const active = myReactions.includes(item.type);
        const count = post.reactionCounts?.[item.type] ?? 0;

        return (
          <button
            key={item.type}
            type="button"
            disabled={busyType === item.type}
            onClick={() => handleToggle(item.type)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              active
                ? 'bg-[#F4DCE3]/70 border-[#E9A9B8] text-[#29272B]'
                : 'bg-[#FCFBFA] border-[#EAE4DD] text-[#6B6770] hover:text-[#29272B] hover:bg-[#F8F6F3]'
            }`}
          >
            <span aria-hidden="true">{item.symbol}</span>
            {(!compact || active || count > 0) && (
              <span>{item.label}</span>
            )}
            {count > 0 && (
              <span className="tabular-nums text-[11px] font-semibold text-[#29272B]/80">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
