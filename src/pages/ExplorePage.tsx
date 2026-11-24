import React, { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell.tsx';
import { EmotionSelector } from '../components/EmotionSelector.tsx';
import { LoadingSkeleton } from '../components/LoadingSkeleton.tsx';
import { PostCard } from '../components/PostCard.tsx';
import { SearchBar } from '../components/SearchBar.tsx';
import { useApp } from '../context/AppContext.tsx';
import { listPublicUsers } from '../services/firestoreService.ts';
import { EmotionId, PublicUser } from '../types/index.ts';
import { isSafeAvatarUrl } from '../utils/date.ts';

type ExploreCollection =
  | 'recent'
  | 'resonate'
  | 'supported'
  | 'positive'
  | 'life'
  | 'personal'
  | 'anonymous';

export function ExplorePage() {
  const { posts, postsLoading, communities, blockedEntries, navigate } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionId>('');
  const [collection, setCollection] = useState<ExploreCollection>('recent');
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);

  useEffect(() => {
    let active = true;
    listPublicUsers()
      .then((list) => {
        if (active) setPublicUsers(list);
      })
      .catch(() => {
        // Keep explore usable even if user directory fetch fails
      });
    return () => {
      active = false;
    };
  }, []);

  const collections: { id: ExploreCollection; label: string }[] = [
    { id: 'recent', label: 'Recently Shared' },
    { id: 'resonate', label: 'Stories That Resonate' },
    { id: 'supported', label: 'Most Supported' },
    { id: 'positive', label: 'Positive Moments' },
    { id: 'life', label: 'Life Experiences' },
    { id: 'personal', label: 'Personal Thoughts' },
    { id: 'anonymous', label: 'Anonymous Stories' },
  ];

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

  const results = useMemo(() => {
    // Strictly exclude private posts from discovery
    let list = posts.filter((p) => p.visibility !== 'private');

    if (collection === 'anonymous') {
      list = list.filter((p) => p.visibility === 'anonymous');
    } else if (collection === 'positive') {
      list = list.filter((p) =>
        ['happy', 'grateful', 'hopeful', 'excited', 'peaceful', 'in_love'].includes(p.emotion)
      );
    } else if (collection === 'life') {
      list = list.filter(
        (p) =>
          p.communityId === 'life-and-experiences' ||
          p.tags.some((t) => t.includes('life') || t.includes('memory'))
      );
    } else if (collection === 'personal') {
      list = list.filter((p) => !p.communityId || p.communityId === 'everyday-conversations');
    } else if (collection === 'resonate') {
      list = [...list].sort((a, b) => b.commentsCount - a.commentsCount);
    } else if (collection === 'supported') {
      list = [...list].sort((a, b) => {
        const sumA = Object.values(a.reactionCounts).reduce((s, n) => s + n, 0);
        const sumB = Object.values(b.reactionCounts).reduce((s, n) => s + n, 0);
        return sumB - sumA;
      });
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

    return list;
  }, [posts, collection, selectedEmotion, trimmedQuery]);

  const hasAnyMatches =
    results.length > 0 || matchingUsers.length > 0 || matchingCommunities.length > 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
            Explore &amp; Discover
          </h1>
          <p className="text-sm text-[#6B6770]">
            Find relatable stories by emotion, topic, tag, or public username. Private posts are never shown here.
          </p>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Discovery Collection Tabs */}
        <div className="flex flex-wrap gap-2">
          {collections.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCollection(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                collection === tab.id
                  ? 'bg-[#9F4E65] text-[#FCFBFA] border-[#9F4E65]'
                  : 'bg-[#F8F6F3] text-[#6B6770] border-[#EAE4DD] hover:text-[#29272B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Emotion Filter */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#6B6770]">Filter by emotion</p>
          <EmotionSelector value={selectedEmotion} onChange={setSelectedEmotion} />
        </div>

        {trimmedQuery && matchingUsers.length > 0 && (
          <section aria-label="Matching people" className="space-y-2.5">
            <h2 className="text-xs font-medium text-[#6B6770]">
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
                    <p className="text-xs text-[#6B6770] truncate">@{u.username}</p>
                    {u.bio && (
                      <p className="text-xs text-[#6B6770] line-clamp-1 mt-0.5">
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
            <h2 className="text-xs font-medium text-[#6B6770]">
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
                  <p className="text-xs text-[#6B6770] line-clamp-1 mt-0.5">
                    {c.description}
                  </p>
                  <p className="text-[11px] text-[#6B6770] tabular-nums mt-1">
                    {c.memberCount} members
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {postsLoading ? (
          <LoadingSkeleton count={3} />
        ) : !hasAnyMatches ? (
          <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-2">
            <p className="text-base font-display text-[#29272B]">
              {trimmedQuery ? 'No matching results found' : 'No matching public stories found'}
            </p>
            <p className="text-sm text-[#6B6770]">
              Try another keyword or clear your filters to browse recent reflections.
            </p>
          </div>
        ) : (
          results.length > 0 && (
            <div className="space-y-4">
              {trimmedQuery && (matchingUsers.length > 0 || matchingCommunities.length > 0) && (
                <h2 className="text-xs font-medium text-[#6B6770]">
                  Stories ({results.length})
                </h2>
              )}
              {results.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}
