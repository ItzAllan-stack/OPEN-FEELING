import React, { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell.tsx';
import { LoadingSkeleton } from '../components/LoadingSkeleton.tsx';
import { PostCard } from '../components/PostCard.tsx';
import { PostComposer } from '../components/PostComposer.tsx';
import { SearchBar } from '../components/SearchBar.tsx';
import { DAILY_REFLECTIONS, EMOTIONS } from '../constants/emotions.ts';
import { useApp } from '../context/AppContext.tsx';
import { listPublicUsers } from '../services/firestoreService.ts';
import { EmotionId, PublicUser } from '../types/index.ts';
import { isSafeAvatarUrl } from '../utils/date.ts';

export function HomeFeedPage() {
  const {
    firebaseUser,
    publicUser,
    posts,
    postsLoading,
    communities,
    followingUids,
    blockedEntries,
    resendVerificationEmail,
    navigate,
  } = useApp();

  const [feedFilter, setFeedFilter] = useState<'latest' | 'supported' | 'following'>('latest');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionId>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);

  useEffect(() => {
    let active = true;
    listPublicUsers()
      .then((list) => {
        if (active) setPublicUsers(list);
      })
      .catch(() => {
        // Keep feed usable even if user directory fetch fails
      });
    return () => {
      active = false;
    };
  }, []);

  const dailyPrompt = useMemo(() => {
    const dayIndex = new Date().getDate() % DAILY_REFLECTIONS.length;
    return DAILY_REFLECTIONS[dayIndex];
  }, []);

  const trendingEmotions = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      if (p.emotion) counts[p.emotion] = (counts[p.emotion] || 0) + 1;
    });
    return EMOTIONS.map((e) => ({ ...e, count: counts[e.id] || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [posts]);

  const blockedUids = useMemo(
    () => new Set(blockedEntries.map((entry) => entry.blockedUid)),
    [blockedEntries]
  );

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchingUsers = useMemo(() => {
    if (!trimmedQuery) return [];
    return publicUsers.filter((u) => {
      if (blockedUids.has(u.uid)) return false;
      return (
        u.displayName.toLowerCase().includes(trimmedQuery) ||
        u.username.toLowerCase().includes(trimmedQuery) ||
        u.bio.toLowerCase().includes(trimmedQuery)
      );
    });
  }, [publicUsers, blockedUids, trimmedQuery]);

  const matchingCommunities = useMemo(() => {
    if (!trimmedQuery) return [];
    return communities.filter(
      (c) =>
        c.name.toLowerCase().includes(trimmedQuery) ||
        c.description.toLowerCase().includes(trimmedQuery)
    );
  }, [communities, trimmedQuery]);

  const filteredPosts = useMemo(() => {
    let list = [...posts];
    if (feedFilter === 'following') {
      list = list.filter((p) => followingUids.includes(p.authorUid));
    }
    if (selectedEmotion) {
      list = list.filter((p) => p.emotion === selectedEmotion);
    }
    if (trimmedQuery) {
      list = list.filter((p) => {
        const inText =
          p.title.toLowerCase().includes(trimmedQuery) ||
          p.content.toLowerCase().includes(trimmedQuery) ||
          p.communityName.toLowerCase().includes(trimmedQuery) ||
          p.emotion.toLowerCase().includes(trimmedQuery) ||
          p.tags.some((t) => t.toLowerCase().includes(trimmedQuery));
        const inAuthor =
          p.visibility === 'public' &&
          (p.authorUsername.toLowerCase().includes(trimmedQuery) ||
            p.authorName.toLowerCase().includes(trimmedQuery));
        return inText || inAuthor;
      });
    }
    if (feedFilter === 'supported') {
      list.sort((a, b) => {
        const totalA = Object.values(a.reactionCounts).reduce((s, n) => s + n, 0);
        const totalB = Object.values(b.reactionCounts).reduce((s, n) => s + n, 0);
        return totalB - totalA;
      });
    }
    return list;
  }, [posts, feedFilter, followingUids, selectedEmotion, trimmedQuery]);

  const hasAnyMatches =
    filteredPosts.length > 0 || matchingUsers.length > 0 || matchingCommunities.length > 0;

  const rightSidebar = (
    <div className="space-y-5">
      {/* Today's Reflection */}
      <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-5 space-y-2.5">
        <p className="text-xs font-medium text-[#9F4E65]">Today&apos;s Reflection</p>
        <p className="text-sm text-[#29272B] leading-relaxed font-display">
          {dailyPrompt}
        </p>
        <button
          type="button"
          onClick={() => navigate('/journal')}
          className="text-xs font-medium text-[#29272B] underline underline-offset-4 hover:text-[#9F4E65] cursor-pointer"
        >
          Write in My Personal Space
        </button>
      </div>

      {/* Trending Emotions */}
      <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-medium text-[#29272B]">Feelings Shared Today</h3>
        <div className="space-y-2">
          {trendingEmotions.map((emotion) => (
            <button
              key={emotion.id}
              type="button"
              onClick={() =>
                setSelectedEmotion(selectedEmotion === emotion.id ? '' : emotion.id)
              }
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                selectedEmotion === emotion.id
                  ? 'bg-[#F4DCE3]/60 text-[#29272B] font-medium'
                  : 'hover:bg-[#F8F6F3] text-[#77727A]'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: emotion.dotColor }}
                />
                <span className="text-[#29272B]">{emotion.label}</span>
              </span>
              <span className="tabular-nums">{emotion.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Communities */}
      <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#29272B]">Suggested Communities</h3>
          <button
            type="button"
            onClick={() => navigate('/communities')}
            className="text-xs text-[#9F4E65] hover:underline cursor-pointer"
          >
            See all
          </button>
        </div>
        <div className="space-y-2.5">
          {communities.slice(0, 4).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate(`/community/${c.id}`)}
              className="w-full text-left p-2.5 rounded-xl hover:bg-[#F8F6F3] transition-colors cursor-pointer"
            >
              <p className="text-xs font-medium text-[#29272B]">{c.name}</p>
              <p className="text-[11px] text-[#77727A] tabular-nums mt-0.5">
                {c.memberCount} members
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Community Highlights */}
      <div className="bg-[#DCE8DD]/35 border border-[#EAE4DD] rounded-2xl p-5 space-y-2">
        <h3 className="text-sm font-medium text-[#29272B]">Community Highlights</h3>
        <p className="text-xs text-[#77727A] leading-relaxed">
          Thank you for listening kindly. Every empathetic reaction helps someone feel a little lighter today.
        </p>
      </div>
    </div>
  );

  return (
    <AppShell rightSidebar={rightSidebar}>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
            {publicUser ? `Welcome back, ${publicUser.displayName}` : 'Community Feed'}
          </h1>
          <p className="text-sm text-[#77727A]">
            Take your time. Share what feels honest, or read softly alongside others.
          </p>
        </div>

        {firebaseUser && !firebaseUser.emailVerified && (
          <div className="p-4 rounded-xl bg-[#F9F0E3] border border-[#E5D3B8] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B4E23]">
            <span>Please verify your email address to unlock full account safeguards.</span>
            <button
              type="button"
              onClick={resendVerificationEmail}
              className="font-medium underline cursor-pointer"
            >
              Resend verification email
            </button>
          </div>
        )}

        {/* Feelings-Sharing Composer */}
        <PostComposer compact />

        {/* Search Content & Users */}
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Feed Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1 p-1 bg-[#F8F6F3] border border-[#EAE4DD] rounded-xl">
            {[
              { id: 'latest', label: 'Latest' },
              { id: 'supported', label: 'Most Supported' },
              { id: 'following', label: 'Following' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFeedFilter(tab.id as typeof feedFilter)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  feedFilter === tab.id
                    ? 'bg-[#FCFBFA] text-[#29272B] shadow-xs border border-[#EAE4DD]'
                    : 'text-[#77727A] hover:text-[#29272B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={selectedEmotion}
            onChange={(e) => setSelectedEmotion(e.target.value as EmotionId)}
            aria-label="Filter feed by emotion"
            className="px-3 py-2 rounded-xl bg-[#F8F6F3] border border-[#EAE4DD] text-xs font-medium text-[#29272B] focus:outline-none focus:border-[#E9A9B8]"
          >
            <option value="">All Emotions</option>
            {EMOTIONS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        {trimmedQuery && matchingUsers.length > 0 && (
          <section aria-label="Matching people" className="space-y-2.5">
            <h2 className="text-xs font-medium text-[#77727A]">
              People ({matchingUsers.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matchingUsers.map((u) => (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => navigate(`/profile/${u.uid}`)}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FCFBFA] border border-[#EAE4DD] hover:border-[#DFD6CD] text-left transition-colors cursor-pointer"
                >
                  {u.avatarUrl && isSafeAvatarUrl(u.avatarUrl) ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.displayName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover bg-[#EEE8E1] shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#F4DCE3] flex items-center justify-center text-sm font-display text-[#29272B] shrink-0">
                      {u.displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#29272B] truncate">
                      {u.displayName}
                    </p>
                    <p className="text-xs text-[#77727A] truncate">@{u.username}</p>
                    {u.bio && (
                      <p className="text-xs text-[#77727A] line-clamp-1 mt-0.5">
                        {u.bio}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {trimmedQuery && matchingCommunities.length > 0 && (
          <section aria-label="Matching communities" className="space-y-2.5">
            <h2 className="text-xs font-medium text-[#77727A]">
              Communities ({matchingCommunities.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matchingCommunities.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/community/${c.id}`)}
                  className="p-3.5 rounded-2xl bg-[#FCFBFA] border border-[#EAE4DD] hover:border-[#DFD6CD] text-left transition-colors cursor-pointer"
                >
                  <p className="text-sm font-semibold text-[#29272B] truncate">
                    {c.name}
                  </p>
                  <p className="text-xs text-[#77727A] line-clamp-1 mt-0.5">
                    {c.description}
                  </p>
                  <p className="text-[11px] text-[#77727A] tabular-nums mt-1">
                    {c.memberCount} members
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Feed */}
        {postsLoading ? (
          <LoadingSkeleton count={3} />
        ) : !hasAnyMatches ? (
          <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-3">
            <p className="text-base font-display text-[#29272B]">
              No reflections match this filter yet
            </p>
            <p className="text-sm text-[#77727A]">
              {trimmedQuery
                ? 'Try a different search term or clear your search to see all stories.'
                : feedFilter === 'following'
                ? 'Follow people in Explore to see their reflections here.'
                : 'Try clearing the emotion filter or share the first thought.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setFeedFilter('latest');
                setSelectedEmotion('');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
            >
              Show All Stories
            </button>
          </div>
        ) : (
          filteredPosts.length > 0 && (
            <div className="space-y-4">
              {trimmedQuery && (matchingUsers.length > 0 || matchingCommunities.length > 0) && (
                <h2 className="text-xs font-medium text-[#77727A]">
                  Stories ({filteredPosts.length})
                </h2>
              )}
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}
