import React from 'react';
import { Bookmark } from 'lucide-react';
import { AppShell } from '../components/AppShell.tsx';
import { PostCard } from '../components/PostCard.tsx';
import { useApp } from '../context/AppContext.tsx';

export function SavedPostsPage() {
  const { publicUser, posts, savedPostIds, navigate } = useApp();

  if (!publicUser) {
    return (
      <AppShell>
        <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-3">
          <h1 className="text-xl font-display text-[#29272B]">Sign in to view Saved Posts</h1>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </AppShell>
    );
  }

  const savedPosts = posts.filter((p) => savedPostIds.includes(p.id));

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
            Saved Posts
          </h1>
          <p className="text-sm text-[#77727A]">
            Reflections you wanted to keep close and return to later.
          </p>
        </div>

        {savedPosts.length === 0 ? (
          <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-3">
            <Bookmark className="w-6 h-6 text-[#77727A] mx-auto" />
            <p className="text-base font-display text-[#29272B]">No saved posts yet</p>
            <p className="text-sm text-[#77727A]">
              Tap Save on any story in your feed or Explore to bookmark it here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
            >
              Browse Stories
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
