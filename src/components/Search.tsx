import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EyeOff, FileText, Search as SearchIcon, Users, X } from 'lucide-react';
import { EMOTION_MAP } from '../constants/emotions.ts';
import { useApp } from '../context/AppContext.tsx';
import { subscribePublicUsers } from '../services/firestoreService.ts';
import { Post, PublicUser } from '../types/index.ts';
import { formatRelativeTime, isSafeAvatarUrl } from '../utils/date.ts';

export interface SearchProps {
  posts?: Post[];
  users?: PublicUser[];
  placeholder?: string;
  maxResultsPerSection?: number;
  variant?: 'header' | 'inline';
  autoFocus?: boolean;
  onSelectPost?: (post: Post) => void;
  onSelectUser?: (user: PublicUser) => void;
  onClose?: () => void;
  className?: string;
}

export function Search({
  posts: postsProp,
  users: usersProp,
  placeholder = 'Search posts or people...',
  maxResultsPerSection = 5,
  variant = 'inline',
  autoFocus = false,
  onSelectPost,
  onSelectUser,
  onClose,
  className = '',
}: SearchProps) {
  const { posts: contextPosts, blockedEntries, navigate } = useApp();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [subscribedUsers, setSubscribedUsers] = useState<PublicUser[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (usersProp !== undefined) return;
    const unsubscribe = subscribePublicUsers(setSubscribedUsers);
    return () => unsubscribe();
  }, [usersProp]);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const activePosts = postsProp ?? contextPosts;
  const activeUsers = usersProp ?? subscribedUsers;

  const blockedUids = useMemo(
    () => new Set(blockedEntries.map((entry) => entry.blockedUid)),
    [blockedEntries]
  );

  const trimmedQuery = query.trim().toLowerCase();

  const matchingUsers = useMemo(() => {
    if (!trimmedQuery) return [];
    return activeUsers.filter((user) => {
      if (blockedUids.has(user.uid)) return false;
      return (
        user.displayName.toLowerCase().includes(trimmedQuery) ||
        user.username.toLowerCase().includes(trimmedQuery) ||
        user.bio.toLowerCase().includes(trimmedQuery)
      );
    });
  }, [activeUsers, blockedUids, trimmedQuery]);

  const matchingPosts = useMemo(() => {
    if (!trimmedQuery) return [];
    return activePosts.filter((post) => {
      const emotionLabel = post.emotion
        ? EMOTION_MAP[post.emotion]?.label.toLowerCase() ?? ''
        : '';
      const inContent =
        post.title.toLowerCase().includes(trimmedQuery) ||
        post.content.toLowerCase().includes(trimmedQuery) ||
        post.emotion.toLowerCase().includes(trimmedQuery) ||
        emotionLabel.includes(trimmedQuery) ||
        post.communityName.toLowerCase().includes(trimmedQuery) ||
        post.tags.some((tag) => tag.toLowerCase().includes(trimmedQuery));
      const inAuthor =
        post.visibility === 'public' &&
        (post.authorName.toLowerCase().includes(trimmedQuery) ||
          post.authorUsername.toLowerCase().includes(trimmedQuery));
      return inContent || inAuthor;
    });
  }, [activePosts, trimmedQuery]);

  const visibleUsers = matchingUsers.slice(0, maxResultsPerSection);
  const visiblePosts = matchingPosts.slice(0, maxResultsPerSection);
  const showDropdown = isOpen && trimmedQuery.length > 0;

  const handleUserClick = (user: PublicUser) => {
    setIsOpen(false);
    setQuery('');
    if (onSelectUser) {
      onSelectUser(user);
    } else {
      navigate(`/profile/${user.uid}`);
    }
    onClose?.();
  };

  const handlePostClick = (post: Post) => {
    setIsOpen(false);
    setQuery('');
    if (onSelectPost) {
      onSelectPost(post);
    } else {
      navigate(`/post/${post.id}`);
    }
    onClose?.();
  };

  const isHeader = variant === 'header';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <SearchIcon className="w-4 h-4 text-[#77727A] absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-label={placeholder}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full pl-9 pr-8 bg-[#F8F6F3] border border-[#EAE4DD] text-[#29272B] placeholder:text-[#77727A] focus:outline-none focus:border-[#E9A9B8] focus:bg-[#FCFBFA] transition-colors ${
            isHeader
              ? 'py-1.5 rounded-xl text-xs sm:text-sm'
              : 'py-2.5 rounded-xl text-sm'
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2.5 p-1 text-[#77727A] hover:text-[#29272B] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          role="listbox"
          aria-label="Search results"
          className={`absolute top-full mt-2 z-50 bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl shadow-lg overflow-hidden ${
            isHeader ? 'right-0 w-[min(92vw,420px)]' : 'inset-x-0'
          }`}
        >
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-[#EAE4DD]">
            {visibleUsers.length === 0 && visiblePosts.length === 0 ? (
              <div className="p-6 text-center space-y-1">
                <p className="text-sm font-medium text-[#29272B]">
                  No matching posts or people found
                </p>
                <p className="text-xs text-[#77727A]">
                  Try another keyword, emotion, tag, or username.
                </p>
              </div>
            ) : (
              <>
                {visibleUsers.length > 0 && (
                  <div className="p-2.5 space-y-1">
                    <div className="px-2 py-1 flex items-center justify-between text-[11px] font-medium text-[#77727A]">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span>People</span>
                      </span>
                      <span className="tabular-nums">{matchingUsers.length}</span>
                    </div>
                    {visibleUsers.map((user) => (
                      <button
                        key={user.uid}
                        type="button"
                        role="option"
                        onClick={() => handleUserClick(user)}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-[#F8F6F3] text-left transition-colors cursor-pointer"
                      >
                        {user.avatarUrl && isSafeAvatarUrl(user.avatarUrl) ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover bg-[#EEE8E1] shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#F4DCE3] flex items-center justify-center text-xs font-display text-[#29272B] shrink-0">
                            {user.displayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[#29272B] truncate">
                            {user.displayName}
                          </p>
                          <p className="text-xs text-[#77727A] truncate">
                            @{user.username}
                            {user.bio ? ` · ${user.bio}` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {visiblePosts.length > 0 && (
                  <div className="p-2.5 space-y-1">
                    <div className="px-2 py-1 flex items-center justify-between text-[11px] font-medium text-[#77727A]">
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Posts</span>
                      </span>
                      <span className="tabular-nums">{matchingPosts.length}</span>
                    </div>
                    {visiblePosts.map((post) => {
                      const emotionMeta = post.emotion ? EMOTION_MAP[post.emotion] : null;
                      const isAnon = post.visibility === 'anonymous';
                      return (
                        <button
                          key={post.id}
                          type="button"
                          role="option"
                          onClick={() => handlePostClick(post)}
                          className="w-full flex items-start gap-3 px-2.5 py-2 rounded-xl hover:bg-[#F8F6F3] text-left transition-colors cursor-pointer"
                        >
                          {isAnon ? (
                            <div className="w-8 h-8 rounded-full bg-[#E9E5F2] flex items-center justify-center shrink-0 mt-0.5">
                              <EyeOff className="w-3.5 h-3.5 text-[#514766]" />
                            </div>
                          ) : post.authorAvatar && isSafeAvatarUrl(post.authorAvatar) ? (
                            <img
                              src={post.authorAvatar}
                              alt={post.authorName}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full object-cover bg-[#EEE8E1] shrink-0 mt-0.5"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#EEE8E1] flex items-center justify-center text-xs font-medium text-[#29272B] shrink-0 mt-0.5">
                              {post.authorName.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[#29272B] truncate">
                              {post.title || post.content}
                            </p>
                            {post.title && (
                              <p className="text-xs text-[#77727A] line-clamp-1">
                                {post.content}
                              </p>
                            )}
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#77727A]">
                              <span>{isAnon ? 'Anonymous' : post.authorName}</span>
                              {emotionMeta && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span style={{ color: emotionMeta.tintText }}>
                                    {emotionMeta.label}
                                  </span>
                                </>
                              )}
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">
                                {formatRelativeTime(post.createdAt)}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <div className="px-3 py-2 bg-[#F8F6F3]/60 flex items-center justify-between text-xs">
              <span className="text-[#77727A]">
                Real-time results across posts &amp; people
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/explore');
                  onClose?.();
                }}
                className="font-medium text-[#9F4E65] hover:underline cursor-pointer"
              >
                Open Explore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
