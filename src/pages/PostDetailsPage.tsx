import React, { useEffect, useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { AppShell } from '../components/AppShell.tsx';
import { CommentSection } from '../components/CommentSection.tsx';
import { LoadingSkeleton } from '../components/LoadingSkeleton.tsx';
import { PostCard } from '../components/PostCard.tsx';
import { useApp } from '../context/AppContext.tsx';
import { getPostById } from '../services/firestoreService.ts';
import { Post } from '../types/index.ts';

interface PostDetailsPageProps {
  postId: string;
}

export function PostDetailsPage({ postId }: PostDetailsPageProps) {
  const { posts, navigate } = useApp();
  const [post, setPost] = useState<Post | null>(() => {
    return posts.find((p) => p.id === postId) || null;
  });
  const [loading, setLoading] = useState(!post);

  useEffect(() => {
    const found = posts.find((p) => p.id === postId);
    if (found) {
      setPost(found);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getPostById(postId)
      .then((res) => {
        if (!cancelled) {
          setPost(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [postId, posts]);

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#77727A] hover:text-[#29272B] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to stories</span>
        </button>

        {post && !loading && (
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#77727A] hover:text-[#29272B] cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print this reflection</span>
          </button>
        )}

        {loading ? (
          <LoadingSkeleton count={1} />
        ) : !post ? (
          <div className="bg-[#F8F6F3] border border-[#EAE4DD] rounded-2xl p-8 text-center space-y-3">
            <h1 className="text-xl font-display text-[#29272B]">Story not available</h1>
            <p className="text-sm text-[#77727A]">
              This reflection may be private to its author or may have been removed.
            </p>
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="px-4 py-2 rounded-xl bg-[#29272B] text-[#FCFBFA] text-xs font-medium cursor-pointer"
            >
              Explore Community
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <PostCard post={post} showFullContent />
            <div className="bg-[#FCFBFA] border border-[#EAE4DD] rounded-2xl p-6">
              <CommentSection post={post} />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
