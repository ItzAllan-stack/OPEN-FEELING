import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '../components/AppShell.tsx';
import { PostComposer } from '../components/PostComposer.tsx';
import { useApp } from '../context/AppContext.tsx';

export function CreatePostPage() {
  const { navigate } = useApp();

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#77727A] hover:text-[#29272B] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to feed</span>
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-display font-medium text-[#29272B]">
            Express Your Feelings
          </h1>
          <p className="text-sm text-[#77727A]">
            Whether you want to be heard publicly, stay anonymous, or keep a reflection strictly private—this space is yours.
          </p>
        </div>

        <PostComposer onPublished={(postId) => navigate(`/post/${postId}`)} />
      </div>
    </AppShell>
  );
}
